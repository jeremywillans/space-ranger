const debug = require('debug')('space-ranger:functions');

function utils() {
  // Remove User from Room
  function removeUser(bot, person) {
    bot
      .remove(person.personEmail)
      .then(() => {
        bot.say(
          'html',
          `<a href='webexteams://im?email=${person.personEmail}'>${person.personDisplayName}</a> has been removed. (Different Org)`,
        );
        debug(`${person.personEmail} removed!`);
      })
      .catch((error) => {
        debug(`unable to remove! ${error.message}`);
        bot.say(
          'html',
          `I'm sorry, something went wrong when trying to remove <a href='webexteams://im?email=${person.personEmail}'>${person.personDisplayName}</a>. Please mention me to try again`,
        );
      });
  }

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
              removeUser(bot, item);
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
  };
}

module.exports = utils();
