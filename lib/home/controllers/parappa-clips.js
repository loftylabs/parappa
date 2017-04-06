var exports = module.exports;
const SonosSystem = require('sonos-discovery');
const settings = require('./../../../settings');
const discovery = new SonosSystem(settings);
const _ = require('lodash');
var urllibsync = require('urllib-sync');
var urlencode = require('urlencode');

exports.parappa = function(req, res) {
  const player = discovery.getAnyPlayer();
  const template = __dirname + '/../views/parappa';

  if (player && player.state) {
    Promise.resolve(player.state).then((response) => {
      let currentTrack = response.currentTrack;
      let currentArtist = currentTrack.artist;
      var re = /.*spotify%3atrack%3a(.*)\?.*/i;
      var spotify_id = currentTrack.uri.match(re)[1]

      const SPOTIFY_URL = "https://api.spotify.com/v1/tracks/"
      var getapi = urllibsync.request(SPOTIFY_URL + spotify_id);
      var data = JSON.parse(getapi.data.toString());

      res.render(template, {
        currentArtist: currentArtist,
        currentTrack: currentTrack.title,
        albumArt: data.album.images[1].url,
        homeRoute: true
      });

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
