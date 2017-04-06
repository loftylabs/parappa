'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const settings = require('../../../settings');
const singlePlayerAnnouncement = require('../helpers/single-player-announcement');
const redis = require("redis");
const async = require("async");

let port;

const backupPresets = {};

let _playBuzzer = function(player) {
  return singlePlayerAnnouncement(player, `https://s3.us-east-2.amazonaws.com/lofty-dj/clips/buzzer.mp3`, 0);
};

function clearZaps(bot, channelId, values, user){
  let redisClient = redis.createClient();
  redisClient.keys("zaps:*", function(err, rows) {
    async.each(rows, function(row, callbackDelete) {
      redisClient.del(row, callbackDelete)
    })
    bot.slack.sendMessage(`Zaps Cleared :partyparrot:`, channelId);
  });
}


function countZaps(bot, channelId, values, user) {
  let client = redis.createClient();

  client.get("zaps:count", function(err, zapCount) {
    if (err) {
      console.log(err);
      return;
    }
    bot.slack.sendMessage(`:zap: This song has ${zapCount || 0} zaps :zap:`, channelId);
    client.quit();
  });
}

function zap(bot, channelId, values, user) {
  let client = redis.createClient();
  const player = bot.player;
  client.get(`zaps:users:${user.id}`, function (err, hasZapped) {
    if (hasZapped) {
      bot.slack.sendMessage(`@${user.name} You can't zap a song twice. :shit:`, channelId);
      return;
    }
    
    bot.slack.sendMessage(`:zap: @${user.name} zapped this song`, channelId);

    if (err) {
      console.log(err);
      return;
    }

    client.get(`zaps:count`, (err, zapCount) => {
      _playBuzzer(bot.player).then(() => {
        let newZaps = parseInt(zapCount || 0) + 1;
        if (newZaps < 3) {
          client.set(`zaps:users:${user.id}`, true);
          client.set(`zaps:count`, newZaps, (err) => {
            bot.slack.sendMessage(`This song has been zapped ${newZaps} times.`, channelId);
            client.quit();
          });
        } else {
          bot.slack.sendMessage(`This song has been zapped ${newZaps} times. Skipping!`, channelId);
          client.keys("zaps:*", function(err, rows) {
            async.each(rows, function(row, callbackDelete) {
              client.del(row, callbackDelete)
            })
          });

          bot.player.coordinator.nextTrack();
        }
      })
    });
  });
}

module.exports = function (bot) {
  port = bot.getPort();
  bot.registerAction('zap', zap);
  bot.registerHelpData('zap', "Zap the current song. Because it sucks.");

  bot.registerAction('zapcount', countZaps);
  bot.registerHelpData('zapcount', "How many zaps does the current song have?");

  bot.registerAction('clearzaps', clearZaps);
  bot.registerHelpData('clearzaps', "Clear active zaps");
}
