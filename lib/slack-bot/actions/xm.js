'use strict';
const request = require('request-promise');
const Fuse = require('fuse.js');
const channels = require('../sirius-channels.json');
const _ = require('lodash');

var accountId = '';

function getSiriusXmMetadata(id, parent, title, auth) {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
        xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
        <item id="00092120r%3a${id}" parentID="${parent}" restricted="true"><dc:title>${title}</dc:title><upnp:class>object.item.audioItem.audioBroadcast</upnp:class>
        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON9479_${auth}</desc></item></DIDL-Lite>`;
}

function getSiriusXmUri(id) {
  return `x-sonosapi-hls:r%3a${id}?sid=37&flags=8480&sn=11`;
}

const replaceArray = ['ñ|n','á|a','ó|o','è|e','ë|e','/| ','-| ','siriusxm|sirius XM','sxm|SXM','cnn|CNN','hln|HLN','msnbc|MSNBC','bbc|BBC',
                    'ici|ICI','prx|PRX','cbc|CBC','npr|NPR','espn|ESPN',' ny| NY','kiis|KIIS','&|and','ami|AMI','z1|Z1','2k|2K','bb |BB '];

function adjustStation(name) {
  name = name.toLowerCase();
  for (var i=0;i < replaceArray.length;i++)
    name = name.replace(replaceArray[i].split('|')[0],replaceArray[i].split('|')[1]);

  return name;
}

function getAccountId(player)
{
  accountId = '';

  return request({url: player.baseUrl + '/status/accounts',json: false})
    .then((res) => {
      var actLoc = res.indexOf('Account Type="9479"');

      if (actLoc !== -1) {
        var idLoc = res.indexOf('<UN>', actLoc)+4;

        accountId = res.substring(idLoc,res.indexOf('</UN>',idLoc));
      }

      return Promise.resolve();
    });
}

function siriusXM(bot, channelId, values, user) {
  let player = bot.player;
  var auth = '';
  var results = [];

  // Used to generate channel data for the channels array. Results are sent to the console after loading Sonos Favorites with a number of SiriusXM Channels
  if (values[1] === 'data') {
    return player.system.getFavorites()
    .then((favorites) => {
      return favorites.reduce(function(promise, item) {
        if (item.uri.startsWith('x-sonosapi-hls:')) {
          var title = item.title.replace("'",'');

          console.log("{fullTitle:'" + title +
                      "', channelNum:'" + title.substring(0,title.search(' - ')) +
                      "', title:'" + title.substring(title.search(' - ')+3,title.length) +
                      "', id:'" + item.uri.substring(item.uri.search('r%3a') + 4,item.uri.search('sid=')-1) +
                      "', parentID:'" + item.metadata.substring(item.metadata.search('parentID=') + 10,item.metadata.search(' restricted')-1) + "'},");
        }
        return promise;
      }, Promise.resolve("success"));
    });
  } else
  // Used to send a list of channel numbers specified below in channels for input into an Alexa slot
  if (values[1] === 'channels') {
    var cList = channels.map(function(channel) {
      return channel.channelNum;
    });
    cList.sort(function(a,b) {return a-b;}).map(function(channel) {
      console.log(channel);
    });

    return Promise.resolve("success");
  } else
  // Used to send a list of station titles specified below in channels for input into an Alexa slot
  if (values[1] === 'stations') {
    let filtered = false;
    let sList = channels.map(function(channel){
      return channel.fullTitle;
    }).sort(function(a,b) { return a.split(' ')[0] - b.split(' ')[0] });
    let totalCount = sList.length;

    if (values[2]) {
      console.log(`Pre-filtered Count: ${sList.length}`);
      let testValue = values[2];
      let re = new RegExp(testValue, 'ig');
      sList = _.filter(sList, (o) => { return re.test(o); });
      console.log(`Filtered Count: ${sList.length}`);
      filtered = true;
    }

    let messages = ['*XM Stations*:'];

    if (filtered) {
      messages.push(`(Filtered by \`${values[2]}\` -- showing ${sList.length} of ${totalCount})`)
    }

    messages = _.union(messages, sList);

    bot.slack.sendMessage(`${messages.join("\n")}`, channelId);
    return Promise.resolve("success");
  } else {
  // Play the specified SiriusXM channel or station

    return getAccountId(player)
    .then(() => {
      if (accountId !== '') {
        var searchVal = values.slice(1).join(' ');
        var fuzzy = new Fuse(channels, { keys: ["channelNum", "title"] });

        results = fuzzy.search(searchVal);
        if (results.length > 0) {
          const channel = results[0];
          const uri = getSiriusXmUri(channel.id);
          const metadata = getSiriusXmMetadata(channel.id, channel.parentID, channel.fullTitle, accountId);

          return player.coordinator.setAVTransport(uri, metadata)
            .then(() => player.coordinator.play());
        }
      }
    });
  }
}

module.exports = function (api) {
  api.registerAction('xm', siriusXM);
  api.registerHelpData('xm stations', "List XM Station");
  api.registerHelpData('xm <station name>', "Play XM Station");
};
