require.paths.unshift('vendor/node-oauth/lib');
require.paths.unshift('vendor/connect/lib');
require.paths.unshift('vendor/express/lib');
require.paths.unshift('vendor');
require.paths.unshift('lib');


var express = require('express'),
    connect = require('connect');

var sys= require('sys');
var app = module.exports = express.createServer();
var OAuth2 = require('oauth2').OAuth2;
var MembershipsView = require('views').MembershipsView;

// Configuration

app.configure(function(){
    app.set('view engine', 'mustache');
    app.set('views', __dirname + '/views');
    app.use(connect.bodyDecoder());
    app.use(connect.methodOverride());
    app.use(connect.cookieDecoder());
    app.use(connect.session({secret: 'ibvUViyuctOIUYVyic756ib(GhkbucvUV:n)'}));
    // app.use(express.logger());
    app.use(app.router);
    app.use(connect.staticProvider(__dirname + '/public'));
});

var cobot_base_url, oa;

app.configure('development', function(){
    app.use(connect.errorHandler({ dumpExceptions: true, showStack: true }));
    cobot_base_url = 'http://www.smackaho.st:3000';
    oa = new OAuth2(
      'f95a85a8340ddd60e7090f2c991206ca',
      'f5e651866841331a7b919a8fa36c950040420c3f3d8d1e29da90db7a1fb39c9f',
      cobot_base_url,
      "/oauth2/authorize",
      "/oauth2/access_token");
});

app.configure('production', function(){
   app.use(connect.errorHandler()); 
   cobot_base_url = 'https://www.cobot.me';
   oa = new OAuth2(
     cobot_base_url + "/oauth/access_token",
     process.env.OAUTH2_CLIENT_ID,
     process.env.OAUTH2_CLIENT_SECRET,
     cobot_base_url,
     "/oauth2/authorize",
     "/oauth2/access_token");
});

// Routes

app.get('/', function(req, res){
    res.render('index');
});

app.get('/auth', function(req, res) {
  if(req.query.access_token) {
    req.session.oauth2_access_token = req.query.access_token;
    res.redirect('/user');
  } else {
    var url = oa.getAuthorizeUrl({redirect_uri: 'http://' + req.headers.host + '/oauth', scope: 'read write', response_type: 'code'});
    res.redirect(url);
  }
});

app.get('/oauth', function(req, res) {
  oa.getOAuthAccessToken(req.query.code, {grant_type: 'authorization_code', scope: 'read write', redirect_uri: 'http://' + req.headers.host + '/oauth'}, handle_error(res, function(access_token) {
    req.session.oauth2_access_token = access_token;
    res.redirect('/user');
  }))
  
});

app.get('/user', function(req, res) {
  oa.get(cobot_base_url + "/api/user", req.session.oauth2_access_token, handle_error(res, function(user, response) {
    res.render('user', {locals: {
      login: user.login,
      access_token: req.session.oauth2_access_token
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
  oa.get(space_base_url + "/api/memberships", req.session.oauth2_access_token, handle_error(res, function (memberships, response) {
    oa.get(space_base_url + "/api/work_sessions?from=" + beginning_of_day() + '&to=' + end_of_day(), req.session.oauth2_access_token, handle_error(res, function(work_sessions, response) {
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
  oa.post(space_base_url + '/api/memberships/' + req.params.membership_id + '/work_sessions', req.session.oauth2_access_token, function (error) {
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
