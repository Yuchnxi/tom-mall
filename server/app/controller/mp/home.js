'use strict';

/* eslint-disable jsdoc/check-tag-names */

const Controller = require('egg').Controller;

/**
 * @Controller 小程序测试
 */
class MpHomeController extends Controller {
  /**
   * @Router GET /api/v1/mp/ping
   * @Summary 小程序 ping
   * @Description 小程序侧服务健康检查接口
   * @Response 200 baseResponse 请求成功
   */
  async ping() {
    const { ctx } = this;

    ctx.helper.success({
      serverTime: ctx.helper.formatDate(new Date()),
      message: 'mp pong',
    });
  }
}

module.exports = MpHomeController;
