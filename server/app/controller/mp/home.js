'use strict';

const Controller = require('egg').Controller;

class MpHomeController extends Controller {
  async ping() {
    const { ctx } = this;

    ctx.helper.success({
      serverTime: ctx.helper.formatDate(new Date()),
      message: 'mp pong',
    });
  }
}

module.exports = MpHomeController;
