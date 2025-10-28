const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const MemoryService = require('../services/memoryService');
const { logger } = require('../utils/logger');

const addMemorySignatureSchema = Joi.object({
  pathogenType: Joi.string().valid('virus', 'bacteria', 'fungus').required(),
  attackBonus: Joi.number().integer().min(0).required(),
  defenseBonus: Joi.number().integer().min(0).required(),
  expiryDate: Joi.string().isoDate().required(),
});

const validateSignatureSchema = Joi.object({
  signatureId: Joi.string().uuid().required(),
});

class MemoryController {
  async addMemorySignature(req, res, next) {
    try {
      const { userId } = req.user;
      const signatureData = req.body;
      const signature = await MemoryService.addMemorySignature(userId, signatureData);
      res.status(201).json({
        status: 'success',
        data: signature,
      });
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de la signature mémoire', { error });
      next(error);
    }
  }

  async getUserMemorySignatures(req, res, next) {
    try {
      const { userId } = req.user;
      const signatures = await MemoryService.getUserMemorySignatures(userId);
      res.status(200).json({
        status: 'success',
        data: signatures,
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des signatures mémoire', { error });
      next(error);
    }
  }

  async validateMemorySignature(req, res, next) {
    try {
      const { signatureId } = req.params;
      const result = await MemoryService.validateMemorySignature(signatureId);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logger.error('Erreur lors de la validation de la signature mémoire', { error });
      next(error);
    }
  }

  async clearExpiredSignatures(req, res, next) {
    try {
      await MemoryService.clearExpiredSignatures();
      res.status(200).json({
        status: 'success',
        data: { message: 'Signatures mémoire expirées supprimées' },
      });
    } catch (error) {
      logger.error('Erreur lors de la suppression des signatures mémoire expirées', { error });
      next(error);
    }
  }
}

const controller = new MemoryController();
module.exports = {
  addMemorySignature: [validate(addMemorySignatureSchema), controller.addMemorySignature.bind(controller)],
  getUserMemorySignatures: [controller.getUserMemorySignatures.bind(controller)],
  validateMemorySignature: [validate(validateSignatureSchema), controller.validateMemorySignature.bind(controller)],
  clearExpiredSignatures: [controller.clearExpiredSignatures.bind(controller)],
  addMemorySignatureSchema,
  validateSignatureSchema,
};
