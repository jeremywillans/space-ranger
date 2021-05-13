const debug = require('debug')('space-ranger:events');
const { removeUser } = require('./functions.js');
const utils = require('./functions.js');

module.exports = (framework) => {
  // Room Locked Event
  framework.on('roomLocked', (bot) => {
    debug('trigger roomLocked');
    // Check for Moderation Status
    if (bot.isLocked && !bot.isModerator) {
      debug('Bot is not moderator in moderated room');
      bot.say('Please make me a moderator so I can function correctly.');
    }
  });

  // Bot Added Moderator Event
  framework.on('botAddedAsModerator', (bot) => {
    debug('trigger botModAdd');
    // Execute Sync Room
    bot.say('Reviewing Space report now...');
    utils.syncRoom(bot);
  });

  // Bot Removed Moderator Event
  framework.on('botRemovedAsModerator', (bot) => {
    debug('trigger botModRem');
    // If room is still moderated, prompt.
    if (bot.isLocked) {
      bot.say('Please make me a moderator so I can function correctly.');
    }
  });

  // Member Enters Event
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
        utils.syncRoom(bot);
      }

      // Check if new member is from correct Org
      if (trigger.personOrgId !== bot.person.orgId) {
        debug(`Attempting to remove ${trigger.personEmail} from the space`);
        removeUser(bot, trigger);
      }
    }
  });
};
