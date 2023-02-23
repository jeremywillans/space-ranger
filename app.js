const Framework = require('webex-node-bot-framework');
const webhook = require('webex-node-bot-framework/webhook');
const express = require('express');
const path = require('path');
const { syncRoom, postDebug } = require('./src/functions');
const logger = require('./src/logger')('entrypoint');

let config;
// Load Config
try {
  config = {
    token: process.env.TOKEN,
    // removeDeviceRegistrationsOnStart: true,
    messageFormat: 'markdown',
  };
  if (process.env.WEBHOOK_URL) {
    config.webhookUrl = process.env.WEBHOOK_URL;
    config.port = process.env.PORT || 3000;
    // eslint-disable-next-line operator-linebreak
    config.webhookSecret =
      process.env.SECRET || 'replace-me-with-a-secret-string';
  }
  if (process.env.GUIDE_EMAILS) {
    config.guideEmails = process.env.GUIDE_EMAILS;
    config.membershipRulesDisallowedResponse = '';
    config.membershipRulesStateMessageResponse = '';
    config.membershipRulesAllowedResponse = '';
    logger.info(`Guide Mode Enabled: ${config.guideEmails}`);
  }
} catch (error) {
  logger.error(`Error: ${error}`);
}

let app;
// Init Express, if configured
if (config.webhookUrl) {
  app = express();
  app.use(express.json());
}

// Init Framework
const framework = new Framework(config);
framework.start();

// Framework Initialized
framework.on('initialized', () => {
  logger.info('Framework initialized successfully! [Press CTRL-C to quit]');
});

// Handle Spawn Event
framework.on('spawn', (bot, _id, addedBy) => {
  if (!addedBy) {
    // don't say anything here or your bots spaces will get
    // spammed every time your server is restarted
    logger.debug(`Execute spawn in existing space called: ${bot.room.title}`);
    if (bot.room.type === 'group') {
      syncRoom(framework, bot);
    }
  } else {
    logger.debug('new room');
    // addedBy is the ID of the user who just added our bot to a new space,
    if (bot.room.type === 'group') {
      // Check for Moderation Status
      if (bot.room.isLocked && !bot.isModerator) {
        bot.say(
          `<@personId:${addedBy}>, Please make me a moderator so I can function correctly.`,
        );
      } else {
        syncRoom(framework, bot);
      }
      postDebug(framework, bot, 'bot-add');
    } else {
      bot.say('To Infinity and Beyond!');
    }
  }
});

// Load Components
framework.use(path.join(__dirname, 'src/events.js'));
framework.use(path.join(__dirname, 'src/hears.js'));

let server;
// Init Server, if configured
if (config.webhookUrl) {
  // Define Express Path for Incoming Webhooks
  app.post('/framework', webhook(framework));

  // Start Express Server
  server = app.listen(config.port, () => {
    logger.info(`Framework listening on port ${config.port}`);
  });
}

// Gracefully Shutdown (CTRL+C)
process.on('SIGINT', () => {
  logger.info('Stopping...');
  if (config.webhookUrl) {
    server.close();
  }
  framework.stop().then(() => {
    process.exit();
  });
});
