'use strict';

module.exports = app => {
  const { BIGINT, INTEGER, STRING, TEXT, DECIMAL, TINYINT, DATE } = app.Sequelize;

  const Product = app.model.define('Product', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    categoryId: { type: INTEGER.UNSIGNED, allowNull: false },
    name: { type: STRING(200), allowNull: false },
    subtitle: STRING(300),
    mainImage: { type: STRING(500), allowNull: false },
    description: TEXT('long'),
    brand: STRING(100),
    unit: { type: STRING(20), defaultValue: '件' },
    minPrice: { type: DECIMAL(10, 2), defaultValue: 0 },
    maxPrice: { type: DECIMAL(10, 2), defaultValue: 0 },
    totalStock: { type: INTEGER, defaultValue: 0 },
    salesCount: { type: INTEGER, defaultValue: 0 },
    viewCount: { type: INTEGER, defaultValue: 0 },
    sort: { type: INTEGER, defaultValue: 0 },
    isHot: { type: TINYINT, defaultValue: 0 },
    isNew: { type: TINYINT, defaultValue: 0 },
    isRecommend: { type: TINYINT, defaultValue: 0 },
    status: { type: TINYINT, defaultValue: 1 },
    deletedAt: DATE,
  }, {
    tableName: 'products',
    underscored: true,
    timestamps: true,
    paranoid: true,
  });

  Product.associate = () => {
    Product.belongsTo(app.model.Category, { foreignKey: 'categoryId', as: 'category' });
    Product.hasMany(app.model.ProductSku, { foreignKey: 'productId', as: 'skus' });
    Product.hasMany(app.model.ProductAttribute, { foreignKey: 'productId', as: 'attributes' });
    Product.hasMany(app.model.ProductImage, { foreignKey: 'productId', as: 'images' });
    Product.hasMany(app.model.Cart, { foreignKey: 'productId', as: 'carts' });
  };

  return Product;
};
