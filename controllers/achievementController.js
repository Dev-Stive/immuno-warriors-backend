const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const AchievementService = require('../services/achievementService');
const { logger } = require('../utils/logger');

const createAchievementSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('combat', 'exploration', 'research', 'progression').optional(),
  criteria: Joi.object().optional(),
  reward: Joi.object({
    credits: Joi.number().integer().min(0).optional(),
    xp: Joi.number().integer().min(0).optional(),
    items: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        quantity: Joi.number().integer().min(1).default(1),
      })
    ).optional(),
  }).optional(),
  category: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
});

const updateAchievementSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('combat', 'exploration', 'research', 'progression').optional(),
  criteria: Joi.object().optional(),
  reward: Joi.object({
    credits: Joi.number().integer().min(0).optional(),
    xp: Joi.number().integer().min(0).optional(),
    items: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        quantity: Joi.number().integer().min(1).default(1),
      })
    ).optional(),
  }).optional(),
  category: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
}).min(1);

const unlockAchievementSchema = Joi.object({
  achievementId: Joi.string().uuid().required(),
});

const updateAchievementProgressSchema = Joi.object({
  progress: Joi.object().min(1).required(),
});

const claimRewardSchema = Joi.object({
  achievementId: Joi.string().uuid().required(),
});

const getAchievementsByCategorySchema = Joi.object({
  category: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
});

class AchievementController {
  async getAchievements(req, res, next) {
    try {
      const achievements = await AchievementService.getAchievements();
      res.status(200).json({
        status: 'success',
        data: achievements,
      });
    } catch (error) {
      logger.error('Erreur dans getAchievements', { error });
      next(error);
    }
  }

  async getAchievement(req, res, next) {
    try {
      const { achievementId } = req.params;
      const achievement = await AchievementService.getAchievement(achievementId);
      res.status(200).json({
        status: 'success',
        data: achievement,
      });
    } catch (error) {
      logger.error('Erreur dans getAchievement', { error });
      next(error);
    }
  }

  async getUserAchievements(req, res, next) {
    try {
      const { userId } = req.user;
      const achievements = await AchievementService.getUserAchievements(userId);
      res.status(200).json({
        status: 'success',
        data: achievements,
      });
    } catch (error) {
      logger.error('Erreur dans getUserAchievements', { error });
      next(error);
    }
  }

  async getAchievementsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const achievements = await AchievementService.getAchievementsByCategory(category);
      res.status(200).json({
        status: 'success',
        data: achievements,
      });
    } catch (error) {
      logger.error('Erreur dans getAchievementsByCategory', { error });
      next(error);
    }
  }

  async createAchievement(req, res, next) {
    try {
      const achievementData = req.body;
      const achievement = await AchievementService.createAchievement(achievementData);
      res.status(201).json({
        status: 'success',
        data: achievement,
      });
    } catch (error) {
      logger.error('Erreur dans createAchievement', { error });
      next(error);
    }
  }

  async updateAchievement(req, res, next) {
    try {
      const { achievementId } = req.params;
      const updates = req.body;
      const updatedAchievement = await AchievementService.updateAchievement(achievementId, updates);
      res.status(200).json({
        status: 'success',
        data: updatedAchievement,
      });
    } catch (error) {
      logger.error('Erreur dans updateAchievement', { error });
      next(error);
    }
  }

  async deleteAchievement(req, res, next) {
    try {
      const { achievementId } = req.params;
      await AchievementService.deleteAchievement(achievementId);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      logger.error('Erreur dans deleteAchievement', { error });
      next(error);
    }
  }

  async unlockAchievement(req, res, next) {
    try {
      const { userId } = req.user;
      const { achievementId } = req.body;
      const rewards = await AchievementService.unlockAchievement(userId, achievementId);
      res.status(200).json({
        status: 'success',
        message: 'Succès déverrouillé',
        data: rewards,
      });
    } catch (error) {
      logger.error('Erreur dans unlockAchievement', { error });
      next(error);
    }
  }

  async updateAchievementProgress(req, res, next) {
    try {
      const { userId } = req.user;
      const { achievementId } = req.params;
      const { progress } = req.body;
      await AchievementService.updateAchievementProgress(userId, achievementId, progress);
      res.status(200).json({
        status: 'success',
        message: 'Progression du succès mise à jour',
      });
    } catch (error) {
      logger.error('Erreur dans updateAchievementProgress', { error });
      next(error);
    }
  }

  async claimReward(req, res, next) {
    try {
      const { userId } = req.user;
      const { achievementId } = req.body;
      const rewards = await AchievementService.claimReward(userId, achievementId);
      res.status(200).json({
        status: 'success',
        message: 'Récompenses réclamées',
        data: rewards,
      });
    } catch (error) {
      logger.error('Erreur dans claimReward', { error });
      next(error);
    }
  }

  async notifyAchievementUnlocked(req, res, next) {
    try {
      const { userId } = req.user;
      const { achievementId } = req.params;
      await AchievementService.notifyAchievementUnlocked(userId, achievementId);
      res.status(200).json({
        status: 'success',
        message: 'Notification envoyée',
      });
    } catch (error) {
      logger.error('Erreur dans notifyAchievementUnlocked', { error });
      next(error);
    }
  }
}

const controller = new AchievementController();
module.exports = {
  getAchievements: controller.getAchievements.bind(controller),
  getAchievement: controller.getAchievement.bind(controller),
  getUserAchievements: controller.getUserAchievements.bind(controller),
  getAchievementsByCategory: [validate(getAchievementsByCategorySchema), controller.getAchievementsByCategory.bind(controller)],
  createAchievement: [validate(createAchievementSchema), controller.createAchievement.bind(controller)],
  updateAchievement: [validate(updateAchievementSchema), controller.updateAchievement.bind(controller)],
  deleteAchievement: controller.deleteAchievement.bind(controller),
  unlockAchievement: [validate(unlockAchievementSchema), controller.unlockAchievement.bind(controller)],
  updateAchievementProgress: [validate(updateAchievementProgressSchema), controller.updateAchievementProgress.bind(controller)],
  claimReward: [validate(claimRewardSchema), controller.claimReward.bind(controller)],
  notifyAchievementUnlocked: controller.notifyAchievementUnlocked.bind(controller),
  createAchievementSchema,
  updateAchievementSchema,
  unlockAchievementSchema,
  updateAchievementProgressSchema,
  claimRewardSchema,
  getAchievementsByCategorySchema,
};
