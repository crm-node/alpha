/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

//var dbRequest = require('./dbRequests');
var redisRequests = require('./redisRequests');



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
                            console.log(transactionsData)
                            transactionsData = _.filter(transactionsData, function(item){ return item.client && item.client.client_id == req.body.client_id});
                            console.log(transactionsData)
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

    app.get('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });

    app.post('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });
};
