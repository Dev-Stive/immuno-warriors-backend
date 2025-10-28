const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const ProgressionService = require('../services/progressionService');
const { logger } = require('../utils/logger');

const addXPSchema = Joi.object({
  xp: Joi.number().integer().min(1).required(),
});

const completeMissionSchema = Joi.object({
  missionId: Joi.string().uuid().required(),
});

class ProgressionController {
  async getProgression(req, res, next) {
    try {
      const { userId } = req.user;
      const progression = await ProgressionService.getProgression(userId);
      res.status(200).json({
        status: 'success',
        data: progression,
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération de la progression', { error });
      next(error);
    }
  }

  async addXP(req, res, next) {
    try {
      const { userId } = req.user;
      const { xp } = req.body;
      const progression = await ProgressionService.addXP(userId, xp);
      res.status(200).json({
        status: 'success',
        data: progression,
      });
    } catch (error) {
      logger.error('Erreur lors de l\'ajout d\'XP', { error });
      next(error);
    }
  }

  async completeMission(req, res, next) {
    try {
      const { userId } = req.user;
      const { missionId } = req.params;
      const progression = await ProgressionService.completeMission(userId, missionId);
      res.status(200).json({
        status: 'success',
        data: progression,
      });
    } catch (error) {
      logger.error('Erreur lors de la complétion de la mission', { error });
      next(error);
    }
  }
}

const controller = new ProgressionController();
module.exports = {
  getProgression: [controller.getProgression.bind(controller)],
  addXP: [validate(addXPSchema), controller.addXP.bind(controller)],
  completeMission: [validate(completeMissionSchema), controller.completeMission.bind(controller)],
  addXPSchema,
  completeMissionSchema,
};
