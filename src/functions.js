const debug = require('debug')('space-ranger:functions');

function utils() {
  function postDebug(framework, bot, type, person) {
    if (process.env.DEBUG_SPACE) {
      const debugBot = framework.getBotByRoomId(process.env.DEBUG_SPACE);
      if (debugBot) {
        const buff = Buffer.from(bot.room.id, 'base64');
        const base64 = buff.toString('utf-8');
        const roomUid = base64.slice(base64.lastIndexOf('/') + 1);
        let messageContent;
        switch (type) {
          case 'bot-add':
            messageContent = `I have been added to [${bot.room.title}](webexteams://im?space=${roomUid})`;
            break;
          case 'bot-remove':
            messageContent = `I have been removed from [${bot.room.title}](webexteams://im?space=${roomUid})`;
            break;
          case 'user-remove':
            messageContent = `Removed \`${person.personDisplayName} (${person.personEmail})\` from [${bot.room.title}](webexteams://im?space=${roomUid})`;
            break;
          case 'user-error':
            messageContent = `Unable to remove \`${person.personDisplayName} (${person.personEmail})\` from [${bot.room.title}](webexteams://im?space=${roomUid})`;
            break;
          default:
            messageContent = 'Unknown Error';
        }
        debugBot.say(messageContent);
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
          `[${person.personDisplayName}](webexteams://im?email=${person.personEmail}) has been removed. (Different Org)`,
        );
        debug(`${person.personEmail} removed!`);
        postDebug(framework, bot, 'user-remove', person);
      })
      .catch((error) => {
        debug(`unable to remove! ${error.message}`);
        bot.say(
          `I'm sorry, something went wrong when trying to remove [${person.personDisplayName}](webexteams://im?email=${person.personEmail}'). Please mention me to try again`,
        );
        postDebug(framework, bot, 'user-error', person);
      });
  }

  // Get More Memberships, if needed
  async function getMore(outputArray, memberships) {
    const result = await memberships.next();
    outputArray.push(result.items);
    if (result.hasNext()) {
      await getMore(outputArray, result);
    }
    return outputArray;
  }

  // Get Memberships
  async function getMemberships(bot) {
    let results = [];
    const memberships = await bot.framework.webex.memberships.list({
      roomId: bot.room.id,
      max: 1000,
    });
    const outputArray = [];
    outputArray.push(memberships.items);
    if (memberships.hasNext()) {
      await getMore(outputArray, memberships);
      outputArray.forEach((item) => {
        results = results.concat(item);
      });
    }
    return results;
  }

  // Perform Room Sync against assigned Org
  async function syncRoom(framework, bot) {
    debug('execute syncRoom');
    try {
      // Pull Room Memberships
      const memberships = await getMemberships(bot);
      // Count Space Organizations
      const orgEntries = memberships
        .map((value) => value.personOrgId)
        .filter((value, index, _arr) => _arr.indexOf(value) === index);
      debug(`Org Space Count: ${orgEntries.length}`);
      // Review users if more than one Org identified
      if (orgEntries.length > 1) {
        memberships.forEach((item) => {
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
    } catch (error) {
      debug(error.message);
    }
  }

  return {
    syncRoom,
    removeUser,
    postDebug,
  };
}

module.exports = utils();
