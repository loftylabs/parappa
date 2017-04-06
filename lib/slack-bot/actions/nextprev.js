'use strict';
const _ = require('lodash');
var urllibsync = require('urllib-sync');
var urlencode = require('urlencode');
var redis = require('redis');
const async = require("async");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function resetZaps() {
  let redisClient = redis.createClient();
  redisClient.keys("zaps:*", function(err, rows) {
		async.each(rows, function(row, callbackDelete) {
			redisClient.del(row, callbackDelete)
		})
	});
}

function next(bot) {
  return bot.player.coordinator.nextTrack().then(state => {
    resetZaps();
    return sleep(250).then(() => {
      return bot.actions.current(...arguments);
    });
  });
}

function previous(bot) {
  return bot.player.coordinator.previousTrack().then(() => {
    resetZaps();
    return sleep(250).then(() => {
      return bot.actions.current(...arguments);
    })
  });
}

module.exports = function(bot) {
  bot.registerAction('next', next);
  bot.registerHelpData('next', "Play the next song on the playlist.");

  bot.registerAction('previous', previous);
  bot.registerHelpData('previous', "Play the previous song on the playlist.");
}
