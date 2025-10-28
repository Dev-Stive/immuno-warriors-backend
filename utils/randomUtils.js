const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomFloat = (min, max) => {
  return Math.random() * (max - min) + min;
};

const getRandomElement = (array) => {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
};

const generateRandomStats = (baseStats, variance = 0.2) => {
  const stats = {};
  for (const [key, value] of Object.entries(baseStats)) {
    const min = value * (1 - variance);
    const max = value * (1 + variance);
    stats[key] = Math.round(getRandomFloat(min, max));
  }
  return stats;
};

const shouldDropLoot = (dropRate) => {
  return Math.random() < dropRate;
};

module.exports = {
  getRandomInt,
  getRandomFloat,
  getRandomElement,
  generateRandomStats,
  shouldDropLoot
};
