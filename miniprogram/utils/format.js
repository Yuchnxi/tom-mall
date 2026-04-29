const formatAmount = amount => {
  if (amount == null) {
    return '¥0.00';
  }

  return `¥${Number(amount).toFixed(2)}`;
};

module.exports = {
  formatAmount,
};
