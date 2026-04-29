'use strict';

module.exports = app => {
  const { router, controller } = app;

  router.get('/api/v1/mp/ping', controller.mp.home.ping);
};
