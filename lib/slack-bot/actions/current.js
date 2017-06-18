'use strict';
const _ = require('lodash');
const settings = require('../../../settings');
const urllibsync = require('urllib-sync');
const urlencode = require('urlencode');
const SPOTIFY_URL = 'https://api.spotify.com/v1/tracks/'
const TOKEN = settings.spotify.token;

function current(bot, channelId, input) {
  return Promise.resolve(bot.player.state).then((response) => {
    let currentTrack = response.currentTrack;
    let nextTrack = response.nextTrack;

    let fmin = ''+Math.floor(currentTrack.duration/60);
    fmin = fmin.length === 2 ? fmin : '0'+fmin;
    let fsec = ''+currentTrack.duration%60;
    fsec = fsec.length === 2 ? fsec : '0'+fsec;

    let pmin = ''+Math.floor(response.elapsedTime/60);
    pmin = pmin.length === 2 ? pmin : '0'+pmin;
    let psec = ''+response.elapsedTime%60;
    psec = psec.length === 2 ? psec : '0'+psec;

    let message = 'Current Track: ' + currentTrack.artist + ' - ' + currentTrack.title;
    let albumArtUrl, mediaType, title, artist, album, platform;

    title = currentTrack.title;
    artist = currentTrack.artist;
    album = currentTrack.album;

    if (currentTrack.type === 'radio') {
      albumArtUrl = currentTrack.absoluteAlbumArtUri;
      let trackString = currentTrack.title,
          trackParts = trackString.split('|');
      title = trackParts[2].replace(/TITLE /, '');
      artist = trackParts[3].replace(/ARTIST /, '');
      album = trackParts[4].replace(/ALBUM /, '');
      platform = `XM: ${currentTrack.stationName}`;
    } else {
      let re = /.*spotify%3atrack%3a(.*)\?.*/i;
      let spotify_id = currentTrack.uri.match(re)[1]
      let getapi = urllibsync.request(SPOTIFY_URL + spotify_id, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      let data = JSON.parse(getapi.data.toString());
      albumArtUrl = data.album.images[1].url
      platform = /spotify/i.test(currentTrack.uri) ? 'Spotify' : 'Unk?';
    }

    let attachments = [
      {
        'fallback': message,
        'color': '#34B6E6',
        'pretext': null,
        'title': 'Current Track:',
        'fields': [
          {
            'title': 'Artist',
            'value': artist,
            'short': true
          }, {
            'title': 'Album',
            'value': album,
            'short': true
          }, {
            'title': 'Title',
            'value': title,
            'short': true
          }, {
            'title': 'Time',
            'value': pmin + ':' + psec + ' / ' + fmin + ':' + fsec,
            'short': true
          }, {
            'title': 'Platform',
            'value': platform,
            'short': false
          }
        ],
        'image_url': albumArtUrl
      }
    ];

    if (nextTrack.title && nextTrack.artist) {
      attachments.push(
        {
          'color': '#FDB92C',
          'pretext': null,
          'title': `Up Next: ${nextTrack.title} by ${nextTrack.artist}`,
        }
      )
    }

    bot.slackWeb.chat.postMessage(
        channelId,
        null,
        {
          username: 'DJ',
          attachments,
          icon_url: 'https://avatars.slack-edge.com/2017-02-28/147222999936_79dc322a5eec81820b63_72.jpg'
        },
        function(err, messageResponse) {
            // TODO check for errors
        }
    );

  }).catch(error => {
    console.log(error);
  })
}

module.exports = function(bot) {
  bot.registerAction('current', current);
  bot.registerHelpData('current', `What's happening on the Jukebox right now?`);
}
