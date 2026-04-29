'use strict';

module.exports = app => {
  const { BIGINT, STRING, DATE, TINYINT } = app.Sequelize;

  const User = app.model.define('User', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    username: { type: STRING(50), allowNull: false },
    password: { type: STRING(255), allowNull: false },
    nickname: STRING(50),
    avatar: STRING(500),
    mobile: STRING(20),
    email: STRING(100),
    gender: { type: TINYINT, defaultValue: 0 },
    birthday: DATE,
    status: { type: TINYINT, defaultValue: 1 },
    lastLoginAt: DATE,
    lastLoginIp: STRING(50),
    deletedAt: DATE,
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    paranoid: true,
  });

  User.associate = () => {
    const { UserAddress, WechatUser, Cart, Order } = app.model;
    User.hasMany(UserAddress, { foreignKey: 'userId', as: 'addresses' });
    User.hasOne(WechatUser, { foreignKey: 'userId', as: 'wechatUser' });
    User.hasMany(Cart, { foreignKey: 'userId', as: 'carts' });
    User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
  };

  return User;
};
