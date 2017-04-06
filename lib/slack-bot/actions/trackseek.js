'use strict';
function timeSeek(bot, channelId, input) {
  return bot.player.coordinator.timeSeek(input[1]);
}

function trackSeek(bot, channelId, input) {
  console.log(input[1]);
  return bot.player.coordinator.trackSeek(input[1]);
}

module.exports = function (api) {
  api.registerAction('timeseek', timeSeek);
  api.registerHelpData('timeseek', "Skip to specific time in song.");

  api.registerAction('trackseek', trackSeek);
  api.registerHelpData('trackseek', "Skip to specific song in queue.");
}
