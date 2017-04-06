'use strict';

function getWebUrl(bot, channelId) {
  var address,
      ifaces = require('os').networkInterfaces();
  for (var dev in ifaces) {
      ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address: undefined);
  }

  bot.slack.sendMessage(`My control panel is located at http://${address}`, channelId);
}

module.exports = function (api) {
  api.registerAction('web', getWebUrl);
  api.registerHelpData('web', "Show the current web app URL");
};
