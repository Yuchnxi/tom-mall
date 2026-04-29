'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BaseService = require('./base');

class AdminAuthService extends BaseService {
  /**
   * 管理员登录
   * - 校验管理员账号状态和密码
   * - 组装菜单树和权限列表
   * - 签发后台 JWT 并更新最后登录信息
   * @param {object} payload - 登录参数
   * @param {string} payload.username - 管理员用户名
   * @param {string} payload.password - 管理员密码
   * @return {object} 登录响应数据
   */
  async login({ username, password }) {
    const { ctx } = this;
    const ip = ctx.ip;

    const admin = await this._getAdminByUsername(username);
    if (!admin) {
      this._logLoginResult({
        adminId: null,
        username,
        ip,
        success: false,
        message: '管理员账号不存在',
      });
      this._throwBusinessError(401, '账号或密码错误');
    }

    if (admin.status !== 1) {
      this._logLoginResult({
        adminId: admin.id,
        username: admin.username,
        ip,
        success: false,
        message: '管理员账号已禁用',
      });
      this._throwBusinessError(401, '账号已被禁用');
    }

    const passwordMatched = await bcrypt.compare(password, admin.password);
    if (!passwordMatched) {
      this._logLoginResult({
        adminId: admin.id,
        username: admin.username,
        ip,
        success: false,
        message: '管理员密码校验失败',
      });
      this._throwBusinessError(401, '账号或密码错误');
    }

    const permissionData = await this._buildPermissionData(admin);
    const token = this._signToken({
      adminId: admin.id,
      username: admin.username,
      isSuper: admin.isSuper,
      permissions: permissionData.permissions,
    });

    await admin.update({
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });

    this._logLoginResult({
      adminId: admin.id,
      username: admin.username,
      ip,
      success: true,
      message: '管理员登录成功',
    });

    return {
      token,
      adminInfo: this._formatAdminInfo(admin),
      menus: permissionData.menus,
      permissions: permissionData.permissions,
    };
  }

  /**
   * 获取当前管理员信息
   * - 重新查询数据库中的管理员、菜单和权限
   * - 返回最新的后台登录态展示数据
   * @param {number} adminId - 管理员 ID
   * @return {object} 管理员信息响应
   */
  async getInfo(adminId) {
    const admin = await this._getAdminById(adminId);
    if (!admin) {
      this._throwBusinessError(401, '请先登录');
    }

    if (admin.status !== 1) {
      this._throwBusinessError(401, '账号已被禁用');
    }

    const permissionData = await this._buildPermissionData(admin);

    return {
      adminInfo: this._formatAdminInfo(admin),
      menus: permissionData.menus,
      permissions: permissionData.permissions,
    };
  }

  /**
   * 管理员退出登录
   * - 当前阶段不做 token 黑名单和服务端状态持久化
   * - 保留 Service 方法用于承接后续扩展
   * @param {number} adminId - 管理员 ID
   */
  async logout(adminId) {
    const admin = await this._getAdminById(adminId);
    if (!admin) {
      this._throwBusinessError(401, '请先登录');
    }
  }

  /**
   * 按用户名查询管理员
   * @param {string} username - 管理员用户名
   * @return {object|null} 管理员实例
   * @private
   */
  async _getAdminByUsername(username) {
    const { ctx } = this;

    return await ctx.model.Admin.findOne({
      where: { username },
    });
  }

  /**
   * 按主键查询管理员
   * @param {number} adminId - 管理员 ID
   * @return {object|null} 管理员实例
   * @private
   */
  async _getAdminById(adminId) {
    const { ctx } = this;

    return await ctx.model.Admin.findByPk(adminId);
  }

  /**
   * 组装管理员的菜单树和权限列表
   * - 超级管理员返回全部启用菜单
   * - 普通管理员仅返回启用角色关联的启用菜单
   * @param {object} admin - 管理员实例
   * @return {object} 菜单树和权限列表
   * @private
   */
  async _buildPermissionData(admin) {
    const menuRecords = admin.isSuper === 1 ?
      await this._getAllEnabledMenus() :
      await this._getMenusByAdminId(admin.id);

    const menus = this._buildMenuTree(menuRecords);
    const permissions = Array.from(new Set(
      menuRecords
        .map(item => item.permission)
        .filter(permission => Boolean(permission))
    ));

    return { menus, permissions };
  }

  /**
   * 查询全部启用菜单
   * @return {Array} 菜单列表
   * @private
   */
  async _getAllEnabledMenus() {
    const { ctx } = this;
    const menuList = await ctx.model.Menu.findAll({
      where: { status: 1 },
      order: [
        [ 'sort', 'ASC' ],
        [ 'id', 'ASC' ],
      ],
    });

    return menuList.map(item => item.get({ plain: true }));
  }

  /**
   * 查询管理员关联的启用菜单
   * - 仅透出启用角色下挂载的启用菜单
   * - 使用去重避免多角色下重复菜单重复返回
   * @param {number} adminId - 管理员 ID
   * @return {Array} 菜单列表
   * @private
   */
  async _getMenusByAdminId(adminId) {
    const { ctx } = this;
    const admin = await ctx.model.Admin.findByPk(adminId, {
      include: [
        {
          model: ctx.model.Role,
          as: 'roles',
          where: { status: 1 },
          required: false,
          through: { attributes: [] },
          include: [
            {
              model: ctx.model.Menu,
              as: 'menus',
              where: { status: 1 },
              required: false,
              through: { attributes: [] },
            },
          ],
        },
      ],
      order: [
        [{ model: ctx.model.Role, as: 'roles' }, 'sort', 'ASC' ],
        [{ model: ctx.model.Role, as: 'roles' }, 'id', 'ASC' ],
        [{ model: ctx.model.Role, as: 'roles' }, { model: ctx.model.Menu, as: 'menus' }, 'sort', 'ASC' ],
        [{ model: ctx.model.Role, as: 'roles' }, { model: ctx.model.Menu, as: 'menus' }, 'id', 'ASC' ],
      ],
    });

    if (!admin) {
      return [];
    }

    const menuMap = new Map();
    for (const role of admin.roles || []) {
      for (const menu of role.menus || []) {
        if (!menuMap.has(menu.id)) {
          menuMap.set(menu.id, menu.get({ plain: true }));
        }
      }
    }

    return Array.from(menuMap.values()).sort((prev, next) => {
      if (prev.sort !== next.sort) {
        return prev.sort - next.sort;
      }
      return prev.id - next.id;
    });
  }

  /**
   * 构建前端动态路由使用的菜单树
   * - 先按 parentId 建立父子映射
   * - 再从顶级节点开始递归挂载 children
   * @param {Array} menuList - 平铺菜单列表
   * @return {Array} 菜单树
   * @private
   */
  _buildMenuTree(menuList) {
    const nodeMap = new Map();
    const rootList = [];

    for (const menu of menuList) {
      nodeMap.set(menu.id, {
        id: menu.id,
        parentId: menu.parentId,
        name: menu.name,
        icon: menu.icon,
        path: menu.path,
        component: menu.component,
        permission: menu.permission,
        type: menu.type,
        sort: menu.sort,
        isHidden: menu.isHidden,
        isCache: menu.isCache,
        children: [],
      });
    }

    for (const node of nodeMap.values()) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId).children.push(node);
      } else {
        rootList.push(node);
      }
    }

    const sortNodes = nodes => {
      nodes.sort((prev, next) => {
        if (prev.sort !== next.sort) {
          return prev.sort - next.sort;
        }
        return prev.id - next.id;
      });

      for (const node of nodes) {
        sortNodes(node.children);
        if (!node.children.length) {
          delete node.children;
        }
      }
    };

    sortNodes(rootList);

    return rootList;
  }

  /**
   * 格式化后台管理员基础信息
   * @param {object} admin - 管理员实例
   * @return {object} 管理员基础信息
   * @private
   */
  _formatAdminInfo(admin) {
    return {
      id: admin.id,
      username: admin.username,
      realName: admin.realName,
      avatar: admin.avatar,
      isSuper: admin.isSuper,
    };
  }

  /**
   * 签发后台管理端 JWT
   * @param {object} payload - JWT 载荷
   * @return {string} token
   * @private
   */
  _signToken(payload) {
    const { app } = this;

    return jwt.sign(payload, app.config.jwt.secret, {
      expiresIn: app.config.jwt.adminExpire,
    });
  }

  /**
   * 记录管理员登录日志
   * @param {object} payload - 日志数据
   * @private
   */
  _logLoginResult(payload) {
    const { ctx } = this;

    ctx.logger.info('[admin:login] 管理员登录结果', {
      adminId: payload.adminId,
      username: payload.username,
      ip: payload.ip,
      time: ctx.helper.formatDate(new Date()),
      success: payload.success,
      message: payload.message,
    });
  }

  /**
   * 抛出统一业务错误
   * @param {number} code - 业务错误码
   * @param {string} message - 错误信息
   * @private
   */
  _throwBusinessError(code, message) {
    const error = new Error(message);
    error.code = code;
    throw error;
  }
}

module.exports = AdminAuthService;
