'use strict';

const Controller = require('egg').Controller;

class AdminAdminController extends Controller {
  /**
   * 管理员列表
   * - 支持关键词和状态筛选
   * - 返回统一分页结构
   */
  async list() {
    const { ctx } = this;
    const result = await ctx.service.adminUser.list(ctx.query || {});
    ctx.helper.success(result);
  }

  /**
   * 新增管理员
   * - 账号、密码和角色分配由 Service 统一校验
   */
  async create() {
    const { ctx } = this;
    const result = await ctx.service.adminUser.create(ctx.request.body || {});
    ctx.helper.success(result);
  }

  /**
   * 编辑管理员
   * - 当前登录管理员信息通过 ctx.admin 传入 Service 做越权校验
   */
  async update() {
    const { ctx } = this;
    const adminId = Number(ctx.params.id);
    if (!Number.isInteger(adminId) || adminId <= 0) {
      ctx.helper.fail(400, '管理员 ID 不合法');
      return;
    }

    const result = await ctx.service.adminUser.update(adminId, ctx.request.body || {}, ctx.admin);
    ctx.helper.success(result);
  }

  /**
   * 更新管理员状态
   * - 仅允许 0 禁用或 1 启用
   */
  async updateStatus() {
    const { ctx } = this;
    const adminId = Number(ctx.params.id);
    const { status } = ctx.request.body || {};
    if (!Number.isInteger(adminId) || adminId <= 0) {
      ctx.helper.fail(400, '管理员 ID 不合法');
      return;
    }

    const result = await ctx.service.adminUser.updateStatus(adminId, status, ctx.admin);
    ctx.helper.success(result);
  }

  /**
   * 重置管理员密码
   * - 仅超级管理员可调用，由 Service 做最终权限判断
   */
  async resetPassword() {
    const { ctx } = this;
    const adminId = Number(ctx.params.id);
    const { newPassword } = ctx.request.body || {};
    if (!Number.isInteger(adminId) || adminId <= 0) {
      ctx.helper.fail(400, '管理员 ID 不合法');
      return;
    }

    await ctx.service.adminUser.resetPassword(adminId, newPassword, ctx.admin);
    ctx.helper.success(null);
  }

  /**
   * 软删除管理员
   * - 删除后清理角色关联
   */
  async remove() {
    const { ctx } = this;
    const adminId = Number(ctx.params.id);
    if (!Number.isInteger(adminId) || adminId <= 0) {
      ctx.helper.fail(400, '管理员 ID 不合法');
      return;
    }

    await ctx.service.adminUser.remove(adminId, ctx.admin);
    ctx.helper.success(null);
  }
}

module.exports = AdminAdminController;
