const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const ThreatScannerService = require('../services/threatScannerService');

const addThreatSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('pathogen', 'base').required(),
  threatLevel: Joi.number().integer().min(1).max(100).required(),
  details: Joi.object().optional(),
});

class ThreatScannerController {
  async addThreat(req, res) {
    const threatData = req.body;
    try {
      const threat = await ThreatScannerService.addThreat(threatData);
      res.status(201).json(threat);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async getThreat(req, res) {
    const { threatId } = req.params;
    try {
      const threat = await ThreatScannerService.getThreat(threatId);
      res.status(200).json(threat);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async scanThreat(req, res) {
    const { targetId } = req.params;
    try {
      const threat = await ThreatScannerService.scanThreat(targetId);
      res.status(200).json(threat);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
}

const controller = new ThreatScannerController();
module.exports = {
  addThreat: [validate(addThreatSchema), controller.addThreat.bind(controller)],
  getThreat: controller.getThreat.bind(controller),
  scanThreat: controller.scanThreat.bind(controller),
};
