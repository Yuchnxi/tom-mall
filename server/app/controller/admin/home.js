'use strict';

/* eslint-disable jsdoc/check-tag-names */

const Controller = require('egg').Controller;

/**
 * @Controller 后台测试
 */
class AdminHomeController extends Controller {
  /**
   * @Router GET /api/v1/admin/ping
   * @Summary 后台 ping
   * @Description 后台侧服务健康检查接口
   * @Response 200 baseResponse 请求成功
   */
  async ping() {
    const { ctx } = this;

    ctx.helper.success({
      admin: ctx.admin,
      serverTime: ctx.helper.formatDate(new Date()),
      message: 'admin pong',
    });
  }
}

module.exports = AdminHomeController;
