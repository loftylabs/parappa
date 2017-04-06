'use strict';
const _ = require('lodash');

function list(bot, channelId, values) {
  const detailed = values[0] === 'detailed';
  const slackWeb = bot.slackWeb;
  const promise = bot.player.coordinator.getQueue();

  promise.then((result) => {
    let currentTrackNumber = bot.player.state.trackNo;

    var counter = 0;
    var items = [];
    let current = result[currentTrackNumber-1];
    result.forEach(function(item, i) {
      item.trackNo = i+1;
    });

    result.slice(currentTrackNumber).forEach(function(item, i) {
      if (counter >= 10) {
        return;
      } else {
        counter += 1;
        items.push(`${item.trackNo}: ${item.title} _by_ *${item.artist}*\n`);
      }
    });

    var attachments = [
      {
        "color": "#FDB92C",
        "pretext": null,
        "text": `*Current Song:* ${current.title} _by_ *${current.artist}*`,
        "mrkdwn_in": ["text"]
      },
      {
          "color": "#34B6E6",
          "pretext": null,
          "title": "Next 10 Songs:",
          "fields": [
              {
                  "value": items.join("\n")
              }
          ],
          "mrkdwn_in": ["fields"]
      },
      {
        "color": "#FDB92C",
        "pretext": null,
        "title": `There are ${result.length} songs in the queue.`,
      }
    ];

    slackWeb.chat.postMessage(
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
  });
}

module.exports = function(bot) {
  bot.registerAction('list', list);
  bot.registerAction('ls', list);
  bot.registerAction('queue', list);
  bot.registerHelpData('list/ls/queue', "Show the current playlist.");
}
