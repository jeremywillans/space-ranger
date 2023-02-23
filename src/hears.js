const logger = require('./logger')('hears');
const { syncRoom } = require('./functions');

module.exports = (framework) => {
  // Evaluate Sync based on Mention
  framework.hears(/.*/gim, (bot, trigger) => {
    logger.debug('trigger hears');
    if (bot.room.type === 'group') {
      let message;
      const command = trigger.message.html.replace(/^.*spark-mention> (.*)<\/p>$/, '$1').split(' ')[0];
      switch (true) {
        case /(hello|help)/i.test(command):
          message = `<@personId:${trigger.person.id}>,\n\nI will patrol space membership in this quadrant and keep it free from our enemies lead by Emperor Zurg! (aka other org members)  \n - @mention me with \`patrol\` to perform an on-demand space membership patrol`;
          if (process.env.SUPPORT_EURL) {
            message += `\n - Support can be obtained by joining this [space](${process.env.SUPPORT_EURL})`;
          }
          bot.reply(trigger.id, message);
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
      return;
    }
    // Match on hello/help inputs
    if (trigger.args[0].match(/(hello|help)/i)) {
      const identifier = trigger.person.displayName;
      let message = `Hello ${identifier}!\n\nI can be used to patrol spaces in this quadrant and keep it free from our enemies lead by Emperor Zurg! (aka other org members)\nPlease add me to a group space to get started.\n\nAvailable Resources: \n - [Source Code](https://github.com/jeremywillans/space-ranger)`;
      if (process.env.SUPPORT_EURL) {
        message += `\n - [Support Space](${process.env.SUPPORT_EURL})`;
      }
      // Send Intro Message
      bot.say(message);
    }
  });
};
