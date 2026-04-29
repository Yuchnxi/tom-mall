'use strict';

module.exports = app => {
  const { router, controller, middleware } = app;
  const adminJwt = middleware.jwt({ type: 'admin' });
  const perm = middleware.permission;

  router.get('/api/v1/admin/ping', adminJwt, perm('system:ping'), controller.admin.home.ping);
};
