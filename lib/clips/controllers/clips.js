const AWS = require('aws-sdk');
const fs = require('fs');
const settings = require('../../../settings');
const constructorParameters = Object.assign({ apiVersion: '2016-06-10', signatureVersion: 'v4' }, settings.aws.credentials);
const s3 = new AWS.S3(constructorParameters);
const params = {
  Bucket: settings.aws.s3_bucket
};

exports.list = function(req, res) {
  s3.listObjects(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred

    let clips = data.Contents.slice(1).map((obj) => {
      let localParams = Object.assign({ Key: `${obj.Key}` }, params);
      let url = s3.getSignedUrl('getObject', localParams);

      return {
        url: url,
        key: obj.Key,
        name: obj.Key.match(/clips\/(.*).mp3/)[1]
      }
    });

    var template = __dirname + '/../views/index';
    res.render(template, {clips, clipsRoute: true});
  });

};

exports.delete = function(req, res) {
  let keyName = req.params.clipId;
  let localParams = Object.assign({ Key: `clips/${keyName}.mp3` }, params);

  s3.deleteObject(localParams, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response

    res.redirect('/clips');
  });
};

exports.upload = function(req, res) {
  let file = req.files.file;
  let data = fs.readFileSync(file.path);
  let localParams = Object.assign({
    Key: `clips/${file.name}`,
    ACL: 'public-read',
    ContentType: file.type,
    Body: data
  }, params);

  s3.putObject(localParams, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response

    res.redirect('/clips');
  });
};
