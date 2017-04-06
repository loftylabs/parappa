'use strict';
const http = require('http');
const fs = require('fs');
const SonosSystem = require('sonos-discovery');
const logger = require('sonos-discovery/lib/helpers/logger');
const Parappa = require('./lib/slack-bot/index.js');
const nodeStatic = require('node-static');
const settings = require('./settings');
const fileServer = new nodeStatic.Server(settings.webroot);
const discovery = new SonosSystem(settings);
const RtmClient = require('@slack/client').RtmClient;
const MemoryDataStore = require('@slack/client').MemoryDataStore;
const WebClient = require('@slack/client').WebClient;

require('app-module-path').addPath(__dirname + '/lib');

var server = require('nodebootstrap-server')
  , appConfig = require('./appConfig')
  , app    = require('express')();

app = require('nodebootstrap-htmlapp').setup(app);
server.setup(app, appConfig.setup);

const slack = new RtmClient(settings.slack.token, {
  logLevel: 'error',
  dataStore: new MemoryDataStore(),
  autoReconnect: true,
  autoMark: true
});

const slackWeb = new WebClient(settings.slack.token);
const bot = new Parappa({slack, slackWeb}, discovery, settings);
