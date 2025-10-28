const {logger}  = require('../utils/logger');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn('Erreur de validation des données', { details: error.details });
      return res.status(400).json({
        error: 'Erreur de validation',
        details: error.details.map((d) => d.message),
      });
    }
    next();
  };
};


module.exports = validate;
