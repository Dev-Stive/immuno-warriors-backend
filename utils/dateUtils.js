const formatTimestamp = (date = new Date()) => {
  return date.toISOString();
};

const isExpired = (timestamp, ttlSeconds) => {
  const expirationDate = new Date(timestamp);
  expirationDate.setSeconds(expirationDate.getSeconds() + ttlSeconds);
  return new Date() > expirationDate;
};

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

const addSeconds = (date, seconds) => {
  const newDate = new Date(date);
  newDate.setSeconds(newDate.getSeconds() + seconds);
  return newDate.toISOString();
};

const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = {
  formatTimestamp,
  isExpired,
  getCurrentTimestamp,
  addSeconds,
  daysBetween
};
