'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  const config = exports = {};

  config.keys = `${appInfo.name}_1745913600`;

  config.middleware = [ 'errorHandler', 'appCors' ];

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.bodyParser = {
    jsonLimit: '5mb',
    formLimit: '5mb',
  };

  config.sequelize = {
    dialect: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: 'tom-mall',
    username: 'root',
    password: '',
    timezone: '+08:00',
    define: {
      underscored: true,
      timestamps: true,
    },
    logging: false,
  };

  config.jwt = {
    secret: 'replace-with-your-jwt-secret',
    mpExpire: '7d',
    adminExpire: '8h',
  };

  config.upload = {
    localDir: 'app/public/uploads',
    oss: {
      region: 'oss-cn-shenzhen',
      bucket: 'tom-mall',
      accessKeyId: '',
      accessKeySecret: '',
      cdnDomain: 'https://oss.tom-mall.com',
    },
  };

  config.multipart = {
    mode: 'file',
    fileSize: '10mb',
  };

  config.swaggerdoc = {
    dirScanner: './app/controller',
    apiInfo: {
      title: 'tom-mall API',
      description: 'tom-mall 服务端接口文档',
      version: '1.0.0',
    },
    schemes: [ 'http' ],
    consumes: [ 'application/json' ],
    produces: [ 'application/json' ],
    enableSecurity: false,
    routerMap: false,
    enable: true,
  };

  return {
    ...config,
  };
};
