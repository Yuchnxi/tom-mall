'use strict';

module.exports = app => {
  const { INTEGER, STRING, TINYINT, DATE } = app.Sequelize;

  const Admin = app.model.define('Admin', {
    id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    username: { type: STRING(50), allowNull: false },
    password: { type: STRING(255), allowNull: false },
    realName: STRING(50),
    avatar: STRING(500),
    mobile: STRING(20),
    email: STRING(100),
    status: { type: TINYINT, defaultValue: 1 },
    isSuper: { type: TINYINT, defaultValue: 0 },
    lastLoginAt: DATE,
    lastLoginIp: STRING(50),
    deletedAt: DATE,
  }, {
    tableName: 'admins',
    underscored: true,
    timestamps: true,
    paranoid: true,
  });

  Admin.associate = () => {
    Admin.belongsToMany(app.model.Role, {
      through: app.model.AdminRole,
      foreignKey: 'adminId',
      otherKey: 'roleId',
      as: 'roles',
    });
  };

  return Admin;
};
