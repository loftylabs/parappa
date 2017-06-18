const SonosSystem = require('sonos-discovery');
const settings = require('./../../../settings');
const discovery = new SonosSystem(settings);
const _ = require('lodash');
const urllibsync = require('urllib-sync');
const urlencode = require('urlencode');
const TOKEN = settings.spotify.token;

exports.parappa = function(req, res) {
  const player = discovery.getAnyPlayer();
  const template = __dirname + '/../views/parappa';

  if (player && player.state) {
    Promise.resolve(player.state).then((response) => {
      let currentTrack = response.currentTrack;
      if (currentTrack.title.length > 0 && response.playbackState == 'PLAYING') {
        let currentArtist = currentTrack.artist;
        let re = /.*spotify%3atrack%3a(.*)\?.*/i;
        let spotify_id = currentTrack.uri.match(re) ? currentTrack.uri.match(re)[1] : null;
        if (spotify_id) {
          const SPOTIFY_URL = "https://api.spotify.com/v1/tracks/"
          let getapi = urllibsync.request(SPOTIFY_URL + spotify_id, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${TOKEN}`
            }
          });
          let data = JSON.parse(getapi.data.toString());

          res.render(template, {
            currentArtist: currentArtist,
            currentTrack: currentTrack.title,
            albumArt: data.album.images[1].url,
            homeRoute: true
          });
        }
      } else {
        res.render(template, {
          notPlaying: true,
          homeRoute: true
        });
      }

    }, (err) => {
      console.log(err);
    });
  } else {
    res.render(template, {
      error: `Can't connect to Sonos`,
      homeRoute: true
    });
  }
};
