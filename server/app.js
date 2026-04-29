'use strict';

module.exports = app => {
  app.beforeStart(async () => {
    app.logger.info('[bootstrap] tom-mall server is starting');
  });
};
