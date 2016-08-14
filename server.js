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

app.use(express.static('' + __dirname + '/files'));
app.set('views',[''+__dirname + '/files/html', ''+__dirname + '/files/html/botView/']);
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/favicon.ico', express.static('./files/img/favicon.ico'));
app.set('json spaces', 2);

client.flushdb( function (err, succeeded) {
    var fd = {name : 'Dev'};
    client.hset('customer:', 'admin', JSON.stringify(fd), function (err, customerData) {
        if(err) console.error(err);
        fd = {name : 'Mark', status : 0, customer : 'dev', login : 'mark', password : 'q'};
        client.hset('customer:admin:users:', '1', JSON.stringify(fd), function (err, userData) {
            if(err) console.error(err);
            fd = {name : 'Edo', status : 0, customer : 'dev', login : 'edo', password : 'q'};
            client.hset('customer:admin:users:', '2', JSON.stringify(fd), function (err, userData) {
                if(err) console.log(err);
                fd = {fname : 'Abul', lname : 'Azizyan', dt : '15:37 11.11.2015'};
                client.hset('customer:admin:clients:', '1', JSON.stringify(fd), function (err, userData) {
                    if(err) console.log(err);
                    require('./middleware/routes.js')(app, client);
                });
            });
        });
    });
});



var server = app.listen(port || 999, function() {
    console.log("listening on " + port);
});
