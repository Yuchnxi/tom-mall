import dayjs from 'dayjs';

export const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) {
    return '-';
  }

  return dayjs(date).format(format);
};

export const formatAmount = amount => {
  if (amount == null) {
    return '-';
  }

  return `¥${Number(amount).toFixed(2)}`;
};
