const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const GeminiService = require('../services/geminiAiService');
const { logger } = require('../utils/logger');

const chatSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
});

const combatChronicleSchema = Joi.object({
  combatId: Joi.string().uuid().required(),
});

const tacticalAdviceSchema = Joi.object({
  combatId: Joi.string().uuid().required(),
});

const researchDescriptionSchema = Joi.object({
  researchId: Joi.string().uuid().required(),
});

const baseDescriptionSchema = Joi.object({
  baseId: Joi.string().uuid().required(),
});

const storedResponsesSchema = Joi.object({
  type: Joi.string().valid('combat_chronicle', 'tactical_advice', 'research_description', 'base_description', 'chat').optional(),
});

class GeminiController {
  async chat(req, res, next) {
    try {
      const { userId } = req.user;
      const { message } = req.body;
      const response = await GeminiService.chatWithGemini(userId, message);
      res.status(200).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      logger.error('Erreur dans chat', { error });
      next(error);
    }
  }

  async generateCombatChronicle(req, res, next) {
    try {
      const { combatId } = req.params;
      const response = await GeminiService.generateCombatChronicle(combatId);
      res.status(200).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      logger.error('Erreur dans generateCombatChronicle', { error });
      next(error);
    }
  }

  async getTacticalAdvice(req, res, next) {
    try {
      const { combatId } = req.params;
      const response = await GeminiService.getTacticalAdvice(combatId);
      res.status(200).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      logger.error('Erreur dans getTacticalAdvice', { error });
      next(error);
    }
  }

  async generateResearchDescription(req, res, next) {
    try {
      const { researchId } = req.params;
      const response = await GeminiService.generateResearchDescription(researchId);
      res.status(200).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      logger.error('Erreur dans generateResearchDescription', { error });
      next(error);
    }
  }

  async generateBaseDescription(req, res, next) {
    try {
      const { baseId } = req.params;
      const response = await GeminiService.generateBaseDescription(baseId);
      res.status(200).json({
        status: 'success',
        data: response,
      });
    } catch (error) {
      logger.error('Erreur dans generateBaseDescription', { error });
      next(error);
    }
  }

  async getStoredResponses(req, res, next) {
    try {
      const { userId } = req.user;
      const { type } = req.query;
      const responses = await GeminiService.getStoredResponses(userId, type);
      res.status(200).json({
        status: 'success',
        data: responses,
      });
    } catch (error) {
      logger.error('Erreur dans getStoredResponses', { error });
      next(error);
    }
  }
}

const controller = new GeminiController();
module.exports = {
  chat: [validate(chatSchema), controller.chat.bind(controller)],
  generateCombatChronicle: [validate(combatChronicleSchema), controller.generateCombatChronicle.bind(controller)],
  getTacticalAdvice: [validate(tacticalAdviceSchema), controller.getTacticalAdvice.bind(controller)],
  generateResearchDescription: [validate(researchDescriptionSchema), controller.generateResearchDescription.bind(controller)],
  generateBaseDescription: [validate(baseDescriptionSchema), controller.generateBaseDescription.bind(controller)],
  getStoredResponses: [validate(storedResponsesSchema), controller.getStoredResponses.bind(controller)],
  chatSchema,
  combatChronicleSchema,
  tacticalAdviceSchema,
  researchDescriptionSchema,
  baseDescriptionSchema,
  storedResponsesSchema,
};
