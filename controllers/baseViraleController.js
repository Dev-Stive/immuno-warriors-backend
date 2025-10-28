const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const BaseViraleService = require('../services/baseViraleService');
const { AppError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');

const createBaseSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  defenses: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('wall', 'trap', 'shield', 'turret').required(),
      value: Joi.number().integer().min(0).required(),
    })
  ).optional(),
});

const updateBaseSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  defenses: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('wall', 'trap', 'shield', 'turret').required(),
      value: Joi.number().integer().min(0).required(),
    })
  ).optional(),
}).min(1);

const addPathogenSchema = Joi.object({
  pathogenId: Joi.string().uuid().required(),
});

const removePathogenSchema = Joi.object({
  pathogenId: Joi.string().uuid().required(),
});

const updateDefensesSchema = Joi.object({
  defenses: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('wall', 'trap', 'shield', 'turret').required(),
      value: Joi.number().integer().min(0).required(),
    })
  ).required(),
});

class BaseViraleController {
  async createBase(req, res, next) {
    try {
      const { userId } = req.user;
      const baseData = req.body;
      const base = await BaseViraleService.createBase(userId, baseData);
      res.status(201).json({
        status: 'success',
        data: base,
      });
    } catch (error) {
      logger.error('Erreur dans createBase', { error });
      next(error);
    }
  }

  async getBase(req, res, next) {
    try {
      const { baseId } = req.params;
      const base = await BaseViraleService.getBase(baseId);
      res.status(200).json({
        status: 'success',
        data: base,
      });
    } catch (error) {
      logger.error('Erreur dans getBase', { error });
      next(error);
    }
  }

  async getPlayerBases(req, res, next) {
    try {
      const { userId } = req.user;
      const bases = await BaseViraleService.getPlayerBases(userId);
      res.status(200).json({
        status: 'success',
        data: bases,
      });
    } catch (error) {
      logger.error('Erreur dans getPlayerBases', { error });
      next(error);
    }
  }

  async getAllBases(req, res, next) {
    try {
      const bases = await BaseViraleService.getAllBases();
      res.status(200).json({
        status: 'success',
        data: bases,
      });
    } catch (error) {
      logger.error('Erreur dans getAllBases', { error });
      next(error);
    }
  }

  async updateBase(req, res, next) {
    try {
      const { baseId } = req.params;
      const updates = req.body;
      const updatedBase = await BaseViraleService.updateBase(baseId, updates);
      res.status(200).json({
        status: 'success',
        message: 'Base mise à jour',
        data: updatedBase,
      });
    } catch (error) {
      logger.error('Erreur dans updateBase', { error });
      next(error);
    }
  }

  async deleteBase(req, res, next) {
    try {
      const { baseId } = req.params;
      await BaseViraleService.deleteBase(baseId);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      logger.error('Erreur dans deleteBase', { error });
      next(error);
    }
  }

  async addPathogen(req, res, next) {
    try {
      const { baseId } = req.params;
      const { pathogenId } = req.body;
      await BaseViraleService.addPathogen(baseId, pathogenId);
      res.status(200).json({
        status: 'success',
        message: 'Pathogène ajouté',
      });
    } catch (error) {
      logger.error('Erreur dans addPathogen', { error });
      next(error);
    }
  }

  async removePathogen(req, res, next) {
    try {
      const { baseId } = req.params;
      const { pathogenId } = req.body;
      await BaseViraleService.removePathogen(baseId, pathogenId);
      res.status(200).json({
        status: 'success',
        message: 'Pathogène envoyé',
      });
    } catch (error) {
      logger.error('Erreur dans removePathogen', { error });
      next(error);
    }
  }

  async updateDefenses(req, res, next) {
    try {
      const { baseId } = req.params;
      const { defenses } = req.body;
      await BaseViraleService.updateDefenses(baseId, defenses);
      res.status(200).json({
        status: 'success',
        message: 'Défenses mises à jour',
      });
    } catch (error) {
      logger.error('Erreur dans updateDefenses', { error });
      next(error);
    }
  }

  async levelUpBase(req, res, next) {
    try {
      const { baseId } = req.params;
      const updatedBase = await BaseViraleService.levelUpBase(baseId);
      res.status(200).json({
        status: 'success',
        message: 'Base améliorée',
        data: updatedBase,
      });
    } catch (error) {
      logger.error('Erreur dans levelUpBase', { error });
      next(error);
    }
  }

  async validateForCombat(req, res, next) {
    try {
      const { baseId } = req.params;
      const isValid = await BaseViraleService.validateForCombat(baseId);
      res.status(200).json({
        status: 'success',
        data: { isValid },
      });
    } catch (error) {
      logger.error('Erreur dans validateForCombat', { error });
      next(error);
    }
  }
}

const controller = new BaseViraleController();
module.exports = {
  createBase: [validate(createBaseSchema), controller.createBase.bind(controller)],
  getBase: controller.getBase.bind(controller),
  getPlayerBases: controller.getPlayerBases.bind(controller),
  getAllBases: controller.getAllBases.bind(controller),
  updateBase: [validate(updateBaseSchema), controller.updateBase.bind(controller)],
  deleteBase: controller.deleteBase.bind(controller),
  addPathogen: [validate(addPathogenSchema), controller.addPathogen.bind(controller)],
  removePathogen: [validate(removePathogenSchema), controller.removePathogen.bind(controller)],
  updateDefenses: [validate(updateDefensesSchema), controller.updateDefenses.bind(controller)],
  levelUpBase: controller.levelUpBase.bind(controller),
  validateForCombat: controller.validateForCombat.bind(controller),
  createBaseSchema,
  updateBaseSchema,
  addPathogenSchema,
  removePathogenSchema,
  updateDefensesSchema,
};