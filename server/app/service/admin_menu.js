'use strict';

const BaseService = require('./base');

class AdminMenuService extends BaseService {
  /**
   * 获取全量菜单树
   * - 返回系统管理使用的完整菜单结构
   * - 不受当前管理员角色限制，包含禁用节点
   * @return {Array} 菜单树
   */
  async list() {
    const menuList = await this._getAllMenus();
    return this._buildMenuTree(menuList);
  }

  /**
   * 新增菜单节点
   * - 校验父级节点、节点类型和按钮权限标识
   * - 新增后返回完整节点数据
   * @param {object} payload - 菜单数据
   * @return {object} 新增后的菜单节点
   */
  async create(payload) {
    const { ctx } = this;
    const normalizedPayload = await this._normalizePayload(payload);

    const menu = await ctx.model.Menu.create(normalizedPayload);
    return this._formatMenuRecord(menu.get({ plain: true }));
  }

  /**
   * 编辑菜单节点
   * - 校验目标节点是否存在
   * - 禁止将节点移动到自己的子孙节点下，防止树结构成环
   * @param {number} menuId - 菜单 ID
   * @param {object} payload - 菜单数据
   * @return {object} 更新后的菜单节点
   */
  async update(menuId, payload) {
    const menu = await this._getMenuById(menuId);
    if (!menu) {
      this.throwBusinessError(404, '菜单不存在');
    }

    const normalizedPayload = await this._normalizePayload(payload, menuId);
    await menu.update(normalizedPayload);

    return this._formatMenuRecord(menu.get({ plain: true }));
  }

  /**
   * 删除菜单节点
   * - 删除前校验是否存在子节点
   * - 同时清理角色菜单关联，避免残留脏数据
   * @param {number} menuId - 菜单 ID
   */
  async remove(menuId) {
    const { ctx } = this;
    const menu = await this._getMenuById(menuId);
    if (!menu) {
      this.throwBusinessError(404, '菜单不存在');
    }

    const childCount = await ctx.model.Menu.count({
      where: { parentId: menuId },
    });
    if (childCount > 0) {
      this.throwBusinessError(409, '当前菜单存在子节点，不能删除');
    }

    const transaction = await ctx.model.transaction();
    try {
      await ctx.model.RoleMenu.destroy({
        where: { menuId },
        transaction,
      });
      await menu.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * 查询全量菜单并按排序返回
   * @return {Array} 菜单列表
   * @private
   */
  async _getAllMenus() {
    const { ctx } = this;
    const list = await ctx.model.Menu.findAll({
      order: [
        [ 'sort', 'ASC' ],
        [ 'id', 'ASC' ],
      ],
    });

    return list.map(item => item.get({ plain: true }));
  }

  /**
   * 按主键查询菜单节点
   * @param {number} menuId - 菜单 ID
   * @return {object|null} 菜单实例
   * @private
   */
  async _getMenuById(menuId) {
    return await this.ctx.model.Menu.findByPk(menuId);
  }

  /**
   * 规范化并校验菜单入参
   * - 目录、菜单、按钮共用同一套基础字段
   * - 按钮节点必须填写 permission
   * @param {object} payload - 原始入参
   * @param {number} currentMenuId - 当前编辑的菜单 ID
   * @return {object} 可直接写入数据库的数据
   * @private
   */
  async _normalizePayload(payload, currentMenuId = null) {
    const parentId = Number(payload.parentId ?? 0);
    const type = Number(payload.type);
    const sort = payload.sort == null ? 0 : Number(payload.sort);
    const isHidden = payload.isHidden == null ? 0 : Number(payload.isHidden);
    const isCache = payload.isCache == null ? 0 : Number(payload.isCache);
    const status = payload.status == null ? 1 : Number(payload.status);
    const name = String(payload.name || '').trim();
    const icon = this._normalizeNullableString(payload.icon);
    const path = this._normalizeNullableString(payload.path);
    const component = this._normalizeNullableString(payload.component);
    const permission = this._normalizeNullableString(payload.permission);

    if (!name) {
      this.throwBusinessError(400, '菜单名称不能为空');
    }

    if (![ 1, 2, 3 ].includes(type)) {
      this.throwBusinessError(400, '菜单类型不合法');
    }

    if (![ 0, 1 ].includes(isHidden) || ![ 0, 1 ].includes(isCache) || ![ 0, 1 ].includes(status)) {
      this.throwBusinessError(400, '菜单状态参数不合法');
    }

    if (Number.isNaN(parentId) || parentId < 0) {
      this.throwBusinessError(400, '父级菜单参数不合法');
    }

    if (Number.isNaN(sort)) {
      this.throwBusinessError(400, '排序值不合法');
    }

    if (type === 3 && !permission) {
      this.throwBusinessError(400, '按钮权限标识不能为空');
    }

    if (currentMenuId && parentId === currentMenuId) {
      this.throwBusinessError(409, '菜单不能设置自己为父级');
    }

    if (parentId > 0) {
      const parentMenu = await this._getMenuById(parentId);
      if (!parentMenu) {
        this.throwBusinessError(404, '父级菜单不存在');
      }

      if (parentMenu.type === 3) {
        this.throwBusinessError(409, '按钮节点不能作为父级菜单');
      }

      if (currentMenuId) {
        const descendantIds = await this._getDescendantIds(currentMenuId);
        if (descendantIds.has(parentId)) {
          this.throwBusinessError(409, '不能移动到当前菜单的子节点下');
        }
      }
    }

    return {
      parentId,
      name,
      icon,
      path,
      component,
      permission,
      type,
      sort,
      isHidden,
      isCache,
      status,
    };
  }

  /**
   * 查询指定节点的所有子孙节点
   * @param {number} menuId - 菜单 ID
   * @return {Set<number>} 子孙节点 ID 集合
   * @private
   */
  async _getDescendantIds(menuId) {
    const menuList = await this._getAllMenus();
    const childMap = new Map();

    for (const item of menuList) {
      if (!childMap.has(item.parentId)) {
        childMap.set(item.parentId, []);
      }
      childMap.get(item.parentId).push(item.id);
    }

    const result = new Set();
    const queue = [ menuId ];
    while (queue.length) {
      const currentId = queue.shift();
      const children = childMap.get(currentId) || [];
      for (const childId of children) {
        if (!result.has(childId)) {
          result.add(childId);
          queue.push(childId);
        }
      }
    }

    return result;
  }

  /**
   * 构建树形菜单结构
   * @param {Array} menuList - 平铺菜单列表
   * @return {Array} 菜单树
   * @private
   */
  _buildMenuTree(menuList) {
    const nodeMap = new Map();
    const rootList = [];

    for (const item of menuList) {
      nodeMap.set(item.id, {
        ...this._formatMenuRecord(item),
        children: [],
      });
    }

    for (const node of nodeMap.values()) {
      if (node.parentId > 0 && nodeMap.has(node.parentId)) {
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
   * 格式化菜单输出字段
   * @param {object} item - 原始菜单数据
   * @return {object} 响应数据
   * @private
   */
  _formatMenuRecord(item) {
    return {
      id: item.id,
      parentId: item.parentId,
      name: item.name,
      icon: item.icon,
      path: item.path,
      component: item.component,
      permission: item.permission,
      type: item.type,
      sort: item.sort,
      isHidden: item.isHidden,
      isCache: item.isCache,
      status: item.status,
      createdAt: this.formatDateTime(item.createdAt),
      updatedAt: this.formatDateTime(item.updatedAt),
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

module.exports = AdminMenuService;
