/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

//var dbRequest = require('./dbRequests');
var redisRequests = require('./redisRequests');
var util = require('util');

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
                if(err) res.send({error: true, message: 'Login error', error_code: 'auth_1'}).end();
                else {
                    user = JSON.parse(user);
                    if(!user || !user.id) {
                        res.send({error: true, message: 'No such user.', error_code: 'auth_2'}).end();
                    }
                    else {
                        if(user.password != req.body.password) {
                            res.send({error: true, message: 'Invalid username or password.', error_code: 'auth_2'}).end();
                        }
                        else {
                            redisRequests.user(user.customer, 'get', {user_id : user.id}, function (err, userData) {
                                if(err || !userData) {
                                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                                }
                                else {
                                    redisRequests.setUser(user.id, JSON.parse(userData), function (err, resp) {
                                        if(err) res.send({error: true, message: 'Login error', error_code: 'auth_3'}).end();
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
                    res.send({
                        error: false,
                        message: 'Success',
                        data: JSON.parse(userData)
                    }).end();
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
                if(err) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    res.send({
                        error: false,
                        message: 'Success',
                        data: null
                    }).end();
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
                if(err || !userData) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.user(userData.customer, 'all', {}, function (err, users) {
                        if(err) {
                            console.log(err);
                        }
                        else {
                            _.each(users, function(user, key){
                                users[key] = JSON.parse(user);
                                users[key].id = key;
                            });
                            users = _.filter(users, function(user){ return user.customer  == userData.customer; });
                            var idS = _.pluck(users, "id");
                            _.each(idS, function(item, k){idS[k] = "token:"+item});
                            client.mget(idS, function (err, keys) {
                                _.each(keys, function(key, k){keys[k] = JSON.parse(key);});
                                _.each(users, function(user, keyU){
                                    users[keyU].status = _.findWhere(keys, {id: user.id}) ? 1 : 0;
                                });
                                res.send({
                                    error: false,
                                    message: 'Success',
                                    data: users
                                }).end();
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
                            console.log(err);
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
                            console.log(err);
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
                            console.log(err);
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
                            console.log(err);
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
                       if(err) {
                           res.send({error: true, message: 'Clients request error', error_code: 'cli_1'}).end();
                       }
                       else {
                           _.each(clientsData, function(client, key){
                               clientsData[key] = JSON.parse(client);
                               clientsData[key].id = key;
                           });
                           res.send({
                               error: false,
                               message: 'Success',
                               data: clientsData
                           }).end();
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

    app.post('/api/getTransactions', function (req, res) {
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
                    redisRequests.transactions(userData.customer, 'all', {}, function (err, transactionsData) {
                        if(err) {
                            res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            _.each(transactionsData, function(transaction, key){
                                transactionsData[key] = JSON.parse(transaction);
                                transactionsData[key].id = key;
                            });
                            res.send({
                                error: false,
                                message: 'Success',
                                data: transactionsData
                            }).end();
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
                if(err) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.transactions(userData.customer, 'all', {}, function (err, transactionsData) {
                        if(err) {
                            res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                        }
                        else {
                            _.each(transactionsData, function(transaction, key){
                                transactionsData[key] = JSON.parse(transaction);
                                transactionsData[key].id = key;
                            });
                            transactionsData = _.filter(transactionsData, function(item){ return item.client && item.client.client_id == req.body.client_id});
                            res.send({
                                error: false,
                                message: 'Success',
                                data: transactionsData
                            }).end();
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
                    redisRequests.transactions(userData.customer, 'get', {transaction_id : req.body.transaction_id}, function (err, cliensData) {
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
                        redisRequests.transactions(userData.customer, 'add', {transaction_info : req.body.transaction_info}, function (err, cliensData) {
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
                if(err) {
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
                                        client.hgetall('customer:' + userData.customer + ':archive:' + type + ':2016', function(err, dd){
                                            if(!err) console.log(dd);
                                        });
                                        res.send({
                                            error: false,
                                            message: 'Success',
                                            data: archiveData
                                        }).end();
                                    }
                                });
                            }
                        });
                    }
                    switch (req.body.type) {
                        case 'transactions':
                            redisRequests.transactions(userData.customer, 'all', {}, function (err, transactionsData) {
                                if(err) {
                                    res.send({error: true, message: 'Transactions request error', error_code: 'cli_1'}).end();
                                }
                                else {
                                    _.each(transactionsData, function(transaction, key){
                                        transactionsData[key] = JSON.parse(transaction);
                                        transactionsData[key].id = key;
                                    });
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
                        case 'visits':
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
                if(err) {
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
            redisRequests.getUpcomingEvent(req.headers.authorization, function (err, upcomingEventData) {
                if(err || !upcomingEventData) {
                    res.send({error: true, message: "UpcomingEvent doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    upcomingEventData = JSON.parse(upcomingEventData);
                    redisRequests.upcomingEvent(upcomingEventData.customer, 'all', {}, function (err, upcomingEvents) {
                        if(err) {
                            console.log(err);
                        }
                        else {
                            _.each(upcomingEvents, function(upcomingEvent, key){
                                upcomingEvents[key] = JSON.parse(upcomingEvent);
                                upcomingEvents[key].id = key;
                            });
                            upcomingEvents = _.filter(upcomingEvents, function(upcomingEvent){ return upcomingEvent.customer  == upcomingEventData.customer; });
                            var idS = _.pluck(upcomingEvents, "id");
                            _.each(idS, function(item, k){idS[k] = "token:"+item});
                            client.mget(idS, function (err, keys) {
                                _.each(keys, function(key, k){keys[k] = JSON.parse(key);});
                                _.each(upcomingEvents, function(upcomingEvent, keyU){
                                    upcomingEvents[keyU].status = _.findWhere(keys, {id: upcomingEvent.id}) ? 1 : 0;
                                });
                                res.send({
                                    error: false,
                                    message: 'Success',
                                    data: upcomingEvents
                                }).end();
                            });
                        }
                    });
                }
            });
        }
    });

    app.post('/api/getUpcomingEvent', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUpcomingEvent(req.headers.authorization, function (err, upcomingEventData) {
                if(err || !upcomingEventData) {
                    res.send({error: true, message: "UpcomingEvent doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    upcomingEventData = JSON.parse(upcomingEventData);
                    redisRequests.upcomingEvent(upcomingEventData.customer, 'get', {upcomingEvent_id : req.body.upcomingEvent_id}, function (err, upcomingEvents) {
                        if(err) {
                            console.log(err);
                        }
                        else {
                            upcomingEvents = JSON.parse(upcomingEvents);
                            console.log(upcomingEvents);
                            res.send({
                                error: false,
                                message: 'Success',
                                data: upcomingEvents
                            }).end();
                        }
                    });
                }
            });
        }
    });

    app.post('/api/editUpcomingEvent', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUpcomingEvent(req.headers.authorization, function (err, upcomingEventData) {
                if(err || !upcomingEventData) {
                    res.send({error: true, message: "UpcomingEvent doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    upcomingEventData = JSON.parse(upcomingEventData);
                    redisRequests.upcomingEvent(upcomingEventData.customer, 'edit', {upcomingEvent_id : req.body.upcomingEvent_id, upcomingEvent_info : req.body.upcomingEvent_info}, function (err, upcomingEvents) {
                        if(err) {
                            console.log(err);
                        }
                        else {
                            upcomingEvents = JSON.parse(upcomingEvents);
                            console.log(upcomingEvents);
                            res.send({
                                error: false,
                                message: 'Success',
                                data: upcomingEvents
                            }).end();
                        }
                    });
                }
            });
        }
    });

    app.post('/api/addUpcomingEvent', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUpcomingEvent(req.headers.authorization, function (err, upcomingEventData) {
                if(err || !upcomingEventData) {
                    res.send({error: true, message: "UpcomingEvent doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    upcomingEventData = JSON.parse(upcomingEventData);
                    redisRequests.upcomingEvent(upcomingEventData.customer, 'add', {upcomingEvent_info : req.body.upcomingEvent_info}, function (err, upcomingEvents) {
                        if(err) {
                            console.log(err);
                        }
                        else {
                            upcomingEvents = JSON.parse(upcomingEvents);
                            res.send({
                                error: false,
                                message: 'Success',
                                data: upcomingEvents
                            }).end();
                        }
                    });
                }
            });
        }
    });

    app.post('/api/delUpcomingEvent', function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getUpcomingEvent(req.headers.authorization, function (err, upcomingEventData) {
                if(err || !upcomingEventData) {
                    res.send({error: true, message: "UpcomingEvent doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    upcomingEventData = JSON.parse(upcomingEventData);
                    redisRequests.upcomingEvent(upcomingEventData.customer, 'del', {upcomingEvent_id : req.body.upcomingEvent_id}, function (err, upcomingEvents) {
                        if(err) {
                            console.log(err);
                        }
                        else {
                            upcomingEvents = JSON.parse(upcomingEvents);
                            console.log(upcomingEvents);
                            res.send({
                                error: false,
                                message: 'Success',
                                data: upcomingEvents
                            }).end();
                        }
                    });
                }
            });
        }
    });
    
    app.get('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });

    app.post('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });
};
