'use strict';

module.exports = app => {
  const { BIGINT, STRING, TINYINT, DECIMAL, DATE } = app.Sequelize;

  const Order = app.model.define('Order', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    orderNo: { type: STRING(64), allowNull: false },
    userId: { type: BIGINT.UNSIGNED, allowNull: false },
    status: { type: TINYINT, defaultValue: 0 },
    totalAmount: { type: DECIMAL(10, 2), allowNull: false },
    discountAmount: { type: DECIMAL(10, 2), defaultValue: 0 },
    freightAmount: { type: DECIMAL(10, 2), defaultValue: 0 },
    payAmount: { type: DECIMAL(10, 2), allowNull: false },
    payType: TINYINT,
    payTime: DATE,
    receiverName: { type: STRING(50), allowNull: false },
    receiverMobile: { type: STRING(20), allowNull: false },
    receiverAddress: { type: STRING(500), allowNull: false },
    remark: STRING(100),
    cancelReason: STRING(200),
    cancelledAt: DATE,
    completedAt: DATE,
  }, {
    tableName: 'orders',
    underscored: true,
    timestamps: true,
  });

  Order.associate = () => {
    Order.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
    Order.hasMany(app.model.OrderItem, { foreignKey: 'orderId', as: 'items' });
    Order.hasOne(app.model.Payment, { foreignKey: 'orderId', as: 'payment' });
  };

  return Order;
};
