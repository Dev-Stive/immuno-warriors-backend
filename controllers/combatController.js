const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const CombatService = require('../services/combatService');
const { logger } = require('../utils/logger');

const startCombatSchema = Joi.object({
  baseId: Joi.string().uuid().required(),
  pathogens: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().required(),
      type: Joi.string().valid('virus', 'bacteria', 'fungus').required(),
      health: Joi.number().integer().min(0).optional(),
      attack: Joi.number().integer().min(0).optional(),
    })
  ).required(),
  antibodies: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().required(),
      type: Joi.string().valid('igG', 'igM', 'igA', 'igD', 'igE').required(),
      health: Joi.number().integer().min(0).optional(),
      damage: Joi.number().integer().min(0).optional(),
    })
  ).required(),
});

const endCombatSchema = Joi.object({
  pathogens: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().required(),
      type: Joi.string().valid('virus', 'bacteria', 'fungus').required(),
      health: Joi.number().integer().min(0).optional(),
      attack: Joi.number().integer().min(0).optional(),
    })
  ).required(),
  antibodies: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().required(),
      type: Joi.string().valid('igG', 'igM', 'igA', 'igD', 'igE').required(),
      health: Joi.number().integer().min(0).optional(),
      damage: Joi.number().integer().min(0).optional(),
    })
  ).required(),
});

class CombatController {
  async startCombat(req, res, next) {
    try {
      const { userId } = req.user;
      const combatConfig = req.body;
      const combatId = await CombatService.startCombat(userId, combatConfig);
      res.status(201).json({
        status: 'success',
        data: { combatId },
      });
    } catch (error) {
      logger.error('Erreur dans startCombat', { error });
      next(error);
    }
  }

  async endCombat(req, res, next) {
    try {
      const { combatId } = req.params;
      const { pathogens, antibodies } = req.body;
      const result = await CombatService.endCombat(combatId, pathogens, antibodies);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      logger.error('Erreur dans endCombat', { error });
      next(error);
    }
  }

  async getCombatReport(req, res, next) {
    try {
      const { combatId } = req.params;
      const report = await CombatService.getCombatReport(combatId);
      res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      logger.error('Erreur dans getCombatReport', { error });
      next(error);
    }
  }

  async getCombatHistory(req, res, next) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 10 } = req.query;
      const history = await CombatService.getCombatHistory(userId, parseInt(page), parseInt(limit));
      res.status(200).json({
        status: 'success',
        data: history,
      });
    } catch (error) {
      logger.error('Erreur dans getCombatHistory', { error });
      next(error);
    }
  }

  async generateChronicle(req, res, next) {
    try {
      const { combatId } = req.params;
      const chronicle = await CombatService.generateChronicle(combatId);
      res.status(200).json({
        status: 'success',
        data: chronicle,
      });
    } catch (error) {
      logger.error('Erreur dans generateChronicle', { error });
      next(error);
    }
  }

  async getTacticalAdvice(req, res, next) {
    try {
      const { combatId } = req.params;
      const advice = await CombatService.getTacticalAdvice(combatId);
      res.status(200).json({
        status: 'success',
        data: advice,
      });
    } catch (error) {
      logger.error('Erreur dans getTacticalAdvice', { error });
      next(error);
    }
  }
}

const controller = new CombatController();
module.exports = {
  startCombat: [validate(startCombatSchema), controller.startCombat],
  endCombat: [validate(endCombatSchema), controller.endCombat],
  getCombatReport: controller.getCombatReport,
  getCombatHistory: controller.getCombatHistory,
  generateChronicle: controller.generateChronicle,
  getTacticalAdvice: controller.getTacticalAdvice,
  startCombatSchema,
  endCombatSchema,
};
