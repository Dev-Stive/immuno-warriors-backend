const Joi = require('joi');
const validate = require('../middleware/validationMiddleware');
const InventoryService = require('../services/inventoryService');
const { AppError } = require('../utils/errorUtils');
const { logger } = require('../utils/logger');
const { inventorySchema, updateSchema } = require('../models/inventoryModel');

const addInventorySchema = inventorySchema;
const updateInventorySchema = updateSchema;
const itemIdSchema = Joi.object({
  itemId: Joi.string().uuid().required(),
});

class InventoryController {
  async addInventoryItem(req, res, next) {
    try {
      const { userId } = req.user;
      const itemData = req.body;
      const item = await InventoryService.addInventoryItem(userId, itemData);
      res.status(201).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      logger.error('Erreur dans addInventoryItem', { error });
      next(error);
    }
  }

  async getInventoryItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const item = await InventoryService.getInventoryItem(itemId);
      res.status(200).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      logger.error('Erreur dans getInventoryItem', { error });
      next(error);
    }
  }

  async getUserInventory(req, res, next) {
    try {
      const { userId } = req.user;
      const inventory = await InventoryService.getUserInventory(userId);
      res.status(200).json({
        status: 'success',
        data: inventory,
      });
    } catch (error) {
      logger.error('Erreur dans getUserInventory', { error });
      next(error);
    }
  }

  async updateInventoryItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const updates = req.body;
      const updatedItem = await InventoryService.updateInventoryItem(itemId, updates);
      res.status(200).json({
        status: 'success',
        data: updatedItem,
      });
    } catch (error) {
      logger.error('Erreur dans updateInventoryItem', { error });
      next(error);
    }
  }

  async deleteInventoryItem(req, res, next) {
    try {
      const { itemId } = req.params;
      await InventoryService.deleteInventoryItem(itemId);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      logger.error('Erreur dans deleteInventoryItem', { error });
      next(error);
    }
  }
}

const controller = new InventoryController();
module.exports = {
  addInventoryItem: [validate(addInventorySchema), controller.addInventoryItem.bind(controller)],
  getInventoryItem: [validate(itemIdSchema), controller.getInventoryItem.bind(controller)],
  getUserInventory: [controller.getUserInventory.bind(controller)],
  updateInventoryItem: [validate(itemIdSchema), validate(updateInventorySchema), controller.updateInventoryItem.bind(controller)],
  deleteInventoryItem: [validate(itemIdSchema), controller.deleteInventoryItem.bind(controller)],
  addInventorySchema,
  updateInventorySchema,
  itemIdSchema,
};
