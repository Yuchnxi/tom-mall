'use strict';

module.exports = app => {
  const { INTEGER } = app.Sequelize;

  const AdminRole = app.model.define('AdminRole', {
    id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    adminId: { type: INTEGER.UNSIGNED, allowNull: false },
    roleId: { type: INTEGER.UNSIGNED, allowNull: false },
  }, {
    tableName: 'admin_roles',
    underscored: true,
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
  });

  return AdminRole;
};
