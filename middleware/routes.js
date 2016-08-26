/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

//var dbRequest = require('./dbRequests');
var redisRequests = require('./redisRequests');
var serverEvents = require('./serverEvents');
var util = require('util');
var uuid = require('node-uuid');

function daysInMonth(now) {
    return new Date(now.getFullYear(), now.getMonth(), 0).getDate();
}

function parseEachAndGiveId(data) {
    _.each(data, function(item, key){
        data[key] = JSON.parse(item);
        data[key].id = key;
    });
    return data;
}

Date.prototype.isLeapYear = function() {
    var year = this.getFullYear();
    if((year & 3) != 0) return false;
    return ((year % 100) != 0 || (year % 400) == 0);
};

Date.prototype.getDOY = function() {
    var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var mn = this.getMonth();
    var dn = this.getDate();
    var dayOfYear = dayCount[mn] + dn;
    if(mn > 1 && this.isLeapYear()) dayOfYear++;
    return dayOfYear;
};

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
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    res.send({error: false, message: 'Success', data: JSON.parse(userData)}).end();
                }
            });
        }
    });

    app.post('/api/logout', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.delUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    res.send({error: false, message: 'Success', data: null}).end();
                }
            });
        }
    });



    app.post('/api/getCustomers', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    redisRequests.customer(JSON.parse(userData).customer, 'all', {}, function (err, customersData) {
                        if(err || !customersData) {
                            res.send({error: true, message: 'Customers request error', error_code: 'cli_1', data: err}).end();
                        }
                        else {
                            res.send({error: false, message: 'Success', data: parseEachAndGiveId(customersData)}).end();
                        }
                    })
                }
            });
        }
    });

    app.post('/api/getCustomer', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.customer(userData.customer, 'get', {customer_id : req.body.customer_id}, function (err, customers) {
                        if(err || !customers || customers == 'null') {
                            res.send({error: true, message: "Customers request error", error_code: 'auth_1', data : err}).end();
                        }
                        else {
                            res.send({error: false, message: 'Success', data: JSON.parse(customers)}).end();
                        }
                    });
                }
            });
        }
    });

    app.post('/api/editCustomer', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1', data : err}).end();
                }
                else {
                    redisRequests.customer(req.body.customer_id, 'edit', {customer_info : req.body.customer_info}, function (err, customers) {
                        if(err || !customers || customers == 'null') {
                            res.send({error: true, message: "Customers request error", error_code: 'auth_1', data : err}).end();
                        }
                        else {
                            res.send({error: false, message: 'Success', data: JSON.parse(customers)}).end();
                        }
                    });
                }
            });
        }
    });

    app.post('/api/addCustomer', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    var formDataCustomer = {
                        name : req.body.customer_info.name,
                        id : "" + uuid.v4(),
                        type : req.body.customer_info.type
                    };
                    redisRequests.customer(formDataCustomer.id, 'add', {customer_info : formDataCustomer}, function (err, customers) {
                        if(err) {
                            res.send({error: true, message: "User doesn't exist", error_code: 'auth_1', data : err}).end();
                        }
                        else {
                            var formDataUser = {
                                customer : formDataCustomer.id,
                                name : req.body.customer_info.username,
                                login : req.body.customer_info.login,
                                password : req.body.customer_info.password,
                                type : "owner",
                                id : "" + uuid.v4(),
                                status : 0
                            };
                            redisRequests.user(formDataCustomer.id, 'add', {user_info : formDataUser}, function (err, users) {
                                if(err || !users || users == 'null') {
                                    res.send({error: true, message: "Customers request error", error_code: 'auth_1', data : err}).end();
                                }
                                else {
                                    res.send({error: false, message: 'Success', data: JSON.parse(users)}).end();
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    app.post('/api/delCustomer', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    redisRequests.customer(req.body.customer_id, 'del', {}, function (err, customers) {
                        if(err || !customers || customers == 'null') {
                            res.send({error: true, message: "Customers request error", error_code: 'auth_1', data : err}).end();
                        }
                        else {
                            res.send({error: false, message: 'Success', data: JSON.parse(customers)}).end();
                        }
                    });
                }
            });
        }
    });



    app.post('/api/getUsers', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData || userData == 'null') {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.user(userData.customer, 'all', {}, function (err, users) {
                        if(err || !users) {
                            console.error(err);
                        }
                        else {
                            users = parseEachAndGiveId(users);
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
                }
            });
        }
    });

    app.post('/api/getUser', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.user(userData.customer, 'get', {user_id : req.body.user_id}, function (err, users) {
                        if(err) {
                            console.error(err);
                        }
                        else {
                            users = JSON.parse(users);
                            console.log(users);
                            res.send({
                                error: false,
                                message: 'Success',
                                data: users
                            }).end();
                        }
                    });
                }
            });
        }
    });

    app.post('/api/editUser', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.user(userData.customer, 'edit', {user_id : req.body.user_id, user_info : req.body.user_info}, function (err, users) {
                        if(err) {
                            console.error(err);
                        }
                        else {
                            users = JSON.parse(users);
                            res.send({
                                error: false,
                                message: 'Success',
                                data: users
                            }).end();
                        }
                    });
                }
            });
        }
    });

    app.post('/api/addUser', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.user(userData.customer, 'add', {user_info : req.body.user_info}, function (err, users) {
                        if(err) {
                            console.error(err);
                        }
                        else {
                            users = JSON.parse(users);
                            res.send({error: false, message: 'Success', data: users}).end();
                        }
                    });
                }
            });
        }
    });

    app.post('/api/delUser', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.user(userData.customer, 'del', {user_id : req.body.user_id}, function (err, users) {
                        if(err) {
                            console.error(err);
                        }
                        else {
                            users = JSON.parse(users);
                            console.log(users);
                            res.send({
                                error: false,
                                message: 'Success',
                                data: users
                            }).end();
                        }
                    });
                }
            });
        }
    });



    app.post('/api/getClients', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
               if(err) {
                   res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
               }
               else {
                   userData = JSON.parse(userData);
                   redisRequests.clients(userData.customer, 'all', {}, function (err, clientsData) {
                       if(err || !clientsData) {
                           res.send({error: true, message: 'Clients request error', error_code: 'cli_1'}).end();
                       }
                       else {
                           res.send({error: false, message: 'Success', data: parseEachAndGiveId(clientsData)}).end();
                       }
                   })
               }
            });
        }
    });

    app.post('/api/getClient', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.clients(userData.customer, 'get', {client_id : req.body.client_id}, function (err, cliensData) {
                        if(err) {
                            res.send({error: true, message: 'Clients request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            res.send({
                                error: false,
                                message: 'Success',
                                data: JSON.parse(cliensData)
                            }).end();
                        }
                    })
                }
            });
        }
    });

    app.post('/api/editClient', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.clients(userData.customer, 'edit', {client_id : req.body.client_id, client_info : req.body.client_info}, function (err, cliensData) {
                        if(err) {
                            res.send({error: true, message: 'Clients request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            res.send({
                                error: false,
                                message: 'Success',
                                data: JSON.parse(cliensData)
                            }).end();
                        }
                    })
                }
            });
        }
    });

    app.post('/api/addClient', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    if(userData && req.body.client_info) {
                        redisRequests.clients(userData.customer, 'add', {client_info : req.body.client_info}, function (err, cliensData) {
                            if(err) {
                                res.send({error: true, message: 'Clients request error', error_code: 'cli_1'}).end();
                            }
                            else {
                                res.send({
                                    error: false,
                                    message: 'Success',
                                    data: JSON.parse(cliensData)
                                }).end();
                            }
                        })
                    }
                    else res.send({error: true, message: 'Clients request error', error_code: 'cli_1'}).end();
                }
            });
        }
    });

    app.post('/api/delClient', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    if(userData && req.body.client_id) {
                        redisRequests.clients(userData.customer, 'del', {client_id : req.body.client_id}, function (err, cliensData) {
                            if(err) {
                                res.send({error: true, message: 'Clients request error', error_code: 'cli_1'}).end();
                            }
                            else {
                                res.send({
                                    error: false,
                                    message: 'Success',
                                    data: JSON.parse(cliensData)
                                }).end();
                            }
                        })
                    }
                    else res.send({error: true, message: 'Clients request error', error_code: 'cli_1'}).end();
                }
            });
        }
    });



    app.post('/api/getAllEvents', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.events(userData.customer, 'all', '', {}, function (err, eventsData) {
                        if(err || !eventsData) {
                            res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            res.send({error: false, message: 'Success', data: parseEachAndGiveId(eventsData)}).end();
                        }
                    });
                }
            });
        }
    });

    app.post('/api/getEvents', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    var date = "" + new Date(req.body.dt).getDate() + "-" + (new Date(req.body.dt).getMonth() + 1) + "-" + new Date(req.body.dt).getFullYear();
                    redisRequests.events(userData.customer, 'get', date, {}, function (err, clientsData) {
                        if(err) {
                            res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            res.send({
                                error: false,
                                message: 'Success',
                                data: JSON.parse(clientsData)
                            }).end();
                        }
                    })
                }
            });
        }
    });

    app.post('/api/editEvent', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
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
                                            res.send({
                                                error: false,
                                                message: 'Success',
                                                data: JSON.parse(eventData)
                                            }).end();
                                        });
                                    }
                                })
                            }
                        });
                    }
                    else res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                }
            });
        }
    });

    app.post('/api/addEvent', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
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
                                            res.send({
                                                error: false,
                                                message: 'Success',
                                                data: JSON.parse(eventData)
                                            }).end();
                                        });
                                    }
                                })
                            }
                        });
                    }
                    else res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                }
            });
        }
    });

    app.post('/api/delEvent', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
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
                                            res.send({
                                                error: false,
                                                message: 'Success',
                                                data: JSON.parse(eventData)
                                            }).end();
                                        });
                                    }
                                })
                            }
                        });
                    }
                    else res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                }
            });
        }
    });

    app.post('/api/delEventsDay', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    var event_day = new Date(req.body.event.dt);
                    var date = "" + event_day.getDate() + "-" + (event_day.getMonth() + 1) + "-" + event_day.getFullYear();

                    redisRequests.events(userData.customer, 'del', date, {}, function (err, eventData) {
                        if(err) {
                            res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            serverEvents.updateUpcomingEventsForCustomer(userData.customer, function(){
                                res.send({
                                    error: false,
                                    message: 'Success',
                                    data: JSON.parse(eventData)
                                }).end();
                            });
                        }
                    })
                }
            });
        }
    });



    app.post('/api/getTransactions', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.transactions(userData.customer, 'all', {}, function (err, transactionsData) {
                        if(err || !transactionsData) {
                            res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            res.send({error: false, message: 'Success', data: parseEachAndGiveId(transactionsData)}).end();
                        }
                    })
                }
            });
        }
    });

    app.post('/api/clientTransactions', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.transactions(userData.customer, 'all', {}, function (err, transactionsData) {
                        if(err || !transactionsData) {
                            res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            transactionsData = parseEachAndGiveId(transactionsData);
                            transactionsData = _.filter(transactionsData, function(item){ return item.client && item.client.client_id == req.body.client_id});
                            res.send({error: false, message: 'Success', data: transactionsData}).end();
                        }
                    })
                }
            });
        }
    });

    app.post('/api/getTransaction', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.transactions(userData.customer, 'get', {transaction_id : req.body.transaction_id}, function (err, transactionsData) {
                        if(err || !transactionsData || transactionsData == 'null') {
                            res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            res.send({error: false, message: 'Success', data: JSON.parse(transactionsData)}).end();
                        }
                    })
                }
            });
        }
    });

    app.post('/api/editTransaction', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    var event_day = new Date(req.body.transaction_info.dt);
                    var date = "" + event_day.getDate() + "-" + (event_day.getMonth() + 1) + "-" + event_day.getFullYear();
                    redisRequests.transactions(userData.customer, 'edit', {transaction_id : req.body.transaction_id, transaction_info : req.body.transaction_info}, function (err, cliensData) {
                        if(err) {
                            res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            res.send({
                                error: false,
                                message: 'Success',
                                data: JSON.parse(cliensData)
                            }).end();
                        }
                    })
                }
            });
        }
    });

    app.post('/api/addTransaction', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
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
                }
            });
        }
    });

    app.post('/api/delTransaction', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    if(userData && req.body.transaction_id) {
                        redisRequests.transactions(userData.customer, 'del', {transaction_id : req.body.transaction_id}, function (err, cliensData) {
                            if(err) {
                                res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                            }
                            else {
                                res.send({
                                    error: false,
                                    message: 'Success',
                                    data: JSON.parse(cliensData)
                                }).end();
                            }
                        })
                    }
                    else res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                }
            });
        }
    });


    
    app.post('/api/sendToArchive', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    function archiveThis(type, keysToDelete, data) {
                        redisRequests[''+type](userData.customer, 'del-multi', keysToDelete, function (err, transactionsData) {
                            if(err) {
                                res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                            }
                            else {
                                redisRequests.archive(userData.customer, 'add', type, data, function (err, archiveData) {
                                    if(err) {
                                        res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                                    }
                                    else {
                                        res.send({error: false, message: 'Success', data: archiveData}).end();
                                    }
                                });
                            }
                        });
                    }
                    switch (req.body.type) {
                        case 'transactions':
                            redisRequests.transactions(userData.customer, 'all', {}, function (err, transactionsData) {
                                if(err || !transactionsData) {
                                    res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                                }
                                else {
                                    transactionsData = parseEachAndGiveId(transactionsData);
                                    var archiveData = {}, tempTransactions = util._extend({}, transactionsData),
                                        transactionKeys = _.pluck(transactionsData, 'id');
                                    tempTransactions = _.groupBy(tempTransactions, function(item){
                                        return new Date(item.dt).getFullYear();
                                    });
                                    _.each(tempTransactions, function(yearData, key){
                                        archiveData["" + key] = _.groupBy(yearData, function(item){
                                            return new Date(item.dt).getDOY();
                                        });
                                    });
                                    archiveThis(req.body.type, transactionKeys, archiveData);
                                }
                            });
                            break;
                        case 'events':
                            break;
                    }

                }
            });
        }
    });

    app.post('/api/getFromArchive', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    switch (req.body.type) {
                        case 'transactions':
                            req.body.dateFrom = new Date(req.body.dateFrom);
                            req.body.dateTill = new Date(req.body.dateTill);
                            var DateFrom = req.body.dateFrom <= req.body.dateTill ? req.body.dateFrom : req.body.dateTill;
                            var DateTill = req.body.dateFrom <= req.body.dateTill ? req.body.dateTill : req.body.dateFrom;
                            var formData = {
                                from : {
                                    year : DateFrom.getFullYear(),
                                    day : DateFrom.getDOY()
                                },
                                to : {
                                    year : DateTill.getFullYear(),
                                    day : DateTill.getDOY()
                                }
                            };
                            redisRequests.archive(userData.customer, 'get', req.body.type, formData, function (err, archiveData) {
                                if(err) {
                                    res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                                }
                                else {
                                    if(archiveData[0]) {archiveData = _.flatten(archiveData);}
                                    archiveData = _.filter(archiveData, function(item){return item != null;});
                                    archiveData = _.each(archiveData, function(item, k){archiveData[k] = JSON.parse(item);});
                                    archiveData = _.flatten(archiveData);
                                    res.send({
                                        error: false,
                                        message: 'Success',
                                        data: archiveData
                                    }).end();
                                }
                            });
                            break;
                        case 'visits':
                            break;
                    }
                }
            });
        }
    });



    app.post('/api/getUpcomingEvents', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "UpcomingEvent doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.upcomingEvent(userData.customer, 'all', {}, function (err, upcomingEvents) {
                        if(err || !upcomingEvents) {
                            console.error(err);
                            res.send({error: true, message: 'UpcomingEvent request error.', error_code: 'auth_1'}).end();
                        }
                        else {
                            serverEvents.updateUpcomingEventsForCustomer(userData.customer, function(){
                                res.send({error: false, message: 'Success', data: parseEachAndGiveId(upcomingEvents)}).end();
                            });
                        }
                    });
                }
            });
        }
    });

    app.post('/api/getTransactionsByDate', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if(err || !userData) {
                    res.send({error: true, message: "UpcomingEvent doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    var event_day = new Date(req.body.dt);
                    var date = "" + event_day.getDate() + "-" + (event_day.getMonth() + 1) + "-" + event_day.getFullYear();
                    client.hget('customer:' + userData.customer + ':transactions:'  ,  "" + date, function(err, transactions){
                        if(err) console.error(err)
                        console.log(transactions, typeof transactions);
                        res.send({
                            error: false,
                            message: 'Success',
                            data: transactions
                        }).end();
                    });
                }
            });
        }
    });

    app.post('/api/getStatistics', function (req, res){
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUser(req.headers.authorization, function (err, userData) {
                if (err || !userData) {
                    res.send({error: true, message: "Statistics error", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);

                    var _month = Number(req.body.month) + 1, _year = Number(req.body.year), daysArray = [], months = ['January', 'February', 'March', 'April', 'May', 'June',  'July', 'August', 'September', 'October', 'November', 'December'];;
                    var _days = daysInMonth(new Date(new Date().getFullYear(), Number(req.body.month), new Date().getDate(), 0, 0, 0));
                    for(var i=1;i<=_days;i++) { daysArray.push(""+i+"-"+_month+"-"+_year) }
                    var statistics = {monthName : months[Number(req.body.month)], year : _year};
                    client.hmget('customer:' + userData.customer + ':event:', daysArray, function(err, events){
                        if(err) console.error(err);
                        events = _.groupBy(events, function(arr, day){ return day + 1 });
                        events = _.each(events, function(arr, day){
                            if(arr.length == 1 && arr[0] == null) {
                                events[day] = [];
                            }
                            else events[day] = JSON.parse(arr);
                        });
                        statistics.events = {
                            numByDay : _.map(events, function(byDay, key){return byDay.length})
                        };
                        statistics.events.dayReport = {};
                        statistics.events.doctors = [];
                        events = _.each(events, function(arr, day){
                            statistics.events.dayReport[""+day] = {};
                            _.each(arr, function(item, key){
                                if(item.doctorname) {
                                    if(statistics.events.doctors.indexOf(""+item.doctorname) == -1) statistics.events.doctors.push(item.doctorname);
                                    if(!statistics.events.dayReport[""+day][""+item.doctorname]) statistics.events.dayReport[""+day][""+item.doctorname] = 1;
                                    else statistics.events.dayReport[""+day][""+item.doctorname]++;
                                }
                            });
                        });
                        client.hmget('customer:' + userData.customer + ':transactions:', daysArray, function(err, transactions){

                            if(err) console.error(err);
                            transactions = _.groupBy(transactions, function(arr, day){ return day + 1 });
                            transactions = _.each(transactions, function(arr, day){
                                if(arr.length == 1 && arr[0] == null) {
                                    transactions[day] = [];
                                }
                                else transactions[day] = JSON.parse(arr);
                            });
                            var inputs = {}, outputs = {};
                            statistics.transactions = {
                                dayReport : {}
                            };
                            _.each(transactions, function(arr, day){
                                statistics.transactions.dayReport[""+day] = {};
                                statistics.transactions.dayReport[""+day].total = 0;
                                statistics.transactions.dayReport[""+day].inputs = [];
                                statistics.transactions.dayReport[""+day].outputs = [];
                                _.each(arr, function(item, key){
                                    statistics.transactions.dayReport[""+day].total += item.amount;
                                    if(Number(item.amount) > 0) statistics.transactions.dayReport[""+day].inputs.push(item);
                                    if(Number(item.amount) < 0) statistics.transactions.dayReport[""+day].outputs.push(item);
                                });
                                statistics.transactions.dayReport[""+day].total_input = _.reduce(statistics.transactions.dayReport[""+day].inputs, function(memo, item){ return memo + item.amount; }, 0);
                                statistics.transactions.dayReport[""+day].total_output = _.reduce(statistics.transactions.dayReport[""+day].outputs, function(memo, item){ return memo + item.amount; }, 0);

                            });
                            //console.log(transactions);
                            //console.log(statistics);
                            res.send({
                                error: false,
                                message: 'Success',
                                data: statistics
                            }).end();
                        });
                    });
                }
            })
        }
    });

    app.get('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });

    app.post('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });
};
