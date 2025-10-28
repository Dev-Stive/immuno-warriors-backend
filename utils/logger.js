const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { format } = require('winston');
const { v4: uuidv4 } = require('uuid');

// Contexte global pour les logs
let logContext = {};

// Emojis par niveau de log
const levelEmojis = {
  info: '✅',
  error: '🚨',
  warn: '⚠️',
  debug: '🔍',
  fatal: '💥',
};

// Format personnalisé pour les logs
const customFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
  const formattedTimestamp = new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  // Déterminer le niveau pour l'emoji (gérer 'fatal' explicitement)
  const levelKey = level;
  const levelStyled = levelKey.padEnd(7);
  const contextStr = Object.keys(logContext).length > 0 
    ? ` | Contexte: ${JSON.stringify(logContext)}` 
    : '';
  const filteredMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([key]) => key !== 'level' && key !== 'timestamp' && key !== 'splat')
  );
  const metaStr = Object.keys(filteredMetadata).length > 0 
    ? ` | ${JSON.stringify(filteredMetadata)}` 
    : '';
  return `💥[ImmunoWarriors] ${formattedTimestamp} | ${levelStyled} | ${message}${contextStr}${metaStr}`;
});

// Logger Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.colorize({ all: true }),
        customFormat
      ),
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// Intercepter console.log
const originalConsoleLog = console.log;
console.log = (message, ...args) => {
  const meta = args.length > 0 ? { args } : {};
  logger.info(String(message), meta);
};

// Méthodes du logger
module.exports = {
  logger,
  setContext: (context = {}) => {
    logContext = { requestId: uuidv4(), ...context };
  },
  info: (message, meta = {}) => logger.info(String(message), { ...logContext, ...meta }),
  error: (message, meta = {}) => logger.error(String(message), { ...logContext, ...meta }),
  warn: (message, meta = {}) => logger.warn(String(message), { ...logContext, ...meta }),
  debug: (message, meta = {}) => logger.debug(String(message), { ...logContext, ...meta }),
  fatal: (message, meta = {}) => logger.error(String(message), { ...logContext, level: 'fatal', ...meta }),
  log: (level, message, meta = {}) => logger.log(level, String(message), { ...logContext, ...meta }),
};
