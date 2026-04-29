'use strict';

module.exports = () => {
  return async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      const code = err.code || 500;
      const message = err.message || '服务器内部错误';

      ctx.status = 200;
      ctx.body = {
        code,
        message,
        data: null,
      };

      if (!err.code) {
        ctx.logger.error(err);
      }
    }
  };
};
