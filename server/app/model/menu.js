'use strict';

module.exports = app => {
  const { INTEGER, STRING, TINYINT } = app.Sequelize;

  const Menu = app.model.define('Menu', {
    id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    parentId: { type: INTEGER.UNSIGNED, defaultValue: 0 },
    name: { type: STRING(100), allowNull: false },
    icon: STRING(100),
    path: STRING(200),
    component: STRING(200),
    permission: STRING(100),
    type: { type: TINYINT, defaultValue: 1 },
    sort: { type: INTEGER, defaultValue: 0 },
    isHidden: { type: TINYINT, defaultValue: 0 },
    isCache: { type: TINYINT, defaultValue: 0 },
    status: { type: TINYINT, defaultValue: 1 },
  }, {
    tableName: 'menus',
    underscored: true,
    timestamps: true,
  });

  Menu.associate = () => {
    Menu.belongsTo(Menu, { foreignKey: 'parentId', as: 'parent' });
    Menu.hasMany(Menu, { foreignKey: 'parentId', as: 'children' });
    Menu.belongsToMany(app.model.Role, {
      through: app.model.RoleMenu,
      foreignKey: 'menuId',
      otherKey: 'roleId',
      as: 'roles',
    });
  };

  return Menu;
};
