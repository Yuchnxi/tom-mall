'use strict';

module.exports = app => {
  const { BIGINT, INTEGER, TINYINT } = app.Sequelize;

  const Cart = app.model.define('Cart', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    userId: { type: BIGINT.UNSIGNED, allowNull: false },
    productId: { type: BIGINT.UNSIGNED, allowNull: false },
    skuId: { type: BIGINT.UNSIGNED, allowNull: false },
    quantity: { type: INTEGER, defaultValue: 1 },
    selected: { type: TINYINT, defaultValue: 1 },
  }, {
    tableName: 'carts',
    underscored: true,
    timestamps: true,
  });

  Cart.associate = () => {
    Cart.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
    Cart.belongsTo(app.model.Product, { foreignKey: 'productId', as: 'product' });
    Cart.belongsTo(app.model.ProductSku, { foreignKey: 'skuId', as: 'sku' });
  };

  return Cart;
};
