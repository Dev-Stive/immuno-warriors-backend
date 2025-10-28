const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const AntibodyService = require('../services/antibodyService');
const { AppError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');

const createAntibodySchema = Joi.object({
  type: Joi.string().valid('igG', 'igM', 'igA', 'igD', 'igE').required(),
  name: Joi.string().min(3).max(50).required(),
  attackType: Joi.string().valid('physical', 'chemical', 'energy').required(),
  stats: Joi.object({
    damage: Joi.number().integer().min(0).required(),
    range: Joi.number().integer().min(0).required(),
    cost: Joi.number().integer().min(0).required(),
    efficiency: Joi.number().min(0).max(1).required(),
    health: Joi.number().integer().min(0).required(),
    maxHealth: Joi.number().integer().min(0).required(),
  }).required(),
  specialAbility: Joi.string().max(100).optional(),
    targetPreferences: Joi.object({
    pathogenType: Joi.string().valid('virus', 'bacteria', 'fungus').optional(),
    bonus: Joi.number().min(0).max(1).optional(),
  }).optional(),
  });


const updateAntibodyStatsSchema = Joi.object({
  damage: Joi.number().integer().min(0).optional(),
  range: Joi.number().integer().min(0).optional(),
  cost: Joi.number().integer().min(0).optional(),
  efficiency: Joi.number().min(0).max(1).optional(),
  health: Joi.number().integer().min(0).optional(),
  maxHealth: Joi.number().integer().min(0).optional(),
  specialAbility: Joi.string().max(100).optional(),

  
}).min(1);

const assignSpecialAbilitySchema = Joi.object({
  specialAbility: Joi.string().max(100).required(),
});

const simulateCombatEffectSchema = Joi.object({
  pathogenId: Joi.string().uuid().required(),
});

class AntibodyController {
  async getAllAntibodies(req, res, next) {
    try {
      const antibodies = await AntibodyService.getAllAntibodies();
      res.status(200).json({
        status: 'success',
        data: antibodies,
      });
    } catch (error) {
      logger.error('Erreur dans getAllAntibodies', { error });
      next(error);
    }
  }

  async createAntibody(req, res, next) {
    try {
      const antibodyData = req.body;
      const antibody = await AntibodyService.createAntibody(antibodyData);
      res.status(201).json({
        status: 'success',
        data: antibody,
      });
    } catch (error) {
      logger.error('Erreur dans createAntibody', { error });
      next(error);
    }
  }

  async getAntibody(req, res, next) {
    try {
      const { antibodyId } = req.params;
      const antibody = await AntibodyService.getAntibody(antibodyId);
      res.status(200).json({
        status: 'success',
        data: antibody,
      });
    } catch (error) {
      logger.error('Erreur dans getAntibody', { error });
      next(error);
    }
  }

  async getAntibodiesByType(req, res, next) {
    try {
      const { type } = req.params;
      const antibodies = await AntibodyService.getAntibodiesByType(type);
      res.status(200).json({
        status: 'success',
        data: antibodies,
      });
    } catch (error) {
      logger.error('Erreur dans getAntibodiesByType', { error });
      next(error);
    }
  }

  async updateAntibodyStats(req, res, next) {
    try {
      const { antibodyId } = req.params;
      const stats = req.body;
      const updatedAntibody = await AntibodyService.updateAntibodyStats(antibodyId, stats);
      res.status(200).json({
        status: 'success',
        message: 'Statistiques de l\'anticorps mises à jour',
        data: updatedAntibody,
      });
    } catch (error) {
      logger.error('Erreur dans updateAntibodyStats', { error });
      next(error);
    }
  }

  async deleteAntibody(req, res, next) {
    try {
      const { antibodyId } = req.params;
      await AntibodyService.deleteAntibody(antibodyId);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      logger.error('Erreur dans deleteAntibody', { error });
      next(error);
    }
  }

  async assignSpecialAbility(req, res, next) {
    try {
      const { antibodyId } = req.params;
      const { specialAbility } = req.body;
      const updatedAntibody = await AntibodyService.assignSpecialAbility(antibodyId, specialAbility);
      res.status(200).json({
        status: 'success',
        message: 'Capacité spéciale assignée',
        data: updatedAntibody,
      });
    } catch (error) {
      logger.error('Erreur dans assignSpecialAbility', { error });
      next(error);
    }
  }

  async simulateCombatEffect(req, res, next) {
    try {
      const { antibodyId } = req.params;
      const { pathogenId } = req.body;
      const simulationResult = await AntibodyService.simulateCombatEffect(antibodyId, pathogenId);
      res.status(200).json({
        status: 'success',
        data: simulationResult,
      });
    } catch (error) {
      logger.error('Erreur dans simulateCombatEffect', { error });
      next(error);
    }
  }
}

const controller = new AntibodyController();
module.exports = {
  getAllAntibodies: controller.getAllAntibodies.bind(controller),
  createAntibody: [validate(createAntibodySchema), controller.createAntibody.bind(controller)],
  getAntibody: controller.getAntibody.bind(controller),
  getAntibodiesByType: controller.getAntibodiesByType.bind(controller),
  updateAntibodyStats: [validate(updateAntibodyStatsSchema), controller.updateAntibodyStats.bind(controller)],
  deleteAntibody: controller.deleteAntibody.bind(controller),
  assignSpecialAbility: [validate(assignSpecialAbilitySchema), controller.assignSpecialAbility.bind(controller)],
  simulateCombatEffect: [validate(simulateCombatEffectSchema), controller.simulateCombatEffect.bind(controller)],
  createAntibodySchema,
  updateAntibodyStatsSchema,
  assignSpecialAbilitySchema,
  simulateCombatEffectSchema,
};
