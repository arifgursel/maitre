require.paths.unshift('vendor/node-oauth/lib');
require.paths.unshift('vendor/connect/lib');
require.paths.unshift('vendor/express/lib');
require.paths.unshift('vendor');


var express = require('express'),
    connect = require('connect');

var sys= require('sys');
var app = module.exports = express.createServer();
var OAuth= require('oauth').OAuth;

// Configuration

app.configure(function(){
    app.set('view engine', 'mustache');
    app.set('views', __dirname + '/views');
    app.use(connect.bodyDecoder());
    app.use(connect.methodOverride());
    app.use(connect.cookieDecoder());
    app.use(connect.session({secret: 'ibvUViyuctOIUYVyic756ib(GhkbucvUV:n)'}));
    app.use(app.router);
    app.use(connect.staticProvider(__dirname + '/public'));
});

var cobot_base_url;

app.configure('development', function(){
    app.use(connect.errorHandler({ dumpExceptions: true, showStack: true })); 
    cobot_base_url = 'http://www.smackaho.st:3000';
});

app.configure('production', function(){
   app.use(connect.errorHandler()); 
   cobot_base_url = 'https://www.cobot.me';
});

var oa= new OAuth(cobot_base_url + "/oauth/request_token",
                  cobot_base_url + "/oauth/access_token",
                  "T9NO0aQIgkD81XkeR8Ag",
                  "Cz4ImF6Y1GRgenom1Jyarmb3lIzlgo2kCBQhWaEp",
                  "1.0",
                  'http://localhost:3001/oauth',
                  "HMAC-SHA1");

// Routes

app.get('/', function(req, res){
    res.render('index');
});

app.get('/auth', function(req, res) {
  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
    if(error) {
      res.send('error :' + sys.inspect(error), 500);
    } else {
      req.session.oauth_token = oauth_token;
      req.session.oauth_token_secret = oauth_token_secret;
      res.redirect(cobot_base_url + '/oauth/authorize?oauth_token=' + oauth_token);
    }
  });
});

app.get('/oauth', function(req, res) {
  oa.getOAuthAccessToken(req.session.oauth_token, req.session.oauth_token_secret, req.query.oauth_verifier, function(error, oauth_access_token, oauth_access_token_secret, results2) {
    if(error) {
      res.send('error :' + sys.inspect(error), 500);
    }  else {
      req.session.oauth_access_token = oauth_access_token;
      req.session.oauth_access_token_secret = oauth_access_token_secret;
      res.redirect('/user');
    }
  });
});

app.get('/user', function(req, res) {
  oa.getProtectedResource(cobot_base_url + "/api/user", "GET", req.session.oauth_access_token, req.session.oauth_access_token_secret,  function (error, data, response) {
    if(error) {
      res.send('error :' + sys.inspect(error), 500);
    } else {
      res.send(data, 200);
    }
  });
  
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(parseInt(process.env.PORT || 3001, 10));
}
