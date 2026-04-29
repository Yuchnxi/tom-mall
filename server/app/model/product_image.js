'use strict';

module.exports = app => {
  const { BIGINT, INTEGER, STRING } = app.Sequelize;

  const ProductImage = app.model.define('ProductImage', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    productId: { type: BIGINT.UNSIGNED, allowNull: false },
    url: { type: STRING(500), allowNull: false },
    sort: { type: INTEGER, defaultValue: 0 },
  }, {
    tableName: 'product_images',
    underscored: true,
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
  });

  ProductImage.associate = () => {
    ProductImage.belongsTo(app.model.Product, { foreignKey: 'productId', as: 'product' });
  };

  return ProductImage;
};
