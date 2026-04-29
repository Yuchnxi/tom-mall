'use strict';

module.exports = app => {
  const { INTEGER, BIGINT, STRING, JSON } = app.Sequelize;

  const ProductAttribute = app.model.define('ProductAttribute', {
    id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    productId: { type: BIGINT.UNSIGNED, allowNull: false },
    attrName: { type: STRING(50), allowNull: false },
    attrValues: { type: JSON, allowNull: false },
    sort: { type: INTEGER, defaultValue: 0 },
  }, {
    tableName: 'product_attributes',
    underscored: true,
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
  });

  ProductAttribute.associate = () => {
    ProductAttribute.belongsTo(app.model.Product, { foreignKey: 'productId', as: 'product' });
  };

  return ProductAttribute;
};
