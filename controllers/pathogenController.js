const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const PathogenService = require('../services/pathogenService');
const { AppError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');


const createPathogenSchema = Joi.object({
  type: Joi.string().valid('virus', 'bacteria', 'fungus').required(),
  name: Joi.string().max(100).required(),
  attackType: Joi.string().valid('physical', 'chemical', 'energy').required(),
  resistanceType: Joi.string().valid('physical', 'chemical', 'energy').required(),
  rarity: Joi.string().valid('common', 'uncommon', 'rare', 'epic', 'legendary').required(),
  mutationRate: Joi.number().min(0).max(1).required(),
  health: Joi.number().integer().min(1).required(),
  attack: Joi.number().integer().min(0).required(),
  abilities: Joi.array().items(Joi.string()).optional(),
});

const getPathogensByTypeSchema = Joi.object({
  type: Joi.string().valid('virus', 'bacteria', 'fungus').required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(10).default(10),
});

const getPathogensByRaritySchema = Joi.object({
  rarity: Joi.string().valid('common', 'uncommon', 'rare', 'epic', 'legendary').required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(10).default(10),
});

const updatePathogenStatsSchema = Joi.object({
  health: Joi.number().integer().min(0).optional(),
  attack: Joi.number().integer().min(0).optional(),
  abilities: Joi.array().items(Joi.string()).optional(),
}).min(1);

class PathogenController {
  async createPathogen(req, res, next) {
    try {
      const { userId } = req.user;
      const pathogenData = req.body;
      const pathogen = await PathogenService.createPathogen(userId, pathogenData);
      res.status(201).json({ status: 'success', data: pathogen });
    } catch (error) {
      logger.error('Erreur dans createPathogen', { error });
      next(error);
    }
  }

  async getPathogensByType(req, res, next) {
    try {
      const { type } = req.params;
      const { page, limit } = req.query;
      const { data, total } = await PathogenService.getPathogensByType(type, parseInt(page), parseInt(limit));
      res.status(200).json({
        status: 'success',
        data,
        meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      logger.error('Erreur dans getPathogensByType', { error });
      next(error);
    }
  }

  async getPathogensByRarity(req, res, next) {
    try {
      const { rarity } = req.params;
      const { page, limit } = req.query;
      const { data, total } = await PathogenService.getPathogensByRarity(rarity, parseInt(page), parseInt(limit));
      res.status(200).json({
        status: 'success',
        data,
        meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      logger.error('Erreur dans getPathogensByRarity', { error });
      next(error);
    }
  }

  async updatePathogenStats(req, res, next) {
    try {
      const { userId } = req.user;
      const { pathogenId } = req.params;
      const statsData = req.body;
      const updatedPathogen = await PathogenService.updatePathogenStats(userId, pathogenId, statsData);
      res.status(200).json({ status: 'success', data: updatedPathogen });
    } catch (error) {
      logger.error('Erreur dans updatePathogenStats', { error });
      next(error);
    }
  }

  async getAllPathogens(req, res, next) {
    try {
      const { page, limit } = req.query;
      const { data, total } = await PathogenService.getAllPathogens(parseInt(page), parseInt(limit));
      res.status(200).json({
        status: 'success',
        data,
        meta: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      logger.error('Erreur dans getAllPathogens', { error });
      next(error);
    }
  }

  async deletePathogen(req, res, next) {
    try {
      const { userId } = req.user;
      const { pathogenId } = req.params;
      await PathogenService.deletePathogen(userId, pathogenId);
      res.status(200).json({ status: 'success', data: { message: 'Pathogène supprimé' } });
    } catch (error) {
      logger.error('Erreur dans deletePathogen', { error });
      next(error);
    }
  }
}

const controller = new PathogenController();
module.exports = {
  createPathogen: [validate(createPathogenSchema), controller.createPathogen.bind(controller)],
  getPathogensByType: [validate(getPathogensByTypeSchema), controller.getPathogensByType.bind(controller)],
  getPathogensByRarity: [validate(getPathogensByRaritySchema), controller.getPathogensByRarity.bind(controller)],
  updatePathogenStats: [validate(updatePathogenStatsSchema), controller.updatePathogenStats.bind(controller)],
  getAllPathogens: controller.getAllPathogens.bind(controller),
  deletePathogen: controller.deletePathogen.bind(controller),
  createPathogenSchema,
  getPathogensByTypeSchema,
  getPathogensByRaritySchema,
  updatePathogenStatsSchema,
};