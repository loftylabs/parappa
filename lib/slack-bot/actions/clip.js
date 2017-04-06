'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const settings = require('../../../settings');
const singlePlayerAnnouncement = require('../helpers/single-player-announcement');
const AWS = require('aws-sdk');

let port;

const backupPresets = {};
const constructorParameters = Object.assign({ apiVersion: '2016-06-10', signatureVersion: 'v4' }, settings.aws.credentials);

function playClip(bot, _, values) {
  const player = bot.player;
  const clipFileName = values[1];
  let announceVolume = settings.announceVolume || 60;

  var params = {
    Bucket: 'lofty-dj',
    Key: `clips/${clipFileName}.mp3`
  };

  let s3 = new AWS.S3(constructorParameters);
  let url = s3.getSignedUrl('getObject', params);
  return singlePlayerAnnouncement(player, `${url}`, announceVolume);
}

function listClips(bot, channelId, values) {
  var params = {
    Bucket: 'lofty-dj',
  };
  
  let s3 = new AWS.S3(constructorParameters);
  s3.listObjects(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred

    let clips = data.Contents.slice(1).map((obj) => {
      return obj.Key.match(/clips\/(.*).mp3/)[1]
    });

    bot.slack.sendMessage(`*Available Clips*:\n${clips.join('\n')}`, channelId);
  });

}

module.exports = function (bot) {
  port = bot.getPort();
  bot.registerAction('clip', playClip);
  bot.registerHelpData('clip', "Play a clip from the soundboard");

  bot.registerAction('listclips', listClips);
  bot.registerAction('clips', listClips);
  bot.registerHelpData('listclips/clips', "List available soundboard clips");
}
