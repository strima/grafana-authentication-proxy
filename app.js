/**
 * Hosts the latest grafana and elasticsearch behind Google OAuth2 Authentication
 * with nodejs and express.
 * License: MIT
 * Copyright: Funplus Game Inc.
 * Author: strima
 * Original Author: Fang Li.
 * Project: https://github.com/strima/grafana-authentication-proxy
 */

var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');

var config = require('./config');
var app = express();

app.use(express.logger());

console.log('Server starting...');

if (!config.base_path) {
	config.base_path="";
	console.log("No base_path specified in config so using /");
}

app.use(express.cookieParser());
app.use(express.session({ secret: config.cookie_secret }));

// Authentication
function readAndInitBasicAuthFile() {
    config.basic_auth_users=new Array();
    var basic_auth_users=fs.readFileSync(config.basic_auth_file,'utf8');
    var userpass=basic_auth_users.split('\n');
    for (var userpass_index in userpass) {
        var uspa=userpass[userpass_index].match(/^([^:]+):(.+)/);
        if (uspa) {
            config.basic_auth_users[config.basic_auth_users.length]={"user": uspa[1], "password": uspa[2]};
        }
    }
}
if (config.enable_basic_auth && config.basic_auth_file && fs.existsSync(config.basic_auth_file)) {
    console.log('basic_auth_file defined and found, so reading it ...');
    readAndInitBasicAuthFile();
    fs.watchFile(config.basic_auth_file, { persistent: true, interval: 5007 }, function(curr,prev) {
        if (curr.mtime.getTime() != prev.mtime.getTime()) {
            console.log('BASIC AUTH File was changed, so reloading values');
            readAndInitBasicAuthFile();
        }
    });
}

require('./lib/basic-auth').configureBasic(express, app, config);
require('./lib/google-oauth').configureOAuth(express, app, config);
require('./lib/cas-auth.js').configureCas(express, app, config);

// Setup ES proxy
require('./lib/es-proxy').configureESProxy(app, config.es_host, config.es_port,
          config.es_username, config.es_password, config.base_path);

// Setup Graphite proxy
require('./lib/gr-proxy').configureGRProxy(app, config.gr_host, config.gr_port,
          config.gr_username, config.gr_password, config.base_path);

// Serve config.js for grafana
// We should use special config.js for the frontend and point the ES to __es/
app.get(config.base_path + '/config.js', grafanaconfigjs);

// Serve all grafana frontend files
app.use(express.compress());
app.use(config.base_path + '/', express.static(__dirname + '/grafana/src', {maxAge: config.brower_cache_maxage || 0}));


run();

function run() {
  if (config.enable_ssl_port === true) {
    var options = {
      key: fs.readFileSync(config.ssl_key_file),
      cert: fs.readFileSync(config.ssl_cert_file),
    };
    https.createServer(options, app).listen(config.listen_port_ssl);
    console.log('Server listening on ' + config.listen_port_ssl + '(SSL)');
  }
  http.createServer(app).listen(config.listen_port);
  console.log('Server listening on ' + config.listen_port);
}

function grafanaconfigjs(req, res) {
  var graphiteUrl = config.graphiteUrl;
  function getGrafanaIndex() {
    var raw_index = config.grafana_es_index;
    var user_type = config.which_auth_type_for_grafana_index;
    var user;
    if (raw_index.indexOf('%user%') > -1) {
      if (user_type === 'google') {
        user = req.googleOauth.id;
      } else if (user_type === 'basic') {
        user = req.user;
      } else if (user_type === 'cas') {
        user = req.session.cas_user_name;
      } else {
        user = 'unknown';
      }
      return raw_index.replace(/%user%/gi, user);
    } else {
      return raw_index;
    }
  }

  res.setHeader('Content-Type', 'application/javascript');
  res.end("define(['settings'], " +
    "function (Settings) {'use strict'; return new Settings({"+
	"datasources: {"+
      		"graphite_api: {"+
        	"type: 'graphite',"+
       		"url: '"+ config.base_path + "/__gr', "+
        	"default: true"+
      		"},"+
                "grafanadashboards: {"+
                "type: 'influxdb',"+
                "url: 'http://"+ config.influxdb_host + ":8086/db/"+ config.grafanadb_dbname +"', "+
		"username: '"+ config.grafanadb_user +"',"+
		"password: '"+ config.grafanadb_password +"',"+
                "grafanaDB: true"+
		"},"+
        "},"+
	
	//"elasticsearch: '" + config.base_path + "/__es',"+
	"default_route     : '/dashboard/file/default.json'," +
        "grafana_index: '" +
        getGrafanaIndex() +
        "', timezoneOffset: null, panel_names: ['text','graphite'] }); });");
}
