'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const tryDownloadTTS = require('../helpers/try-download-tts');
const singlePlayerAnnouncement = require('../helpers/single-player-announcement');
const settings = require('../../../settings');

let port;
let system;

function say(bot, channelId, values) {
  let text;
  let voice;
  const player = bot.player;
  try {
    voice = /.*\=.*/.test(values[values.length-1]) ? values[values.length-1].split('=')[1] : null;

    if (voice) values.pop();

    text = decodeURIComponent(values.slice(1).join(' '));
  } catch (err) {
    if (err instanceof URIError) {
      err.message = `The encoded phrase ${values[1]} could not be URI decoded. Make sure your url encoded values (%xx) are within valid ranges. xx should be hexadecimal representations`;
    }
    return Promise.reject(err);
  }
  let announceVolume;
  let language;

  return tryDownloadTTS(text, voice)
    .then((path) => {
      console.log(`http://${player.system.localEndpoint}:${port}${path}`);
      return singlePlayerAnnouncement(player, `http://${player.system.localEndpoint}:${port}${path}`, 60);
    });
}

module.exports = function (api) {
  port = api.getPort();
  api.registerAction('say', say);
  api.registerHelpData('say', "Make Sonos say something");
}
