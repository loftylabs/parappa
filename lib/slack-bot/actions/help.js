'use strict';
const _ = require('lodash');

function help(bot, channelId, input) {
  let message = [];

  message.push("Parappa The DJ Help Menu");
  message.push("=======================");
  message.push(_.map(bot.helpData, (val, key) => {
    return `\`${key}\` - ${val}`;
  }));
  message.push("=======================");

  bot.slack.sendMessage(_.flatten(message).join('\n'), channelId);
}

module.exports = function (bot) {
  bot.registerAction('help', help);
  bot.registerHelpData('help', "Display list of available commands.");
}
