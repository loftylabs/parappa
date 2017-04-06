'use strict';
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const AWS = require('aws-sdk');
const settings = require('../../../settings');

const DEFAULT_SETTINGS = {
  OutputFormat: 'mp3',
  VoiceId: 'Nicole',
  TextType: 'text'
};

function polly(phrase, voiceName) {
  if (!settings.aws) {
    return Promise.resolve();
  }

  let params = {
    'Text': phrase,
    'OutputFormat': 'mp3',
    'VoiceId': voiceName || 'Nicole'
  };

  // Construct a filesystem neutral filename
  const dynamicParameters = { Text: phrase };
  const synthesizeParameters = Object.assign({}, DEFAULT_SETTINGS, dynamicParameters);
  if (settings.aws.name) {
    synthesizeParameters.VoiceId = settings.aws.name;
  }
  if (voiceName) {
    synthesizeParameters.VoiceId = voiceName;
  }

  const phraseHash = crypto.createHash('sha1').update(phrase).digest('hex');
  const filename = `polly-${phraseHash}-${synthesizeParameters.VoiceId}.mp3`;
  const filepath = path.resolve(settings.webroot, 'tts', filename);
  const expectedUri = `/tts/${filename}`;

  try {
    fs.accessSync(filepath, fs.R_OK);
    return Promise.resolve(expectedUri);
  } catch (err) {
    console.log(`POLLY: announce file for phrase "${phrase}" does not seem to exist, downloading`);
  }

  const constructorParameters = Object.assign({ apiVersion: '2016-06-10', signatureVersion: 'v4' }, settings.aws.credentials);

  const polly = new AWS.Polly(constructorParameters);

  return new Promise(function (successCallback, errorCallback) {
    polly.synthesizeSpeech(params, function (err, data) {
      if (err) {
        console.log(err)
      } else if (data) {
         if (data.AudioStream instanceof Buffer) {
             fs.writeFile(filepath, data.AudioStream, function(err) {
                 if (err) {
                     return console.log(err)
                 }
                 successCallback(expectedUri);
             })
         }
      }
    });
  });
}

module.exports = polly;
