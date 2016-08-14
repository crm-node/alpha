/**
 * Created by mmalkav on 08.04.2016.
 */

var express = require('express');
var fs = require('fs');
var app = express();
var http = require('http');
var bodyParser = require('body-parser');
global._ = require('underscore');
global.request = require('request');


var port = parseInt(process.env.OPENSHIFT_NODEJS_PORT) || parseInt(process.env.PORT) ||  999;

var redis = require('redis');
global.client = redis.createClient();

client.on('connect', function() {console.log('redis connected');});
client.on("error", function (err) {console.error("Error " + err);});

global.redisOp = require('./middleware/redis-op.js');

app.use(express.static('' + __dirname + '/files'));
app.set('views',[''+__dirname + '/files/html', ''+__dirname + '/files/html/botView/']);
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/favicon.ico', express.static('./files/img/favicon.ico'));
app.set('json spaces', 2);

require('./middleware/routes.js')(app, client);

var server = app.listen(port || 999, function() {
    console.log("listening on " + port);
});
