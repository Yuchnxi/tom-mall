'use strict';

const Controller = require('egg').Controller;

class AdminMenuController extends Controller {
  /**
   * 菜单树列表
   * - 返回系统管理使用的全量菜单树
   */
  async list() {
    const { ctx } = this;
    const result = await ctx.service.adminMenu.list();
    ctx.helper.success(result);
  }

  /**
   * 新增菜单节点
   * - 具体字段校验和树结构校验在 Service 中处理
   */
  async create() {
    const { ctx } = this;
    const result = await ctx.service.adminMenu.create(ctx.request.body || {});
    ctx.helper.success(result);
  }

  /**
   * 编辑菜单节点
   * - 菜单 ID 必须为正整数
   */
  async update() {
    const { ctx } = this;
    const menuId = Number(ctx.params.id);
    if (!Number.isInteger(menuId) || menuId <= 0) {
      ctx.helper.fail(400, '菜单 ID 不合法');
      return;
    }

    const result = await ctx.service.adminMenu.update(menuId, ctx.request.body || {});
    ctx.helper.success(result);
  }

  /**
   * 删除菜单节点
   * - 有子节点时会由 Service 拒绝删除
   */
  async remove() {
    const { ctx } = this;
    const menuId = Number(ctx.params.id);
    if (!Number.isInteger(menuId) || menuId <= 0) {
      ctx.helper.fail(400, '菜单 ID 不合法');
      return;
    }

    await ctx.service.adminMenu.remove(menuId);
    ctx.helper.success(null);
  }
}

module.exports = AdminMenuController;
