'use strict';
const requireDir = require('./helpers/require-dir');
const path = require('path');
const request = require('sonos-discovery/lib/helpers/request');
const logger = require('sonos-discovery/lib/helpers/logger');
const redis = require("redis");
const async = require("async");
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const SKIP_CHANNEL_VALIDATION = true;

var botId = null;

function Parappa(slackObjs, discovery, settings) {
  let {slack, slackWeb} = slackObjs;
  let redisClient = redis.createClient();
  redisClient.keys("zaps:*", function(err, rows) {
		async.each(rows, function(row, callbackDelete) {
			redisClient.del(row, callbackDelete)
		})
	});

  discovery.on('transport-state', (player) => {
    this.player = player;
  });

  const player = discovery.getAnyPlayer();
  const port = settings.port;
  const webroot = settings.webroot;
  this.actions = {};
  this.helpData = {};
  this.slack = slack;
  this.slackWeb = slackWeb;

  this.getWebRoot = function () {
    return webroot;
  };

  this.getPort = function () {
    return port;
  };

  this.registerAction = function (action, handler) {
    this.actions[action] = handler;
  };

  this.registerHelpData = function (action, string) {
    this.helpData[action] = string;
  };

  slack.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
    botId = rtmStartData.self.id;
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
  });

  slack.on('open', function() {
      var channel, channels, group, groups, id, messages, unreads;
      channels = [settings.slack.channel];
      groups = [];
      channels = (function() {
          var _ref, _results;
          _ref = slack.channels;
          _results = [];
          for (id in _ref) {
              channel = _ref[id];
              if (channel.is_member) {
                  _results.push("#" + channel.name);
              }
          }
          return _results;
      })();

      groups = (function() {
          var _ref, _results;
          _ref = slack.groups;
          _results = [];
          for (id in _ref) {
              group = _ref[id];
              if (group.is_open && !group.is_archived) {
                  _results.push(group.name);
              }
          }
          return _results;
      })();

      return console.log("Starting DJ...");
  });

  slack.login();

  slack.on(RTM_EVENTS.MESSAGE, (message) => {
     let channel, channelError, channelName, errors, response, text, textError, ts, type, typeError, user, userName;

      channel = slack.dataStore.getChannelGroupOrDMById(message.channel);
      user = slack.dataStore.getUserById(message.user);
      response = '';
      type = message.type, ts = message.ts, text = message.text;
      channelName = (channel !== null ? channel.is_channel : void 0) ? '#' : '';
      channelName = channelName + (channel ? channel.name : 'UNKNOWN_CHANNEL');
      if (typeof user === 'undefined') {
        userName = "UNKNOWN"
      } else {
        userName = (typeof user !== 'undefined' ? user.name : void 0) !== null ? "@" + user.name : "UNKNOWN_USER";
      }
      console.log("Received: " + type + " " + channelName + " " + userName + " " + ts + " \"" + text + "\"");
      if (type === 'message' && (text !== null) && (channel !== null)) {

        var input = text.split(' ');
        if (input.length > 0) {
          var term = input[0].toLowerCase();
        }

        if(term !== "" && userName !== "UNKNOWN_USER" && (channel.name === settings.slack.channel || SKIP_CHANNEL_VALIDATION)) {
          try {
            if(this.actions[term]) {
              console.log("Processing Action:", term);

              this.actions[term](this, channel.id, input, user)
            }
          }
          catch (e) {
            console.log(e);
          }

        }

      } else {
          typeError = type !== 'message' ? "unexpected type " + type + "." : null;
          textError = text === null ? 'text was undefined.' : null;
          channelError = channel === null ? 'channel was undefined.' : null;
          errors = [typeError, textError, channelError].filter(function(element) {
              return element !== null;
          }).join(' ');
          return console.log("Could not respond. " + errors);
    }
  });

  requireDir(path.join(__dirname, './actions'), (registerAction) => {
    registerAction(this);
  });
}

module.exports = Parappa;
