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

//var redis = require('redis');
//global.client = redis.createClient();

var redis = require('redis');
global.client = redis.createClient(17305, 'redis-17305.c8.us-east-1-3.ec2.cloud.redislabs.com', {no_ready_check: true});
client.auth('dontfuckwithmyteam', function (err) {
    if (err) throw err;
});

client.on('connect', function() {
    console.log('Connected to Redis');
});

client.on("error", function (err) {console.error("Error " + err);});

app.use(express.static('' + __dirname + '/files'));
app.set('views',[''+__dirname + '/files/html', ''+__dirname + '/files/html/botView/']);
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/favicon.ico', express.static('./files/img/favicon.ico'));
app.set('json spaces', 2);

//client.flushdb( function (err, succeeded) {
//
//});
//var fd = {name : 'Dev'};
//client.hset('customer:', 'admin', JSON.stringify(fd), function (err, customerData) {
//    if(err) console.error(err);
//    fd = {name : 'Mark', status : 0, customer : 'admin', login : 'mark', password : 'q'};
//    client.hset('customer:admin:users:', '1', JSON.stringify(fd), function (err, userData) {
//        if(err) console.error(err);
//        fd = {name : 'Edo', status : 0, customer : 'admin', login : 'edo', password : 'q'};
//        client.hset('customer:admin:users:', '2', JSON.stringify(fd), function (err, userData) {
//            if(err) console.log(err);
//    });
//});
//            fd = {
//                fields : [
//                    {title : 'First Name', field : 'FirstName', type : 'text'},
//                    {title : 'Last Name', field : 'LastName', type : 'text'},
//                    {title : 'Last Visit', field : 'LastVisit', type : 'datetime-local'}
//                ],
//                status : 0,
//                customer : 'admin'
//            };
//            client.hset('customer:admin:clients:', 'schema', JSON.stringify(fd), function (err, userData) {
//                if (err) console.log(err);
//                fd = {FirstName: 'Abul', LastName: 'Azizyan', LastVisit: '15:37 11.11.2015'};
//                client.hset('customer:admin:clients:', '1', JSON.stringify(fd), function (err, userData) {
//                    if (err) console.log(err);
//                    fd = {FirstName: 'Abul', LastName: 'Kosh', LastVisit: '15:37 11.11.2015'};
//                    client.hset('customer:admin:clients:', '2', JSON.stringify(fd), function (err, userData) {
//                        if (err) console.log(err);
//                        fd = {FirstName: 'Karo', LastName: 'Malatia', LastVisit: '15:37 11.11.2015'};
//                        client.hset('customer:admin:clients:', '3', JSON.stringify(fd), function (err, userData) {
//                            if (err) console.log(err);
//                            fd = {FirstName: 'Sash', LastName: 'Gzo', LastVisit: '15:37 11.11.2015'};
//                            client.hset('customer:admin:clients:', '4', JSON.stringify(fd), function (err, userData) {
//                                if (err) console.log(err);
//                                fd = {FirstName: 'Styop', LastName: 'Aloyan', LastVisit: '15:37 11.11.2015'};
//                                client.hset('customer:admin:clients:', '5', JSON.stringify(fd), function (err, userData) {
//                                    if (err) console.log(err);
//                                    require('./middleware/routes.js')(app, client);
//                                });
//                            });
//                        });
//                    });
//                });
//            });
//        });
//    });
//});
require('./middleware/routes.js')(app, client);

var server = app.listen(port || 999, function() {
    console.log("listening on " + port);
});
