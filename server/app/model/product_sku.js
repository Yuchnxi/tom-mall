'use strict';

module.exports = app => {
  const { BIGINT, STRING, JSON, DECIMAL, INTEGER, TINYINT } = app.Sequelize;

  const ProductSku = app.model.define('ProductSku', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    productId: { type: BIGINT.UNSIGNED, allowNull: false },
    skuCode: STRING(100),
    specs: { type: JSON, allowNull: false },
    price: { type: DECIMAL(10, 2), allowNull: false },
    originalPrice: DECIMAL(10, 2),
    costPrice: DECIMAL(10, 2),
    stock: { type: INTEGER, defaultValue: 0 },
    salesCount: { type: INTEGER, defaultValue: 0 },
    image: STRING(500),
    weight: DECIMAL(8, 3),
    status: { type: TINYINT, defaultValue: 1 },
  }, {
    tableName: 'product_skus',
    underscored: true,
    timestamps: true,
  });

  ProductSku.associate = () => {
    ProductSku.belongsTo(app.model.Product, { foreignKey: 'productId', as: 'product' });
    ProductSku.hasMany(app.model.Cart, { foreignKey: 'skuId', as: 'carts' });
  };

  return ProductSku;
};
