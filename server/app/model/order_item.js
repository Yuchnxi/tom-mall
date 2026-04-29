'use strict';

module.exports = app => {
  const { BIGINT, STRING, JSON, DECIMAL, INTEGER, TINYINT } = app.Sequelize;

  const OrderItem = app.model.define('OrderItem', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    orderId: { type: BIGINT.UNSIGNED, allowNull: false },
    orderNo: { type: STRING(64), allowNull: false },
    productId: { type: BIGINT.UNSIGNED, allowNull: false },
    skuId: { type: BIGINT.UNSIGNED, allowNull: false },
    productName: { type: STRING(200), allowNull: false },
    productImage: STRING(500),
    specs: JSON,
    price: { type: DECIMAL(10, 2), allowNull: false },
    quantity: { type: INTEGER, allowNull: false },
    totalAmount: { type: DECIMAL(10, 2), allowNull: false },
    isReviewed: { type: TINYINT, defaultValue: 0 },
  }, {
    tableName: 'order_items',
    underscored: true,
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
  });

  OrderItem.associate = () => {
    OrderItem.belongsTo(app.model.Order, { foreignKey: 'orderId', as: 'order' });
  };

  return OrderItem;
};
