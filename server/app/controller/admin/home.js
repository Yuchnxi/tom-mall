'use strict';

const Controller = require('egg').Controller;

class AdminHomeController extends Controller {
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
