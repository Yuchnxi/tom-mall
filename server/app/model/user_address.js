'use strict';

module.exports = app => {
  const { BIGINT, STRING, TINYINT } = app.Sequelize;

  const UserAddress = app.model.define('UserAddress', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: { type: BIGINT.UNSIGNED, allowNull: false },
    receiverName: { type: STRING(50), allowNull: false },
    receiverMobile: { type: STRING(20), allowNull: false },
    province: { type: STRING(50), allowNull: false },
    city: { type: STRING(50), allowNull: false },
    district: { type: STRING(50), allowNull: false },
    detail: { type: STRING(200), allowNull: false },
    postcode: STRING(20),
    isDefault: { type: TINYINT, defaultValue: 0 },
  }, {
    tableName: 'user_addresses',
    underscored: true,
    timestamps: true,
  });

  UserAddress.associate = () => {
    UserAddress.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserAddress;
};
