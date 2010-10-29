require.paths.unshift('vendor/node-oauth/lib');
require.paths.unshift('vendor/connect/lib');
require.paths.unshift('vendor/express/lib');
require.paths.unshift('vendor');
require.paths.unshift('lib');


var express = require('express'),
    connect = require('connect');

var sys= require('sys');
var app = module.exports = express.createServer();
var OAuth= require('oauth').OAuth;
var MembershipsView = require('views').MembershipsView;

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

var cobot_base_url, oa;

app.configure('development', function(){
    app.use(connect.errorHandler({ dumpExceptions: true, showStack: true })); 
    cobot_base_url = 'http://www.smackaho.st:3000';
    oa = new OAuth(cobot_base_url + "/oauth/request_token",
      cobot_base_url + "/oauth/access_token",
      "T9NO0aQIgkD81XkeR8Ag",
      "Cz4ImF6Y1GRgenom1Jyarmb3lIzlgo2kCBQhWaEp",
      "1.0",
      'http://localhost:3005/oauth',
      "HMAC-SHA1");
});

app.configure('production', function(){
   app.use(connect.errorHandler()); 
   cobot_base_url = 'https://www.cobot.me';
   oa = new OAuth(cobot_base_url + "/oauth/request_token",
     cobot_base_url + "/oauth/access_token",
     process.env.OAUTH_CONSUMER_KEY,
     process.env.OAUTH_CONSUMER_SECRET,
     "1.0",
     'http://maitre.heroku.com/oauth',
     "HMAC-SHA1");
});

// Routes

app.get('/', function(req, res){
    res.render('index');
});

app.get('/auth', function(req, res) {
  if(req.query.access_token && req.query.access_secret) {
    req.session.oauth_access_token = req.query.access_token;
    req.session.oauth_access_token_secret = req.query.access_secret;
    res.redirect('/user');
  } else {
    oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
      if(error) {
        res.send('error :' + sys.inspect(error), 500);
      } else {
        req.session.oauth_token = oauth_token;
        req.session.oauth_token_secret = oauth_token_secret;
        res.redirect(cobot_base_url + '/oauth/authorize?oauth_token=' + oauth_token);
      }
    });
  }
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
  oa.getProtectedResource(cobot_base_url + "/api/user", "GET", req.session.oauth_access_token, req.session.oauth_access_token_secret,  handle_error(res, function(user, response) {
    res.render('user', {locals: {
      login: user.login,
      access_token: req.session.oauth_access_token,
      access_secret: req.session.oauth_access_token_secret
    }});
  }));
});

function handle_error(res, callback) {
  return function() {
    var args = Array.prototype.slice.call(arguments); 
    var error = args.shift(); 

    if(!error) {
      callback.apply(null, args);
    } else {
      if(error.statusCode == 401) {
        res.redirect('/');
      } else {
        res.send(error, 500);
      }
    };
  };
}


app.get('/spaces/:subdomain', function(req, res) {
  var space_base_url = cobot_base_url.replace('www', req.params.subdomain);
  oa.getProtectedResource(space_base_url + "/api/memberships", "GET", req.session.oauth_access_token, req.session.oauth_access_token_secret, handle_error(res, function (memberships, response) {
    oa.getProtectedResource(space_base_url + "/api/work_sessions?from=" + beginning_of_day() + '&to=' + end_of_day(), "GET", req.session.oauth_access_token, req.session.oauth_access_token_secret,  handle_error(res, function(work_sessions, response) {
      res.render('memberships', {
        locals: {
          memberships: MembershipsView(JSON.parse(memberships), JSON.parse(work_sessions)),
          subdomain: req.params.subdomain
        }
      });
    }));
  }));
  
  function beginning_of_day() {
    var now = new Date();
    return ISODateString(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
  }
  
  function end_of_day() {
    var now = new Date();
    return ISODateString(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));
  }
  
  function ISODateString(d){
   function pad(n){return n<10 ? '0'+n : n;}
   return d.getUTCFullYear()+'-'
        + pad(d.getUTCMonth()+1)+'-'
        + pad(d.getUTCDate())+'T'
        + pad(d.getUTCHours())+':'
        + pad(d.getUTCMinutes())+':'
        + pad(d.getUTCSeconds())+'Z';}
});

app.post('/:subdomain/:membership_id/check_ins', function(req, res) {
  var space_base_url = cobot_base_url.replace('www', req.params.subdomain);
  oa.getProtectedResource(space_base_url + '/api/memberships/' + req.params.membership_id + '/work_sessions', "POST", req.session.oauth_access_token, req.session.oauth_access_token_secret,  function (error, _1, _2) {
    if(error) {
      res.send('error :' + sys.inspect(error), 500);
    } else {
      res.send(201);
    }
  });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(parseInt(process.env.PORT || 3005, 10));
}
