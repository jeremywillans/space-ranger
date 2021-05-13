const debug = require('debug')('space-ranger:functions');

function utils() {
  function postDebug(framework, bot, type, person) {
    if (process.env.DEBUG_SPACE) {
      const debugBot = framework.getBotByRoomId(process.env.DEBUG_SPACE);
      if (debugBot) {
        const buff = Buffer.from(bot.room.id, 'base64');
        const base64 = buff.toString('utf-8');
        const roomUid = base64.slice(base64.lastIndexOf('/') + 1);
        let htmlMessage;
        switch (type) {
          case 'bot-add':
            htmlMessage = `I have been added to <a href="webexteams://im?space=${roomUid}">${bot.room.title}</a>`;
            break;
          case 'bot-remove':
            htmlMessage = `I have been removed from <a href="webexteams://im?space=${roomUid}">${bot.room.title}</a>`;
            break;
          case 'user-remove':
            htmlMessage = `Removed ${person.personDisplayName} from <a href="webexteams://im?space=${roomUid}">${bot.room.title}</a>`;
            break;
          case 'user-error':
            htmlMessage = `Unable to removed ${person.personDisplayName} from <a href="webexteams://im?space=${roomUid}">${bot.room.title}</a>`;
            break;
          default:
            htmlMessage = 'Unknown Error';
        }
        debugBot.say('html', htmlMessage);
        debug('debug sent');
      }
    }
  }
  // Remove User from Room
  function removeUser(framework, bot, person) {
    bot
      .remove(person.personEmail)
      .then(() => {
        bot.say(
          'html',
          `<a href='webexteams://im?email=${person.personEmail}'>${person.personDisplayName}</a> has been removed. (Different Org)`,
        );
        debug(`${person.personEmail} removed!`);
        postDebug(framework, bot, 'user-remove', person);
      })
      .catch((error) => {
        debug(`unable to remove! ${error.message}`);
        bot.say(
          'html',
          `I'm sorry, something went wrong when trying to remove <a href='webexteams://im?email=${person.personEmail}'>${person.personDisplayName}</a>. Please mention me to try again`,
        );
        postDebug(framework, bot, 'user-error', person);
      });
  }

  // Perform Room Sync against assigned Org
  function syncRoom(framework, bot) {
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
              removeUser(framework, bot, item);
            }
          });
        }
      })
      .catch((error) => {
        debug(error.message);
      });
  }
  return {
    syncRoom,
    removeUser,
    postDebug,
  };
}

module.exports = utils();
