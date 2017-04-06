'use strict';

function services(bot, values) {
  return Promise.resolve(bot.player.system.availableServices);
}

module.exports = (api) => {
  api.registerAction('services', services);
};
