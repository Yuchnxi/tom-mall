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

  // 本地开发环境在控制台管道断开后继续写 stdout，容易触发 EPIPE 死循环
  // 统一在应用 ready 后关闭控制台输出，并将控制台日志级别提升为 WARN
  config.logger = {
    consoleLevel: appInfo.env === 'local' ? 'WARN' : 'INFO',
    disableConsoleAfterReady: true,
  };

  // 为核心日志开启按体积轮转，避免异常刷屏时单个日志文件无限膨胀
  config.logrotator = {
    filesRotateBySize: [
      'common-error.log',
      'egg-agent.log',
      'egg-web.log',
      'tom-mall-server-web.log',
    ],
    maxFileSize: 100 * 1024 * 1024,
    maxFiles: 3,
    rotateDuration: 60000,
    maxDays: 7,
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
