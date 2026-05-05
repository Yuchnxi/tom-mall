'use strict';

const BaseService = require('./base');

class AdminRoleService extends BaseService {
  /**
   * 获取角色列表
   * - 返回角色基础信息和已分配菜单 ID 列表
   * - 用于角色管理列表和菜单分配弹层回填
   * @return {Array} 角色列表
   */
  async list() {
    const { ctx } = this;
    const roles = await ctx.model.Role.findAll({
      include: [
        {
          model: ctx.model.Menu,
          as: 'menus',
          attributes: [ 'id' ],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [
        [ 'sort', 'ASC' ],
        [ 'id', 'ASC' ],
      ],
    });

    return roles.map(role => this._formatRole(role));
  }

  /**
   * 新增角色
   * - 校验角色名称和编码唯一性
   * - 初始化时不分配菜单，由独立接口处理
   * @param {object} payload - 角色数据
   * @return {object} 新增后的角色
   */
  async create(payload) {
    const { ctx } = this;
    const normalizedPayload = await this._normalizePayload(payload);
    await this._ensureCodeUnique(normalizedPayload.code);

    const role = await ctx.model.Role.create(normalizedPayload);
    return this._formatRole(role);
  }

  /**
   * 编辑角色基础信息
   * - 仅更新角色基础字段，不处理菜单分配
   * @param {number} roleId - 角色 ID
   * @param {object} payload - 角色数据
   * @return {object} 更新后的角色
   */
  async update(roleId, payload) {
    const role = await this._getRoleById(roleId);
    if (!role) {
      this.throwBusinessError(404, '角色不存在');
    }

    const normalizedPayload = await this._normalizePayload(payload);
    await this._ensureCodeUnique(normalizedPayload.code, roleId);
    await role.update(normalizedPayload);

    return this._formatRole(role);
  }

  /**
   * 分配角色菜单
   * - 使用事务全量覆盖 role_menus
   * - 自动补齐祖先菜单，避免登录返回树结构断层
   * @param {number} roleId - 角色 ID
   * @param {number[]} menuIds - 目标菜单 ID 列表
   * @return {object} 最新角色数据
   */
  async assignMenus(roleId, menuIds) {
    const { ctx } = this;
    const role = await this._getRoleById(roleId);
    if (!role) {
      this.throwBusinessError(404, '角色不存在');
    }

    const finalMenuIds = await this._expandMenuIds(menuIds);
    const transaction = await ctx.model.transaction();

    try {
      await ctx.model.RoleMenu.destroy({
        where: { roleId },
        transaction,
      });

      if (finalMenuIds.length) {
        await ctx.model.RoleMenu.bulkCreate(finalMenuIds.map(menuId => ({
          roleId,
          menuId,
        })), { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const latestRole = await ctx.model.Role.findByPk(roleId, {
      include: [
        {
          model: ctx.model.Menu,
          as: 'menus',
          attributes: [ 'id' ],
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    return this._formatRole(latestRole);
  }

  /**
   * 删除角色
   * - 删除前检查是否仍有关联管理员
   * - 清理菜单关联后再删除角色主记录
   * @param {number} roleId - 角色 ID
   */
  async remove(roleId) {
    const { ctx } = this;
    const role = await this._getRoleById(roleId);
    if (!role) {
      this.throwBusinessError(404, '角色不存在');
    }

    const adminCount = await ctx.model.AdminRole.count({
      where: { roleId },
    });
    if (adminCount > 0) {
      this.throwBusinessError(409, '当前角色已关联管理员，不能删除');
    }

    const transaction = await ctx.model.transaction();
    try {
      await ctx.model.RoleMenu.destroy({
        where: { roleId },
        transaction,
      });
      await role.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 按主键查询角色
   * @param {number} roleId - 角色 ID
   * @return {object|null} 角色实例
   * @private
   */
  async _getRoleById(roleId) {
    return await this.ctx.model.Role.findByPk(roleId);
  }

  /**
   * 校验并规范化角色入参
   * @param {object} payload - 原始入参
   * @return {object} 规范化后的角色数据
   * @private
   */
  async _normalizePayload(payload) {
    const name = String(payload.name || '').trim();
    const code = String(payload.code || '').trim();
    const description = this._normalizeNullableString(payload.description);
    const sort = payload.sort == null ? 0 : Number(payload.sort);
    const status = payload.status == null ? 1 : Number(payload.status);

    if (!name) {
      this.throwBusinessError(400, '角色名称不能为空');
    }

    if (!code) {
      this.throwBusinessError(400, '角色编码不能为空');
    }

    if (Number.isNaN(sort)) {
      this.throwBusinessError(400, '排序值不合法');
    }

    if (![ 0, 1 ].includes(status)) {
      this.throwBusinessError(400, '角色状态不合法');
    }

    return {
      name,
      code,
      description,
      sort,
      status,
    };
  }

  /**
   * 校验角色编码唯一性
   * @param {string} code - 角色编码
   * @param {number} excludeRoleId - 排除的角色 ID
   * @private
   */
  async _ensureCodeUnique(code, excludeRoleId = null) {
    const { ctx } = this;
    const existingRole = await ctx.model.Role.findOne({
      where: { code },
    });

    if (existingRole && existingRole.id !== excludeRoleId) {
      this.throwBusinessError(409, '角色编码已存在');
    }
  }

  /**
   * 展开菜单 ID 列表并自动补齐祖先节点
   * @param {number[]} menuIds - 原始菜单 ID
   * @return {number[]} 完整菜单 ID 列表
   * @private
   */
  async _expandMenuIds(menuIds) {
    const normalizedMenuIds = Array.from(new Set(
      (Array.isArray(menuIds) ? menuIds : [])
        .map(item => Number(item))
        .filter(item => Number.isInteger(item) && item > 0)
    ));

    if (!normalizedMenuIds.length) {
      return [];
    }

    const { ctx } = this;
    const menuList = await ctx.model.Menu.findAll({
      attributes: [ 'id', 'parentId' ],
    });

    const menuMap = new Map(menuList.map(item => [ item.id, item.get({ plain: true }) ]));
    for (const menuId of normalizedMenuIds) {
      if (!menuMap.has(menuId)) {
        this.throwBusinessError(404, '存在无效的菜单 ID');
      }
    }

    const result = new Set(normalizedMenuIds);
    for (const menuId of normalizedMenuIds) {
      let currentMenu = menuMap.get(menuId);
      while (currentMenu && currentMenu.parentId > 0) {
        result.add(currentMenu.parentId);
        currentMenu = menuMap.get(currentMenu.parentId);
      }
    }

    return Array.from(result).sort((prev, next) => prev - next);
  }

  /**
   * 格式化角色输出
   * @param {object} role - 角色实例或原始对象
   * @return {object} 响应数据
   * @private
   */
  _formatRole(role) {
    const plainRole = typeof role.get === 'function' ? role.get({ plain: true }) : role;
    return {
      id: plainRole.id,
      name: plainRole.name,
      code: plainRole.code,
      description: plainRole.description,
      status: plainRole.status,
      sort: plainRole.sort,
      menuIds: Array.from(new Set((plainRole.menus || []).map(item => item.id))).sort((prev, next) => prev - next),
      createdAt: this.formatDateTime(plainRole.createdAt),
      updatedAt: this.formatDateTime(plainRole.updatedAt),
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

module.exports = AdminRoleService;
