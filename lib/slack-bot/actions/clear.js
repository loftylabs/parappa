'use strict';

function clearqueue(bot) {
  return bot.player.coordinator.clearQueue();
}

module.exports = function (api) {
  api.registerAction('clear', clearqueue);
  api.registerHelpData('clear', "Clear the current queue");
};
