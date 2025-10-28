const randomUtils = require('./randomUtils');

const calculateDamage = (attacker, defender) => {
  const baseDamage = attacker.attackPower || 10;
  const defense = defender.defense || 0;
  const typeModifier = getTypeModifier(attacker.type, defender.type);
  const randomFactor = randomUtils.getRandomFloat(0.85, 1.15);
  return Math.max(0, Math.round(baseDamage * typeModifier * randomFactor - defense));
};

const getTypeModifier = (attackerType, defenderType) => {
  const typeChart = {
    'VIRAL': { 'BACTERIAL': 1.5, 'FUNGAL': 0.5, 'VIRAL': 1 },
    'BACTERIAL': { 'FUNGAL': 1.5, 'VIRAL': 0.5, 'BACTERIAL': 1 },
    'FUNGAL': { 'VIRAL': 1.5, 'BACTERIAL': 0.5, 'FUNGAL': 1 }
  };
  return typeChart[attackerType]?.[defenderType] || 1;
};

const calculateHitProbability = (attacker, defender) => {
  const baseAccuracy = attacker.accuracy || 80;
  const evasion = defender.evasion || 10;
  return Math.min(100, Math.max(0, baseAccuracy - evasion));
};

const determineCombatOutcome = (antibodies, pathogens) => {
  let antibodyHealth = antibodies.reduce((sum, a) => sum + (a.health || 100), 0);
  let pathogenHealth = pathogens.reduce((sum, p) => sum + (p.health || 100), 0);

  while (antibodyHealth > 0 && pathogenHealth > 0) {
    // Simulate one round
    antibodies.forEach((antibody) => {
      if (antibodyHealth <= 0 || pathogenHealth <= 0) return;
      const target = randomUtils.getRandomElement(pathogens);
      const damage = calculateDamage(antibody, target);
      pathogenHealth -= damage;
    });

    pathogens.forEach((pathogen) => {
      if (antibodyHealth <= 0 || pathogenHealth <= 0) return;
      const target = randomUtils.getRandomElement(antibodies);
      const damage = calculateDamage(pathogen, target);
      antibodyHealth -= damage;
    });
  }

  return antibodyHealth > 0 ? 'ANTIBODIES_WIN' : 'PATHOGENS_WIN';
};

module.exports = {
  calculateDamage,
  getTypeModifier,
  calculateHitProbability,
  determineCombatOutcome
};
