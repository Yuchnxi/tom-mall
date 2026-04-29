'use strict';

module.exports = app => {
  const { INTEGER } = app.Sequelize;

  const RoleMenu = app.model.define('RoleMenu', {
    id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    roleId: { type: INTEGER.UNSIGNED, allowNull: false },
    menuId: { type: INTEGER.UNSIGNED, allowNull: false },
  }, {
    tableName: 'role_menus',
    underscored: true,
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
  });

  return RoleMenu;
};
