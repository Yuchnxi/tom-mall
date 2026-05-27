'use strict';

module.exports = app => {
  const { router, controller, middleware } = app;
  const adminJwt = middleware.jwt({ type: 'admin' });
  const perm = middleware.permission;

  router.post('/api/v1/admin/auth/login', controller.admin.auth.login);
  router.get('/api/v1/admin/auth/info', adminJwt, controller.admin.auth.info);
  router.post('/api/v1/admin/auth/logout', adminJwt, controller.admin.auth.logout);
  router.get('/api/v1/admin/ping', adminJwt, perm('system:ping'), controller.admin.home.ping);

  router.get('/api/v1/admin/menus', adminJwt, perm('menu:list'), controller.admin.menu.list);
  router.post('/api/v1/admin/menus', adminJwt, perm('menu:create'), controller.admin.menu.create);
  router.put('/api/v1/admin/menus/:id', adminJwt, perm('menu:edit'), controller.admin.menu.update);
  router.delete('/api/v1/admin/menus/:id', adminJwt, perm('menu:delete'), controller.admin.menu.remove);

  router.get('/api/v1/admin/roles', adminJwt, perm('role:list'), controller.admin.role.list);
  router.post('/api/v1/admin/roles', adminJwt, perm('role:create'), controller.admin.role.create);
  router.put('/api/v1/admin/roles/:id', adminJwt, perm('role:edit'), controller.admin.role.update);
  router.put('/api/v1/admin/roles/:id/menus', adminJwt, perm('role:edit'), controller.admin.role.assignMenus);
  router.delete('/api/v1/admin/roles/:id', adminJwt, perm('role:delete'), controller.admin.role.remove);

  router.get('/api/v1/admin/admins', adminJwt, perm('admin:list'), controller.admin.admin.list);
  router.post('/api/v1/admin/admins', adminJwt, perm('admin:create'), controller.admin.admin.create);
  router.put('/api/v1/admin/admins/:id', adminJwt, perm('admin:edit'), controller.admin.admin.update);
  router.put('/api/v1/admin/admins/:id/status', adminJwt, perm('admin:edit'), controller.admin.admin.updateStatus);
  router.put('/api/v1/admin/admins/:id/password', adminJwt, perm('admin:edit'), controller.admin.admin.resetPassword);
  router.delete('/api/v1/admin/admins/:id', adminJwt, perm('admin:delete'), controller.admin.admin.remove);
};
