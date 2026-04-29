'use strict';

const Controller = require('egg').Controller;

class AdminAuthController extends Controller {
  /**
   * 管理员登录
   * - 校验用户名和密码必填
   * - 调用 Service 完成密码校验、JWT 签发和菜单权限组装
   */
  async login() {
    const { ctx } = this;
    const { username, password } = ctx.request.body || {};

    if (!username || !String(username).trim()) {
      ctx.helper.fail(400, '用户名不能为空');
      return;
    }

    if (!password || !String(password).trim()) {
      ctx.helper.fail(400, '密码不能为空');
      return;
    }

    const result = await ctx.service.adminAuth.login({
      username: String(username).trim(),
      password: String(password),
    });

    ctx.helper.success(result);
  }

  /**
   * 获取当前管理员信息
   * - 根据 JWT 中的 adminId 查询当前管理员最新信息
   * - 返回管理员信息、菜单树和权限列表
   */
  async info() {
    const { ctx } = this;
    const result = await ctx.service.adminAuth.getInfo(ctx.admin.adminId);

    ctx.helper.success(result);
  }

  /**
   * 管理员退出登录
   * - 当前阶段采用无状态实现
   * - 只要 token 校验通过即返回成功
   */
  async logout() {
    const { ctx } = this;
    await ctx.service.adminAuth.logout(ctx.admin.adminId);

    ctx.helper.success(null);
  }
}

module.exports = AdminAuthController;
