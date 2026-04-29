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

    try {
      const payload = jwt.verify(token, ctx.app.config.jwt.secret);

      if (options.type === 'mp') {
        ctx.user = payload;
      } else {
        ctx.admin = payload;
      }

      await next();
    } catch (error) {
      ctx.helper.fail(401, '请先登录');
    }
  };
};
