function normalizeIndianPhone(phone) {
  if (!phone) return null;

  let value = String(phone).replace(/\D/g, "");

  if (value.startsWith("91") && value.length === 12) {
    return value;
  }

  if (value.length === 10) {
    return `91${value}`;
  }

  return value;
}

module.exports = { normalizeIndianPhone };