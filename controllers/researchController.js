const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const ResearchService = require('../services/researchService');

const unlockResearchSchema = Joi.object({
  researchId: Joi.string().uuid().required(),
});

const updateResearchProgressSchema = Joi.object({
  progress: Joi.number().min(0).max(100).required(),
});

class ResearchController {
  async getResearchTree(req, res) {
    try {
      const researchTree = await ResearchService.getResearchTree();
      res.status(200).json(researchTree);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async getResearchProgress(req, res) {
    const { userId } = req.user;
    try {
      const progress = await ResearchService.getResearchProgress(userId);
      res.status(200).json(progress);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async unlockResearch(req, res) {
    const { userId } = req.user;
    const { researchId } = req.body;
    try {
      await ResearchService.unlockResearch(userId, researchId);
      res.status(200).json({ message: 'Recherche déverrouillée' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async updateResearchProgress(req, res) {
    const { userId } = req.user;
    const { researchId } = req.params;
    const { progress } = req.body;
    try {
      await ResearchService.updateResearchProgress(userId, researchId, { progress });
      res.status(200).json({ message: 'Progression mise à jour' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
}

const controller = new ResearchController();
module.exports = {
  getResearchTree: controller.getResearchTree.bind(controller),
  getResearchProgress: controller.getResearchProgress.bind(controller),
  unlockResearch: [validate(unlockResearchSchema), controller.unlockResearch.bind(controller)],
  updateResearchProgress: [validate(updateResearchProgressSchema), controller.updateResearchProgress.bind(controller)],
};
