'use strict';

module.exports = app => {
  const { BIGINT, STRING, TINYINT, DECIMAL, DATE, JSON } = app.Sequelize;

  const Payment = app.model.define('Payment', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    payNo: { type: STRING(64), allowNull: false },
    orderId: { type: BIGINT.UNSIGNED, allowNull: false },
    orderNo: { type: STRING(64), allowNull: false },
    userId: { type: BIGINT.UNSIGNED, allowNull: false },
    payType: { type: TINYINT, allowNull: false },
    amount: { type: DECIMAL(10, 2), allowNull: false },
    status: { type: TINYINT, defaultValue: 0 },
    transactionId: STRING(100),
    paidAt: DATE,
    refundAmount: { type: DECIMAL(10, 2), defaultValue: 0 },
    refundedAt: DATE,
    rawResponse: JSON,
  }, {
    tableName: 'payments',
    underscored: true,
    timestamps: true,
  });

  Payment.associate = () => {
    Payment.belongsTo(app.model.Order, { foreignKey: 'orderId', as: 'order' });
    Payment.belongsTo(app.model.User, { foreignKey: 'userId', as: 'user' });
  };

  return Payment;
};
