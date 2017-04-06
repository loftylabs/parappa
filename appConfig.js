require('app-module-path').addPath(__dirname + '/lib');

exports.setup = function(runningApp, callback) {
  runningApp.disable("x-powered-by");
  runningApp.set('view engine', 'handlebars');
  runningApp.engine('handlebars', require('hbs').__express);
  
  runningApp.use('/', require('home'));
  runningApp.use('/clips', require('clips'));
  runningApp.use('/api', require('api'));

  if(typeof callback === 'function') {
    callback(runningApp);
  }
};
