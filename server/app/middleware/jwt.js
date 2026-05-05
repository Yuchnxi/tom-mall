'use strict';

const jwt = require('jsonwebtoken');

module.exports = options => {
  return async function jwtMiddleware(ctx, next) {
    const authorization = ctx.get('Authorization');
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

    if (!token) {
      ctx.helper.fail(401, '请先登录');
      return;
    }

    let payload;
    try {
      payload = jwt.verify(token, ctx.app.config.jwt.secret);
    } catch (error) {
      ctx.helper.fail(401, '请先登录');
      return;
    }

    if (options.type === 'mp') {
      ctx.user = payload;
    } else {
      ctx.admin = payload;
    }

    await next();
  };
};
