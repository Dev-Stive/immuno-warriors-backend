const { v4: uuidv4 } = require('uuid');
const { AppError, NotFoundError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { validateMemorySignature } = require('../models/memorySignatureModel');
const MemoryRepository = require('../repositories/memoryRepository');
const UserRepository = require('../repositories/userRepository');

class MemoryService {
  async addMemorySignature(userId, signatureData) {
    try {
      if (!userId || !signatureData) throw new AppError(400, 'Données invalides');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const { error } = validateMemorySignature(signatureData);
      if (error) throw new AppError(400, `Données de signature invalides: ${error.message}`);

      const signatureId = uuidv4();
      const signature = {
        id: signatureId,
        userId,
        ...signatureData
      };
      await MemoryRepository.addMemorySignature(userId, signature);
      logger.info(`Signature mémoire ${signatureId} ajoutée pour l'utilisateur ${userId}`);
      return signature;
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de la signature mémoire', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de l\'ajout de la signature mémoire');
    }
  }

  async getUserMemorySignatures(userId) {
    try {
      if (!userId) throw new AppError(400, 'ID d\'utilisateur invalide');
      const user = await UserRepository.getCurrentUser(userId);
      if (!user) throw new NotFoundError('Utilisateur non trouvé');

      const signatures = await MemoryRepository.getMemorySignatures(userId);
      const formattedSignatures = signatures.map(sig => ({
        id: sig.id,
        userId,
        ...fromFirestore(sig)
      }));
      logger.info(`Signatures mémoire récupérées pour l'utilisateur ${userId}: ${signatures.length} signatures`);
      return formattedSignatures;
    } catch (error) {
      logger.error('Erreur lors de la récupération des signatures mémoire', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la récupération des signatures mémoire');
    }
  }

  async validateMemorySignature(signatureId) {
    try {
      if (!signatureId) throw new AppError(400, 'ID de signature invalide');
      const isValid = await MemoryRepository.validateMemorySignature(signatureId);
      logger.info(`Signature mémoire ${signatureId} validée : ${isValid}`);
      return { isValid };
    } catch (error) {
      logger.error('Erreur lors de la validation de la signature mémoire', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la validation de la signature mémoire');
    }
  }

  async clearExpiredSignatures() {
    try {
      await MemoryRepository.clearExpiredMemorySignatures();
      logger.info('Signatures mémoire expirées supprimées');
    } catch (error) {
      logger.error('Erreur lors de la suppression des signatures expirées', { error });
      throw error instanceof AppError ? error : new AppError(500, 'Erreur serveur lors de la suppression des signatures expirées');
    }
  }
}

module.exports = new MemoryService();
