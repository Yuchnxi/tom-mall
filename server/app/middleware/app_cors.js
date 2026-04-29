'use strict';

module.exports = () => {
  return async function appCors(ctx, next) {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }

    await next();
  };
};
