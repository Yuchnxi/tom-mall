'use strict';

module.exports = app => {
  const { BIGINT, STRING } = app.Sequelize;

  const WechatUser = app.model.define('WechatUser', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: BIGINT.UNSIGNED,
    openid: { type: STRING(100), allowNull: false },
    unionid: STRING(100),
    nickname: STRING(100),
    avatar: STRING(500),
    sessionKey: STRING(255),
  }, {
    tableName: 'wechat_users',
    underscored: true,
    timestamps: true,
  });

  WechatUser.associate = () => {
    WechatUser.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
  };

  return WechatUser;
};
