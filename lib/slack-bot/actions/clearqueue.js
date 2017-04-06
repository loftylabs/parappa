'use strict';

function clearqueue(player) {
  return player.coordinator.clearQueue();
}

module.exports = function (bot) {
  bot.registerAction('clearqueue', clearqueue);
  bot.registerHelpData('clearqueue', "Clear the queue.");
};
