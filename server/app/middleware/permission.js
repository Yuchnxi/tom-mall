'use strict';

module.exports = permissionCode => {
  return async function permissionMiddleware(ctx, next) {
    const admin = ctx.admin;

    if (!admin) {
      ctx.helper.fail(401, '请先登录');
      return;
    }

    if (admin.isSuper === 1 || admin.isSuper === true) {
      await next();
      return;
    }

    const permissions = Array.isArray(admin.permissions) ? admin.permissions : [];
    if (!permissionCode || permissions.includes(permissionCode)) {
      await next();
      return;
    }

    ctx.helper.fail(403, '无权访问该接口');
  };
};
