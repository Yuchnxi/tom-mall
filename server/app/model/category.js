'use strict';

module.exports = app => {
  const { INTEGER, STRING, TINYINT } = app.Sequelize;

  const Category = app.model.define('Category', {
    id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    parentId: { type: INTEGER.UNSIGNED, defaultValue: 0 },
    name: { type: STRING(100), allowNull: false },
    icon: STRING(500),
    image: STRING(500),
    sort: { type: INTEGER, defaultValue: 0 },
    level: { type: TINYINT, defaultValue: 1 },
    status: { type: TINYINT, defaultValue: 1 },
  }, {
    tableName: 'categories',
    underscored: true,
    timestamps: true,
  });

  Category.associate = () => {
    Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });
    Category.hasMany(Category, { foreignKey: 'parentId', as: 'children' });
    Category.hasMany(app.model.Product, { foreignKey: 'categoryId', as: 'products' });
  };

  return Category;
};
