const debug = require('debug')('space-ranger:hears');
const { syncRoom } = require('./functions');

module.exports = (framework) => {
  // Evaluate Sync based on Mention
  framework.hears(/.*/gim, (bot, trigger) => {
    debug('trigger hears');
    if (bot.room.type === 'group') {
      const command = trigger.args[1];
      switch (true) {
        case /(hello|help)/i.test(command):
          bot.reply(trigger.id, `<@personId:${trigger.person.id}>, I will patrol space membership in this quadrant and keep it free from our enemies lead by Evil Emperor Zurg! (aka other org members)  \n - @mention me with \`refresh\` to perform an on-demand space membership patrol  \n - Support can be obtained by joining this [space](https://eurl.io/#3cWKgIWXV)`);
          break;
        case /support/i.test(command):
          bot.reply(trigger.id, `<@personId:${trigger.person.id}>, Please join this [space](https://eurl.io/#3cWKgIWXV) for support!`);
          break;
        default:
          // Check for Moderation Status
          if (bot.room.isLocked && !bot.isModerator) {
            bot.reply(trigger.id, `<@personId:${trigger.person.id}>, Please make me a moderator so I can function correctly.`);
          } else {
            bot.reply(trigger.id, `<@personId:${trigger.person.id}>, performing Space membership patrol..`);
            syncRoom(framework, bot, trigger.id);
          }
      }
    } else {
      bot.say(`Hello ${trigger.person.displayName}!`);
    }
  });
};
