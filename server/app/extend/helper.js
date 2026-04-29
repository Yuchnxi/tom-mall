'use strict';

const dayjs = require('dayjs');

module.exports = {
  success(data = null, message = 'ok') {
    this.ctx.body = {
      code: 0,
      message,
      data,
    };
  },

  fail(code, message, data = null) {
    this.ctx.body = {
      code,
      message,
      data,
    };
  },

  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) {
      return null;
    }
    return dayjs(date).format(format);
  },

  generateOrderNo(userId) {
    const date = dayjs().format('YYYYMMDDHHmmss');
    const uid = String(userId).slice(-4).padStart(4, '0');
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    return `${date}${uid}${rand}`;
  },
};
