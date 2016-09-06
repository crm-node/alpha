/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

//var dbRequest = require('./dbRequests');
var redisRequests = require('./redisRequests');
var serverEvents = require('./serverEvents');
var helper = require('./helperFunctions');
var statisticsService = require('./statisticsService');

var async = require("async");
var uuid = require('node-uuid');

function autorizationRequest(authorization, callback) {
    if (authorization == undefined) {
        res.send({error: true, message: 'Authorization token required', error_code: 'auth_1'}).end();
    }
    else {
        redisRequests.getUser(authorization, function (err, userData) {
            if(err || !userData) {
                res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
            }
            else {
                callback(JSON.parse(userData));
            }
        });
    }
}

module.exports = function (app, fs) {

    app.post('/api/login', function (req, res) {
        if (req.headers.authorization != undefined) {
            res.send({error: true, message: 'Already logged in', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.user('', 'devget', {login : req.body.login}, function (err, user) {
                if(err) res.send({error: true, message: 'Login error', error_code: 'auth_1', data : err}).end();
                else {
                    user = JSON.parse(user);
                    if(!user || !user.id) {
                        res.send({error: true, message: 'No such user.', error_code: 'auth_2', data : err}).end();
                    }
                    else {
                        if(user.password != req.body.password) {
                            res.send({error: true, message: 'Invalid username or password.', error_code: 'auth_2', data : err}).end();
                        }
                        else {
                            redisRequests.user(user.customer, 'get', {user_id : user.id}, function (err, userData) {
                                if(err || !userData) {
                                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1', data : err}).end();
                                }
                                else {
                                    redisRequests.setUser(JSON.parse(userData).id, JSON.parse(userData), function (err, resp) {
                                        if(err) res.send({error: true, message: 'Login error', error_code: 'auth_3', data : err}).end();
                                        else {
                                            res.send({error: false, message: 'Success', data: JSON.parse(userData)}).end();
                                        }
                                    });
                                }
                            });
                        }
                    }
                }
            });
        }
    });

    app.post('/api/userInfo', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            res.send({error: false, message: 'Success', data: userData}).end();
        });
    });

    app.post('/api/logout', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            res.send({error: false, message: 'Success', data: null}).end();
        });
    });



    app.post('/api/getCustomers', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.customer(JSON.parse(userData).customer, 'all', {}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/getCustomer', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.customer(userData.customer, 'get', {customer_id: req.body.customer_id}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/editCustomer', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.customer(req.body.customer_id, 'edit', {customer_info: req.body.customer_info}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/addCustomer', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            var formDataCustomer = {name : req.body.customer_info.name, id : "" + uuid.v4(), type : req.body.customer_info.type};
            redisRequests.customer(formDataCustomer.name, 'add', {customer_info : formDataCustomer}, function (err, customers) {
                if(err || !customers) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1', data : err}).end();
                }
                else {
                    console.log(customers)
                    var formDataUser = {customer : formDataCustomer.id, name : req.body.customer_info.username, login : req.body.customer_info.login, password : req.body.customer_info.password, type : "owner", id : "" + uuid.v4(), status : 0};
                    redisRequests.user(formDataCustomer.name, 'add', {user_info : formDataUser}, function(err, resp) {helper.parseResponse(err, resp, res)});
                }
            });
        });
    });

    app.post('/api/delCustomer', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.customer(req.body.customer_id, 'del', {}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });


    app.post('/api/getUsers', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.user(userData.customer, 'all', {}, function (err, users) {
                if(err || !users) {
                    console.error(err);
                }
                else {
                    users = helper.parseEachAndGiveId(users);
                    users = _.filter(users, function(user){ return user.customer  == userData.customer; });
                    var idS = _.pluck(users, "id");
                    _.each(idS, function(item, k){
                        idS[k] = "token:"+item
                    });
                    client.mget(idS, function (err, keys) {
                        _.each(keys, function(key, k){
                            keys[k] = JSON.parse(key);
                        });
                        _.each(users, function(user, keyU){
                            users[keyU].status = _.findWhere(keys, {id: user.id}) ? 1 : 0;
                        });
                        res.send({error: false, message: 'Success', data: users}).end();
                    });
                }
            });
        });
    });

    app.post('/api/getUser', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.user(userData.customer, 'get', {user_id : req.body.user_id}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/editUser', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.user(userData.customer, 'edit', {user_id : req.body.user_id, user_info : req.body.user_info}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/addUser', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.user(userData.customer, 'add', {user_info : req.body.user_info}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/delUser', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.user(userData.customer, 'del', {user_id : req.body.user_id}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });



    app.post('/api/getClients', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.clients(userData.customer, 'all', {}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/getClient', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.clients(userData.customer, 'get', {client_id : req.body.client_id}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/editClient', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.clients(userData.customer, 'edit', {client_id : req.body.client_id, client_info : req.body.client_info}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/addClient', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            if(userData && req.body.client_info) {
                redisRequests.clients(userData.customer, 'add', {client_info : req.body.client_info}, function(err, resp) {helper.parseResponse(err, resp, res)})
            }
            else res.send({error: true, message: 'Clients request error', error_code: 'cli_1'}).end();
        });
    });

    app.post('/api/delClient', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            if(userData && req.body.client_id) {
                redisRequests.clients(userData.customer, 'del', {client_id : req.body.client_id}, function(err, resp) {helper.parseResponse(err, resp, res)})
            }
            else res.send({error: true, message: 'Clients request error', error_code: 'cli_1'}).end();
        });
    });



    app.post('/api/getAllEvents', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.events(userData.customer, 'all', '', {}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/getEvents', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            var date = "" + new Date(req.body.dt).getDate() + "-" + (new Date(req.body.dt).getMonth() + 1) + "-" + new Date(req.body.dt).getFullYear();
            redisRequests.events(userData.customer, 'get', date, {}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/editEvent', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            var event_day = new Date(req.body.event.dt);
            var date = "" + event_day.getDate() + "-" + (event_day.getMonth() + 1) + "-" + event_day.getFullYear();
            if(userData && req.body.event) {
                redisRequests.events(userData.customer, 'get', date, {}, function (err, eventsData) {
                    if(err) {
                        res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                    }
                    else {
                        if(eventsData != null && eventsData != "[]") {eventsData = JSON.parse(eventsData);}
                        else eventsData = [];
                        _.each(eventsData, function(event, key){
                            if(event.id == req.body.event.id) {
                                eventsData[key] = req.body.event;
                            }
                        });
                        redisRequests.events(userData.customer, 'add', date, {date : req.body.event.dt, events : eventsData}, function (err, eventData) {
                            if(err) {
                                res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                            }
                            else {
                                serverEvents.updateUpcomingEventsForCustomer(userData.customer, function(){
                                    res.send({error: false, message: 'Success', data: JSON.parse(eventData)}).end();
                                });
                            }
                        })
                    }
                });
            }
            else res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
        });
    });

    app.post('/api/addEvent', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            var event_day = new Date(req.body.event.dt);
            var date = "" + event_day.getDate() + "-" + (event_day.getMonth() + 1) + "-" + event_day.getFullYear();
            if(userData && req.body.event) {
                redisRequests.events(userData.customer, 'get', date, {}, function (err, eventsData) {
                    if(err) {
                        res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                    }
                    else {
                        if(eventsData != null && eventsData != "[]") {eventsData = JSON.parse(eventsData);}
                        else eventsData = [];
                        req.body.event.id = "" + uuid.v4();
                        eventsData.push(req.body.event);
                        redisRequests.events(userData.customer, 'add', date, {date : req.body.event.dt, events : eventsData}, function (err, eventData) {
                            if(err) {
                                res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                            }
                            else {
                                io.emit('event added' + userData.customer, req.body.event);
                                var _now = new Date();
                                if(_now.getDate() == event_day.getDate() && _now.getMonth() == event_day.getMonth()
                                    && _now.getFullYear() == event_day.getFullYear() && _now < event_day) {
                                    io.emit('upcoming event added' + userData.customer, req.body.event);
                                }
                                serverEvents.updateUpcomingEventsForCustomer(userData.customer, function(){
                                    res.send({error: false, message: 'Success', data: JSON.parse(eventData)}).end();
                                });
                            }
                        })
                    }
                });
            }
            else res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
        });
    });

    app.post('/api/delEvent', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            var event_day = new Date(req.body.event.dt);
            var date = "" + event_day.getDate() + "-" + (event_day.getMonth() + 1) + "-" + event_day.getFullYear();
            if(userData && req.body.event) {
                redisRequests.events(userData.customer, 'get', date, {}, function (err, eventsData) {
                    if(err) {
                        res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                    }
                    else {
                        if(eventsData != null && eventsData != "[]") {eventsData = JSON.parse(eventsData);}
                        else eventsData = [];
                        eventsData = _.filter(eventsData, function(event, key){
                            return event.id != req.body.event.id;
                        });
                        redisRequests.events(userData.customer, 'add', date, {date : req.body.event.dt, events : eventsData}, function (err, eventData) {
                            if(err) {
                                res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                            }
                            else {
                                serverEvents.updateUpcomingEventsForCustomer(userData.customer, function(){
                                    res.send({error: false, message: 'Success', data: JSON.parse(eventData)}).end();
                                });
                            }
                        })
                    }
                });
            }
            else res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
        });
    });

    app.post('/api/delEventsDay', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            var event_day = new Date(req.body.event.dt);
            var date = "" + event_day.getDate() + "-" + (event_day.getMonth() + 1) + "-" + event_day.getFullYear();
            redisRequests.events(userData.customer, 'del', date, {}, function (err, eventData) {
                if(err) {
                    res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                }
                else {
                    serverEvents.updateUpcomingEventsForCustomer(userData.customer, function(){
                        res.send({error: false, message: 'Success', data: JSON.parse(eventData)}).end();
                    });
                }
            });
        });
    });



    app.post('/api/getTransactions', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.transactions(userData.customer, 'all', {}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/clientTransactions', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.transactions(userData.customer, 'all', {}, function (err, transactionsData) {
                if(err || !transactionsData) {
                    res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                }
                else {
                    transactionsData = helper.parseEachAndGiveId(transactionsData);
                    transactionsData = _.filter(transactionsData, function(item){ return item.client && item.client.client_id == req.body.client_id});
                    res.send({error: false, message: 'Success', data: transactionsData}).end();
                }
            });
        });
    });

    app.post('/api/getTransaction', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.transactions(userData.customer, 'get', {transaction_id : req.body.transaction_id}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/editTransaction', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            var event_day = new Date(req.body.transaction_info.dt);
            var date = "" + event_day.getDate() + "-" + (event_day.getMonth() + 1) + "-" + event_day.getFullYear();
            redisRequests.transactions(userData.customer, 'edit', {transaction_id : req.body.transaction_id, transaction_info : req.body.transaction_info}, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });

    app.post('/api/addTransaction', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            if(userData && req.body.transaction_info) {
                req.body.transaction_info.dt = new Date();
                req.body.transaction_info.id = "" + uuid.v4();
                var event_day = new Date(req.body.transaction_info.dt);
                var date = "" + event_day.getDate() + "-" + (event_day.getMonth() + 1) + "-" + event_day.getFullYear();
                redisRequests.transactions(userData.customer, 'add', {transaction_info : req.body.transaction_info}, function (err, customersData) {
                    if(err) {
                        res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                    }
                    else {
                        client.hget('customer:' + userData.customer + ':transactions:'  ,  "" + date, function(err, transactions){
                            if( typeof transactions == 'string' && transactions.indexOf("null") > -1) transactions = [];
                            if(transactions != null) transactions = JSON.parse(transactions);
                            else transactions = [];
                            transactions.push(req.body.transaction_info);
                            client.hset('customer:' + userData.customer + ':transactions:'  ,  "" + date, JSON.stringify(transactions), function(err, data){
                                res.send({
                                    error: false,
                                    message: 'Success',
                                    data: JSON.parse(customersData)
                                }).end();
                            });
                        });
                    }
                })
            }
            else res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
        });
    });

    app.post('/api/delTransaction', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            if(userData && req.body.transaction_id) {
                redisRequests.transactions(userData.customer, 'del', {transaction_id : req.body.transaction_id}, function(err, resp) {helper.parseResponse(err, resp, res)})
            }
            else res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
        });
    });

    app.post('/api/getUpcomingEvents', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            redisRequests.upcomingEvent(userData.customer, 'all', {}, function (err, upcomingEvents) {
                if(err || !upcomingEvents) {
                    console.error(err);
                    res.send({error: true, message: 'UpcomingEvent request error.', error_code: 'auth_1'}).end();
                }
                else {
                    serverEvents.updateUpcomingEventsForCustomer(userData.customer, function(){
                        res.send({error: false, message: 'Success', data: helper.parseEachAndGiveId(upcomingEvents)}).end();
                    });
                }
            });
        });
    });

    app.post('/api/getTransactionsByDate', function (req, res) {
        autorizationRequest(req.headers.authorization, function (userData) {
            var event_day = new Date(req.body.dt);
            var date = "" + event_day.getDate() + "-" + (event_day.getMonth() + 1) + "-" + event_day.getFullYear();
            client.hget('customer:' + userData.customer + ':transactions:'  ,  "" + date, function(err, resp) {helper.parseResponse(err, resp, res)});
        });
    });



    app.post('/api/getStatistics', function (req, res){
        autorizationRequest(req.headers.authorization, function (userData) {
            var _month = Number(req.body.month) + 1, _year = Number(req.body.year), daysArray = [],
                months = ['January', 'February', 'March', 'April', 'May', 'June',  'July', 'August', 'September', 'October', 'November', 'December'];
            var _days = helper.daysInMonth(new Date(new Date().getFullYear(), Number(req.body.month), new Date().getDate(), 0, 0, 0));
            for(var i=1;i<=_days;i++) { daysArray.push(""+i+"-"+_month+"-"+_year) }
            var statistics = {monthName : months[Number(req.body.month)], year : _year};
            var statisticsArray = [{db : "event", dest : "events"}, { db : "transactions", dest : "transactions"}];

            async.each(statisticsArray,
                function(item, callback){
                    client.hmget('customer:' + userData.customer + ':' + item.db + ':', daysArray, function(err, data){
                        if(err) statistics[item.dest] = {error : true};
                        else statistics[item.dest] = statisticsService["" + item.dest + "ReportsByDay"](data);
                        callback();
                    });
                },
                function(err){
                    res.send({error: false, message: 'Success', data: statistics}).end();
                }
            );
        });
    });



    app.get('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });

    app.post('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });
};
