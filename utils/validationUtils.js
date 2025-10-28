const Joi = require('joi');
const { ValidationError } = require('./errorUtils');

const validateSchema = async (data, schema) => {
  try {
    await schema.validateAsync(data, { abortEarly: false });
    return null;
  } catch (error) {
    return new ValidationError('Invalid input', error.details.map(d => d.message));
  }
};


const idSchema = Joi.string().uuid().required();
const userIdSchema = Joi.string().uuid().required();
const typeSchema = Joi.string().valid('VIRAL', 'BACTERIAL', 'FUNGAL').required();
const statsSchema = Joi.object().pattern(Joi.string(), Joi.number());

const antibodySchema = Joi.object({
  id: idSchema,
  type: typeSchema,
  attackType: Joi.string().valid('MELEE', 'RANGED', 'SUPPORT').required(),
  attackPower: Joi.number().min(0).required(),
  health: Joi.number().min(0).required(),
  accuracy: Joi.number().min(0).max(100).required()
});

const pathogenSchema = Joi.object({
  id: idSchema,
  type: typeSchema,
  health: Joi.number().min(0).required(),
  defense: Joi.number().min(0).required(),
  evasion: Joi.number().min(0).max(100).required()
});

module.exports = {
  validateSchema,
  idSchema,
  userIdSchema,
  typeSchema,
  statsSchema,
  antibodySchema,
  pathogenSchema
};
