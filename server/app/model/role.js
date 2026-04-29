'use strict';

module.exports = app => {
  const { INTEGER, STRING, TINYINT } = app.Sequelize;

  const Role = app.model.define('Role', {
    id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: STRING(50), allowNull: false },
    code: { type: STRING(50), allowNull: false },
    description: STRING(200),
    status: { type: TINYINT, defaultValue: 1 },
    sort: { type: INTEGER, defaultValue: 0 },
  }, {
    tableName: 'roles',
    underscored: true,
    timestamps: true,
  });

  Role.associate = () => {
    Role.belongsToMany(app.model.Admin, {
      through: app.model.AdminRole,
      foreignKey: 'roleId',
      otherKey: 'adminId',
      as: 'admins',
    });
    Role.belongsToMany(app.model.Menu, {
      through: app.model.RoleMenu,
      foreignKey: 'roleId',
      otherKey: 'menuId',
      as: 'menus',
    });
  };

  return Role;
};
