'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const settings = require('../../../settings');
const singlePlayerAnnouncement = require('../helpers/single-player-announcement');

let port;

function mute(bot, channelId, values) {
  bot.slack.sendMessage(`Muting Sonos!`, channelId);
  return bot.player.mute();
}

function unmute(bot, channelId, values) {
  bot.slack.sendMessage(`Unmuting Sonos!`, channelId);
  return bot.player.unMute();
}

module.exports = function (bot) {
  port = bot.getPort();
  bot.registerAction('mute', mute);
  bot.registerHelpData('mute', "Mute the Sonos");

  bot.registerAction('unmute', unmute);
  bot.registerHelpData('unmute', "Unmute the Sonos");
}
