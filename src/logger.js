/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const winston = require('winston');
const LokiTransport = require('winston-loki');
const ms = require('ms');
const dotenv = require('dotenv');

let logger = {};

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

function processEnv(env) {
  let result = env;
  if (!Number.isNaN(Number(result))) result = Number(result);
  if (result === 'true') result = true;
  if (result === 'false') result = false;
  if (result === 'null') result = null;
  return result;
}

const appName = processEnv(process.env.APP_NAME) || 'space-ranger';
const lokiEnabled = processEnv(process.env.LOKI_ENABLED) || false;
const lokiHost = processEnv(process.env.LOKI_HOST) || 'http://loki:3100';
const consoleLevel = process.env.CONSOLE_LEVEL || 'info';

const LOG_TIME_DIFF = Symbol('LOG_TIME_DIFF');
// adds data to log event info object
const addTimeDiff = winston.format((info) => {
  const now = Date.now();
  if (!this._lastTimestamp) {
    this._lastTimestamp = now;
    info[LOG_TIME_DIFF] = 0;
  } else {
    const diff = now - this._lastTimestamp;
    this._lastTimestamp = now;
    info[LOG_TIME_DIFF] = diff;
  }

  return info;
});

// render it similar to `debug` library
const msgWithTimeDiff = winston.format((info) => {
  info.message = `${info.message} +${ms(info[LOG_TIME_DIFF])}`;
  return info;
});

function WinstonLokiLogger(component) {
  const labels = {
    app: appName,
  };

  const transports = [
    // printing the logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        addTimeDiff(),
        msgWithTimeDiff(),
        winston.format.errors({ stack: true }),
        winston.format.colorize({
          all: true,
        }),
        winston.format.label({
          label: `[${appName}:${component}]`,
        }),
        winston.format.printf((res) => {
          const time = new Date(Date.now());
          const year = time.getUTCFullYear();
          const month = time.getUTCMonth() + 1;
          const date = time.getUTCDate();
          const hour = time.getUTCHours();
          const min = time.getUTCMinutes();
          const sec = time.getUTCSeconds();

          const timeString = `${year}-${(`0${month}`).slice(-2)}-${(`0${date}`).slice(-2)} ${(`0${hour}`).slice(-2)}:${(`0${min}`).slice(-2)}:${(`0${sec}`).slice(-2)}Z`;
          return `${timeString} ${res.level} ${res.label} ${res.message}`;
        }),
      ),
      level: consoleLevel,
    }),
  ];

  if (lokiEnabled) {
    transports.push(
      // sending the logs to Loki which will be visualized by Grafana
      new LokiTransport({
        format: winston.format.combine(
          winston.format.errors({ stack: true }),
          winston.format.label({
            label: `[${appName}:${component}]`,
          }),
          winston.format.printf((res) => `${res.level} ${res.label} ${res.message}`),
        ),
        host: lokiHost,
        labels,
        level: 'debug',
      }),
    );
  }

  logger = winston.createLogger({
    transports,
  });

  // Streaming allows it to stream the logs back from the defined transports
  logger.stream = {
    write(message) {
      logger.info(`request: ${message}`);
    },
  };
  return logger;
}

module.exports = WinstonLokiLogger;
