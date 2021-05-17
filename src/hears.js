const debug = require('debug')('space-ranger:hears');
const { syncRoom } = require('./functions.js');

module.exports = (framework) => {
  // Evaluate Sync based on Mention
  framework.hears(/.*/gim, (bot, trigger) => {
    debug('trigger hears');
    if (bot.room.type === 'group') {
      bot.say(
        `<@personId:${trigger.person.id}>, reviewing Space membership now...`,
      );
      // Check for Moderation Status
      if (bot.room.isLocked && !bot.isModerator) {
        bot.say(
          `<@personId:${trigger.person.id}>, Please make me a moderator so I can function correctly.`,
        );
      } else {
        syncRoom(framework, bot);
      }
    } else {
      bot.say(`Hello ${trigger.person.displayName}!`);
    }
  });
};
