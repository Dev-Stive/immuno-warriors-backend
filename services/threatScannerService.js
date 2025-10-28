const { v4: uuidv4 } = require('uuid');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const ThreatScannerRepository = require('../repositories/threatScannerRepository');

class ThreatScannerService {
  async addThreat(threatData) {
    try {
      const threatId = uuidv4();
      const threat = { id: threatId, ...threatData };
      await ThreatScannerRepository.addThreat(threat);
      await ThreatScannerRepository.cacheThreat(threatId, threat);
      logger.info(`Menace ${threatId} ajoutée`);
      return threat;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de la menace', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout de la menace');
    }
  }

  async getThreat(threatId) {
    try {
      const threat = await ThreatScannerRepository.getThreat(threatId);
      if (!threat) throw new NotFoundError('Menace non trouvée');
      logger.info(`Menace ${threatId} récupérée`);
      return threat;
    } catch (error) {
      logger.error('Erreur lors de la récupération de la menace', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération de la menace');
    }
  }

  async scanThreat(targetId) {
    try {
      const threat = await ThreatScannerRepository.getCachedThreat(targetId) || 
        await ThreatScannerRepository.getThreat(targetId);
      if (!threat) throw new NotFoundError('Menace non trouvée');
      logger.info(`Menace ${targetId} scannée`);
      return threat;
    } catch (error) {
      logger.error('Erreur lors du scan de la menace', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors du scan de la menace');
    }
  }
}

module.exports = new ThreatScannerService();
