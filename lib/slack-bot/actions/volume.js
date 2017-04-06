'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const settings = require('../../../settings');
const singlePlayerAnnouncement = require('../helpers/single-player-announcement');

let port;

function getVolume(bot, channelId, values) {
  return Promise.resolve(bot.player.state).then((response) => {
    bot.slack.sendMessage(`Volume is currently set to ${response.volume}%`, channelId);
  });
}

function setVolume(bot, channelId, values) {
  var volume = values[1];
  bot.slack.sendMessage(`Setting volume at ${volume}%`, channelId);
  return bot.player.setVolume(volume);
}

module.exports = function (bot) {
  port = bot.getPort();
  bot.registerAction('volume', getVolume);
  bot.registerHelpData('volume', "Display current volume");

  bot.registerAction('setvolume', setVolume);
  bot.registerHelpData('setvolume', "Set current volume");
}
