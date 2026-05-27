'use strict';

const Controller = require('egg').Controller;

class AdminRoleController extends Controller {
  /**
   * 角色列表
   * - 返回角色基础信息和菜单 ID 关联
   */
  async list() {
    const { ctx } = this;
    const result = await ctx.service.adminRole.list();
    ctx.helper.success(result);
  }

  /**
   * 新增角色
   * - 参数细节由 Service 统一校验
   */
  async create() {
    const { ctx } = this;
    const result = await ctx.service.adminRole.create(ctx.request.body || {});
    ctx.helper.success(result);
  }

  /**
   * 编辑角色
   * - 角色 ID 必须为正整数
   */
  async update() {
    const { ctx } = this;
    const roleId = Number(ctx.params.id);
    if (!Number.isInteger(roleId) || roleId <= 0) {
      ctx.helper.fail(400, '角色 ID 不合法');
      return;
    }

    const result = await ctx.service.adminRole.update(roleId, ctx.request.body || {});
    ctx.helper.success(result);
  }

  /**
   * 分配角色菜单
   * - menuIds 必须为数组
   */
  async assignMenus() {
    const { ctx } = this;
    const roleId = Number(ctx.params.id);
    const { menuIds } = ctx.request.body || {};
    if (!Number.isInteger(roleId) || roleId <= 0) {
      ctx.helper.fail(400, '角色 ID 不合法');
      return;
    }

    if (!Array.isArray(menuIds)) {
      ctx.helper.fail(400, 'menuIds 必须为数组');
      return;
    }

    const result = await ctx.service.adminRole.assignMenus(roleId, menuIds);
    ctx.helper.success(result);
  }

  /**
   * 删除角色
   * - 关联管理员时会由 Service 拒绝删除
   */
  async remove() {
    const { ctx } = this;
    const roleId = Number(ctx.params.id);
    if (!Number.isInteger(roleId) || roleId <= 0) {
      ctx.helper.fail(400, '角色 ID 不合法');
      return;
    }

    await ctx.service.adminRole.remove(roleId);
    ctx.helper.success(null);
  }
}

module.exports = AdminRoleController;
