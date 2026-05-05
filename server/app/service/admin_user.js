'use strict';

const bcrypt = require('bcryptjs');
const BaseService = require('./base');

class AdminUserService extends BaseService {
  /**
   * 获取管理员列表
   * - 支持关键词、状态筛选
   * - 统一返回分页结构和角色信息
   * @param {object} payload - 查询参数
   * @return {object} 分页结果
   */
  async list(payload) {
    const { ctx, app } = this;
    const { page, pageSize, offset, limit } = this.normalizePagination(payload);
    const where = {};
    const keyword = String(payload.keyword || '').trim();
    const status = payload.status === '' || payload.status == null ? null : Number(payload.status);
    const Op = app.Sequelize.Op;

    if (!Number.isNaN(status) && status != null) {
      if (![ 0, 1 ].includes(status)) {
        this.throwBusinessError(400, '管理员状态参数不合法');
      }
      where.status = status;
    }

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { realName: { [Op.like]: `%${keyword}%` } },
        { mobile: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const result = await ctx.model.Admin.findAndCountAll({
      where,
      include: [
        {
          model: ctx.model.Role,
          as: 'roles',
          attributes: [ 'id', 'name', 'code', 'status' ],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [
        [ 'id', 'DESC' ],
      ],
      distinct: true,
      offset,
      limit,
    });

    return {
      list: result.rows.map(item => this._formatAdmin(item)),
      total: result.count,
      page,
      pageSize,
    };
  }

  /**
   * 新增管理员
   * - 写入管理员基础信息
   * - 使用事务同步写入角色关联
   * @param {object} payload - 管理员数据
   * @return {object} 新增后的管理员信息
   */
  async create(payload) {
    const { ctx } = this;
    const normalizedPayload = await this._normalizeCreatePayload(payload);
    await this._ensureUsernameUnique(normalizedPayload.username);
    const roles = await this._getRolesByIds(normalizedPayload.roleIds);
    if (roles.length !== normalizedPayload.roleIds.length) {
      this.throwBusinessError(404, '存在无效的角色 ID');
    }

    const transaction = await ctx.model.transaction();
    try {
      const password = await bcrypt.hash(normalizedPayload.password, 10);
      const admin = await ctx.model.Admin.create({
        username: normalizedPayload.username,
        password,
        realName: normalizedPayload.realName,
        avatar: normalizedPayload.avatar,
        mobile: normalizedPayload.mobile,
        email: normalizedPayload.email,
        status: 1,
        isSuper: 0,
      }, { transaction });

      if (normalizedPayload.roleIds.length) {
        await ctx.model.AdminRole.bulkCreate(normalizedPayload.roleIds.map(roleId => ({
          adminId: admin.id,
          roleId,
        })), { transaction });
      }

      await transaction.commit();

      return await this._getAdminDetail(admin.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 编辑管理员基础信息和角色
   * - 普通管理员不能修改超级管理员，也不能修改自己的角色归属
   * - 使用事务保证管理员主表和角色关联一致
   * @param {number} targetAdminId - 目标管理员 ID
   * @param {object} payload - 编辑参数
   * @param {object} operator - 当前操作管理员
   * @return {object} 更新后的管理员信息
   */
  async update(targetAdminId, payload, operator) {
    const { ctx } = this;
    const admin = await ctx.model.Admin.findByPk(targetAdminId);
    if (!admin) {
      this.throwBusinessError(404, '管理员不存在');
    }

    const normalizedPayload = await this._normalizeUpdatePayload(payload);
    this._assertAdminOperationAllowed(admin, operator, {
      allowEditSuper: false,
      checkSelfRoleChange: normalizedPayload.roleIds !== null,
    });

    if (normalizedPayload.username && normalizedPayload.username !== admin.username) {
      await this._ensureUsernameUnique(normalizedPayload.username, admin.id);
    }

    let roles = [];
    if (normalizedPayload.roleIds) {
      roles = await this._getRolesByIds(normalizedPayload.roleIds);
      if (roles.length !== normalizedPayload.roleIds.length) {
        this.throwBusinessError(404, '存在无效的角色 ID');
      }
    }

    const transaction = await ctx.model.transaction();
    try {
      await admin.update({
        username: normalizedPayload.username,
        realName: normalizedPayload.realName,
        avatar: normalizedPayload.avatar,
        mobile: normalizedPayload.mobile,
        email: normalizedPayload.email,
      }, { transaction });

      if (normalizedPayload.roleIds) {
        await ctx.model.AdminRole.destroy({
          where: { adminId: admin.id },
          transaction,
        });

        if (normalizedPayload.roleIds.length) {
          await ctx.model.AdminRole.bulkCreate(normalizedPayload.roleIds.map(roleId => ({
            adminId: admin.id,
            roleId,
          })), { transaction });
        }
      }

      await transaction.commit();
      return await this._getAdminDetail(admin.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 修改管理员状态
   * - 用于禁用和启用管理员
   * - 禁止禁用超级管理员
   * @param {number} targetAdminId - 目标管理员 ID
   * @param {number} status - 目标状态
   * @param {object} operator - 当前操作管理员
   * @return {object} 更新后的管理员信息
   */
  async updateStatus(targetAdminId, status, operator) {
    const { ctx } = this;
    const admin = await ctx.model.Admin.findByPk(targetAdminId);
    if (!admin) {
      this.throwBusinessError(404, '管理员不存在');
    }

    this._assertAdminOperationAllowed(admin, operator, {
      allowEditSuper: false,
    });

    const safeStatus = Number(status);
    if (![ 0, 1 ].includes(safeStatus)) {
      this.throwBusinessError(400, '管理员状态不合法');
    }

    await admin.update({ status: safeStatus });
    return await this._getAdminDetail(admin.id);
  }

  /**
   * 重置管理员密码
   * - 仅超级管理员可重置他人密码
   * - 不提供通过本接口修改本人密码的能力
   * @param {number} targetAdminId - 目标管理员 ID
   * @param {string} newPassword - 新密码
   * @param {object} operator - 当前操作管理员
   */
  async resetPassword(targetAdminId, newPassword, operator) {
    const { ctx } = this;
    if (!(operator.isSuper === 1 || operator.isSuper === true)) {
      this.throwBusinessError(403, '仅超级管理员可重置密码');
    }

    if (Number(targetAdminId) === Number(operator.adminId)) {
      this.throwBusinessError(403, '请勿通过该接口重置自己的密码');
    }

    const admin = await ctx.model.Admin.findByPk(targetAdminId);
    if (!admin) {
      this.throwBusinessError(404, '管理员不存在');
    }

    const safePassword = String(newPassword || '');
    if (!safePassword.trim()) {
      this.throwBusinessError(400, '新密码不能为空');
    }

    const password = await bcrypt.hash(safePassword, 10);
    await admin.update({ password });
  }

  /**
   * 软删除管理员
   * - 禁止删除超级管理员
   * - 同时清理角色关联，避免后续角色删除受阻
   * @param {number} targetAdminId - 目标管理员 ID
   * @param {object} operator - 当前操作管理员
   */
  async remove(targetAdminId, operator) {
    const { ctx } = this;
    const admin = await ctx.model.Admin.findByPk(targetAdminId);
    if (!admin) {
      this.throwBusinessError(404, '管理员不存在');
    }

    this._assertAdminOperationAllowed(admin, operator, {
      allowEditSuper: false,
    });

    const transaction = await ctx.model.transaction();
    try {
      await ctx.model.AdminRole.destroy({
        where: { adminId: admin.id },
        transaction,
      });

      await admin.update({
        deletedAt: new Date(),
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 查询管理员详情
   * @param {number} adminId - 管理员 ID
   * @return {object} 管理员详情
   * @private
   */
  async _getAdminDetail(adminId) {
    const { ctx } = this;
    const admin = await ctx.model.Admin.findByPk(adminId, {
      include: [
        {
          model: ctx.model.Role,
          as: 'roles',
          attributes: [ 'id', 'name', 'code', 'status' ],
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    return this._formatAdmin(admin);
  }

  /**
   * 校验管理员操作范围
   * @param {object} targetAdmin - 目标管理员
   * @param {object} operator - 当前操作管理员
   * @param {object} options - 额外限制项
   * @private
   */
  _assertAdminOperationAllowed(targetAdmin, operator, options = {}) {
    const isSuperOperator = operator.isSuper === 1 || operator.isSuper === true;
    if (!isSuperOperator && targetAdmin.isSuper === 1 && !options.allowEditSuper) {
      this.throwBusinessError(403, '无权操作超级管理员账号');
    }

    if (!isSuperOperator && options.checkSelfRoleChange && Number(targetAdmin.id) === Number(operator.adminId)) {
      this.throwBusinessError(403, '普通管理员不能修改自己的角色归属');
    }
  }

  /**
   * 规范化新增管理员入参
   * @param {object} payload - 原始入参
   * @return {object} 规范化结果
   * @private
   */
  async _normalizeCreatePayload(payload) {
    const username = String(payload.username || '').trim();
    const password = String(payload.password || '');
    const realName = String(payload.realName || '').trim();
    const mobile = this._normalizeNullableString(payload.mobile);
    const email = this._normalizeNullableString(payload.email);
    const avatar = this._normalizeNullableString(payload.avatar);
    const roleIds = this._normalizeRoleIds(payload.roleIds);

    if (!username) {
      this.throwBusinessError(400, '管理员账号不能为空');
    }

    if (!password.trim()) {
      this.throwBusinessError(400, '管理员密码不能为空');
    }

    if (!realName) {
      this.throwBusinessError(400, '管理员姓名不能为空');
    }

    return {
      username,
      password,
      realName,
      mobile,
      email,
      avatar,
      roleIds,
    };
  }

  /**
   * 规范化编辑管理员入参
   * @param {object} payload - 原始入参
   * @return {object} 规范化结果
   * @private
   */
  async _normalizeUpdatePayload(payload) {
    const username = String(payload.username || '').trim();
    const realName = String(payload.realName || '').trim();
    const mobile = this._normalizeNullableString(payload.mobile);
    const email = this._normalizeNullableString(payload.email);
    const avatar = this._normalizeNullableString(payload.avatar);
    const roleIds = Object.prototype.hasOwnProperty.call(payload, 'roleIds') ?
      this._normalizeRoleIds(payload.roleIds) :
      null;

    if (!username) {
      this.throwBusinessError(400, '管理员账号不能为空');
    }

    if (!realName) {
      this.throwBusinessError(400, '管理员姓名不能为空');
    }

    return {
      username,
      realName,
      mobile,
      email,
      avatar,
      roleIds,
    };
  }

  /**
   * 校验用户名唯一性
   * - 包含软删除记录一起检查，避免命中数据库唯一索引
   * @param {string} username - 管理员用户名
   * @param {number} excludeAdminId - 排除的管理员 ID
   * @private
   */
  async _ensureUsernameUnique(username, excludeAdminId = null) {
    const { ctx } = this;
    const admin = await ctx.model.Admin.findOne({
      where: { username },
      paranoid: false,
    });

    if (admin && admin.id !== excludeAdminId) {
      this.throwBusinessError(409, '管理员账号已存在');
    }
  }

  /**
   * 根据角色 ID 查询角色
   * @param {number[]} roleIds - 角色 ID 列表
   * @return {Array} 角色列表
   * @private
   */
  async _getRolesByIds(roleIds) {
    if (!roleIds.length) {
      return [];
    }

    return await this.ctx.model.Role.findAll({
      where: { id: roleIds },
    });
  }

  /**
   * 规范化角色 ID 数组
   * @param {Array} roleIds - 原始角色 ID
   * @return {number[]} 去重后的角色 ID 列表
   * @private
   */
  _normalizeRoleIds(roleIds) {
    if (!Array.isArray(roleIds)) {
      this.throwBusinessError(400, '角色 ID 列表格式不正确');
    }

    return Array.from(new Set(
      roleIds
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    ));
  }

  /**
   * 格式化管理员输出
   * @param {object} admin - 管理员实例或原始对象
   * @return {object} 响应数据
   * @private
   */
  _formatAdmin(admin) {
    const plainAdmin = typeof admin.get === 'function' ? admin.get({ plain: true }) : admin;

    return {
      id: plainAdmin.id,
      username: plainAdmin.username,
      realName: plainAdmin.realName,
      avatar: plainAdmin.avatar,
      mobile: plainAdmin.mobile,
      email: plainAdmin.email,
      status: plainAdmin.status,
      isSuper: plainAdmin.isSuper,
      lastLoginAt: this.formatDateTime(plainAdmin.lastLoginAt),
      lastLoginIp: plainAdmin.lastLoginIp,
      roleIds: Array.from(new Set((plainAdmin.roles || []).map(item => item.id))).sort((prev, next) => prev - next),
      roles: (plainAdmin.roles || []).map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        status: item.status,
      })),
      createdAt: this.formatDateTime(plainAdmin.createdAt),
      updatedAt: this.formatDateTime(plainAdmin.updatedAt),
    };
  }

  /**
   * 将空字符串转换为 null
   * @param {any} value - 原始值
   * @return {string|null} 规范化结果
   * @private
   */
  _normalizeNullableString(value) {
    if (value == null) {
      return null;
    }

    const trimmedValue = String(value).trim();
    return trimmedValue ? trimmedValue : null;
  }
}

module.exports = AdminUserService;
