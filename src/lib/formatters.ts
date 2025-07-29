export const formatCurrency = (amount: number, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};
