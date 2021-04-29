const Framework = require('webex-node-bot-framework');
const webhook = require('webex-node-bot-framework/webhook');
const debug = require('debug')('space-ranger:app');
const dotenv = require('dotenv');
const express = require('express');

let config;
// Load Config
try {
  // Try Load from ENV
  if (process.env.TOKEN) {
    debug('Load from ENV');
  } else {
    debug('Load from .env');
    dotenv.config();
  }
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
    debug(`Guide Mode Enabled: ${config.guideEmails}`);
  }
} catch (error) {
  debug(`Error: ${error}`);
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
  debug('Framework initialized successfully! [Press CTRL-C to quit]');
});

// Perform Room Sync against assigned Org
function syncRoom(bot) {
  debug('execute syncRoom');
  // Pull Room Memberships
  bot.framework.webex.memberships
    .list({ roomId: bot.room.id })
    .then((memberships) => {
      // Count Space Organizations
      const orgEntries = memberships.items
        .map((value) => value.personOrgId)
        .filter((value, index, _arr) => _arr.indexOf(value) === index);
      debug(`Org Space Count: ${orgEntries.length}`);

      // Review users if more than one Org identified
      if (orgEntries.length > 1) {
        memberships.items.forEach((item) => {
          if (item.personOrgId !== bot.person.orgId) {
            if (item.personId === bot.person.id) {
              debug('Skipping bot from removal');
              return;
            }
            debug(`Attempting to remove ${item.personEmail} from the space`);
            bot.remove(item.personEmail)
            // bot.framework.webex.memberships
            //  .remove(item)
              .then(() => {
                bot.say(
                  `${item.personDisplayName} has been removed from this space as they are from a different Organization`,
                );
                debug(`${item.personEmail} removed!`);
              })
              .catch((error) => {
                debug(`unable to remove! ${error}`);
                bot.say(
                  `I'm sorry, something went wrong when trying to remove ${item.personDisplayName}. Please mention me to try again`,
                );
              });
          }
        });
      }
    });
}

// Handle Spawn Event
framework.on('spawn', (bot, _id, addedBy) => {
  if (!addedBy) {
    // don't say anything here or your bots spaces will get
    // spammed every time your server is restarted
    debug(`Execute spawn in existing space called: ${bot.room.title}`);
  } else {
    debug('new room');
    // addedBy is the ID of the user who just added our bot to a new space,
    if (bot.room.type === 'group') {
      // Check for Moderation Status
      if (bot.isLocked && !bot.isModerator) {
        bot.say(
          `<@personId:${addedBy}>, Please make me a moderator so I can function correctly.`,
        );
      } else {
        syncRoom(bot);
      }
    } else {
      bot.say('To Infinity and Beyond!');
    }
  }
});

// Event when room is set to Moderated
framework.on('roomLocked', (bot) => {
  debug('trigger roomLocked');
  // Check for Moderation Status
  if (bot.isLocked && !bot.isModerator) {
    debug('Bot is not moderator in moderated room');
    bot.say('Please make me a moderator so I can function correctly.');
  }
});

framework.on('botAddedAsModerator', (bot) => {
  debug('trigger botModAdd');
  // Execute Sync Room
  bot.say('Reviewing Space report now...');
  syncRoom(bot);
});

framework.on('botRemovedAsModerator', (bot) => {
  debug('trigger botModRem');
  // If room is still moderated, prompt.
  if (bot.isLocked) {
    bot.say('Please make me a moderator so I can function correctly.');
  }
});

// Evaluate Sync based on Mention
framework.hears(/.*/gim, (bot, trigger) => {
  debug('trigger hears');
  if (bot.room.type === 'group') {
    bot.say(`<@personId:${trigger.person.id}>, reviewing Space report now...`);
    // Check for Moderation Status
    if (bot.isLocked && !bot.isModerator) {
      bot.say(
        `<@personId:${trigger.person.id}>, Please make me a moderator so I can function correctly.`,
      );
    } else {
      syncRoom(bot);
    }
  } else {
    bot.say(`Hello ${trigger.person.displayName}!`);
  }
});

framework.on('memberEnters', (bot, trigger) => {
  debug('trigger memberEnters');
  // Check for Moderation Status
  if (bot.isLocked && !bot.isModerator) {
    debug('Bot is not moderator in moderated room');
    bot.say(
      "I'm sorry, I cannot function yet as I am not a moderator in this room.",
    );
  } else {
    if (trigger.personId === bot.id) {
      debug('bot added to room, attempting sync');
      syncRoom(bot);
    }

    // Check if new member is from correct Org
    if (trigger.personOrgId !== bot.person.orgId) {
      debug(`Attempting to remove ${trigger.personEmail} from the space`);
      bot.remove(trigger.personEmail)
      // bot.framework.webex.memberships
      //  .remove(trigger)
        .then(() => {
          bot.say(
            `${trigger.personDisplayName} has been removed from this space as they are from a different Organization`,
          );
          debug(`${trigger.personEmail} removed!`);
        })
        .catch((error) => {
          debug(`unable to remove! ${error}`);
          bot.say(
            `I'm sorry, something went wrong when trying to remove ${trigger.personDisplayName}. Please mention me to try again`,
          );
        });
    }
  }
});

let server;
// Init Server, if configured
if (config.webhookUrl) {
  // Define Express Path for Incoming Webhooks
  app.post('/framework', webhook(framework));

  // Start Express Server
  server = app.listen(config.port, () => {
    debug(`Framework listening on port ${config.port}`);
  });
}

// Gracefully Shutdown (CTRL+C)
process.on('SIGINT', () => {
  debug('Stopping...');
  if (config.webhookUrl) {
    server.close();
  }
  framework.stop().then(() => {
    process.exit();
  });
});
