
exports.formatAmount = function formatAmount(a) {
  return d3.format('$.2f')(a/100);

}
