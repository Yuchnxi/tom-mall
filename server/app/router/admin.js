'use strict';

module.exports = app => {
  const { router, controller, middleware } = app;
  const adminJwt = middleware.jwt({ type: 'admin' });
  const perm = middleware.permission;

  router.post('/api/v1/admin/auth/login', controller.admin.auth.login);
  router.get('/api/v1/admin/auth/info', adminJwt, controller.admin.auth.info);
  router.post('/api/v1/admin/auth/logout', adminJwt, controller.admin.auth.logout);
  router.get('/api/v1/admin/ping', adminJwt, perm('system:ping'), controller.admin.home.ping);
};
