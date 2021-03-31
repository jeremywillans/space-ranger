const Framework = require('webex-node-bot-framework');
const webhook = require('webex-node-bot-framework/webhook');
const debug = require('debug')('spaceranger:app');
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
  };
  if (process.env.WEBHOOK_URL) {
    config.webhookUrl = process.env.WEBHOOK_URL;
    config.port = process.env.PORT || 3000;
    config.webhookSecret = process.env.SECRET || 'replacemwithasecretstring';
  }
} catch (error) {
  debug(`Error: ${error}`);
}

// init express
const app = express();
app.use(express.json());

// init framework
const framework = new Framework(config);
framework.start();

// An initialized event means your webhooks are all registered and the
// framework has created a bot object for all the spaces your bot is in
framework.on('initialized', () => {
  framework.debug('Framework initialized successfully! [Press CTRL-C to quit]');
  debug('Framework initialized successfully! [Press CTRL-C to quit]');
});

// Check for Bot Moderation Status
function checkModeration(bot, callback) {
  // Is Room Moderated?
  if (!bot.room.isLocked) {
    debug('room is not locked');
    callback(true);
    return;
  }

  bot.framework.webex.memberships
    .list({ roomId: bot.room.id })
    .then((memberships) => {
      // Check if Bot is Moderator
      const botModerator = memberships.items
        .filter((item) => item.isModerator === true)
        .filter((item) => item.personId === bot.person.id);
      if (botModerator.length === 1) {
        debug('checkmod: bot is a moderator');
        callback(true);
      } else {
        // Not a Moderator
        debug('checkmod: bot is not a moderator');
        callback(false);
      }
    });
}

// Perform Room Sync against assigned Org
function syncRoom(bot) {
  debug('execute syncRoom');

  // Pull Room Memberships
  bot.framework.webex.memberships
    .list({ roomId: bot.room.id })
    .then((memberships) => {
      // Count Space Orgs
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
            bot.framework.webex.memberships
              .remove(item)
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

// A spawn event is generated when the framework finds a space with your bot in it
// You can use the bot object to send messages to that space
// The id field is the id of the framework
// If addedBy is set, it means that a user has added your bot to a new space
// Otherwise, this bot was in the space before this server instance started
framework.on('spawn', (bot, id, addedBy) => {
  if (!addedBy) {
    // don't say anything here or your bot's spaces will get
    // spammed every time your server is restarted
    framework.debug(
      `Framework created an object for an existing bot in a space called: ${bot.room.title}`,
    );
  } else {
    debug('new room');
    // addedBy is the ID of the user who just added our bot to a new space,
    if (bot.room.type === 'group') {
      // Check for Moderation Status
      checkModeration(bot, (result) => {
        if (!result) {
          debug('Bot is not moderator in moderated room');
          bot.say({
            markdown: `<@personId:${addedBy}>, Please make me a moderator so I can function correctly.`,
          });
        } else {
          syncRoom(bot);
        }
      });
    } else {
      bot.say('To Infinity and Beyond!');
    }
  }
});

// Event when room is set to Moderated
framework.on('roomLocked', (bot) => {
  debug('trigger roomLocked');

  // Check for Moderation Status
  checkModeration(bot, (result) => {
    if (!result) {
      debug('Bot is not moderator in moderated room');
      bot.say('Please make me a moderator so I can function correctly.');
    }
  });
});

framework.on('memberAddedAsModerator', (bot, membership) => {
  debug('trigger memAddMod');

  // Am I the new Moderator?
  if (bot.person.id === membership.personId) {
    debug('bot added as moderator, running SyncRoom');
    syncRoom(bot);
  }
});

// Event when room is set to Moderated
framework.on('memberRemovedAsModerator', (bot, membership) => {
  debug('trigger memRemMod');

  // Am I no longer a Moderator?
  if (bot.person.id === membership.personId) {
    debug('bot removed as moderator, abort!');
    bot.say(
      'Attention! You have removed me as moderator! Please rectify so I can function correctly.',
    );
  }
});

// Evaulate Sync based on Mention
framework.hears(/.*/gim, (bot, trigger) => {
  debug('trigger hears');

  if (bot.room.type === 'group') {
    bot.say(
      'Hello %s!, reviewing Space report now...',
      trigger.person.displayName,
    );
    // Check for Moderation Status
    checkModeration(bot, (result) => {
      if (!result) {
        debug('Bot is not moderator in moderated room');
        bot.say(
          "I'm sorry, I cannot function yet as I am not a moderator in this room.",
        );
      } else {
        // Execute Sync Room
        syncRoom(bot);
      }
    });
  } else {
    bot.say('Hello %s!', trigger.person.displayName);
  }
});

framework.on('memberEnters', (bot, trigger) => {
  debug('trigger memberEnters');

  // Check for Moderation Status
  checkModeration(bot, (result) => {
    if (!result) {
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
        bot.framework.webex.memberships
          .remove(trigger)
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
});

// define express path for incoming webhooks
app.post('/framework', webhook(framework));

// start express server
const server = app.listen(config.port, () => {
  framework.debug('Framework listening on port %s', config.port);
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', () => {
  framework.debug('stoppping...');
  server.close();
  framework.stop().then(() => {
    process.exit();
  });
});
