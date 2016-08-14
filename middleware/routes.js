/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

var dbRequest = require('./dbRequests');
var redisRequests = require('./redisRequests');

// client.keys('*', function (err, keys) {
//     if (err) return console.log(err);
//
//     for(var i = 0, len = keys.length; i < len; i++) {
//         console.log(keys[i]);
//     }
// });

module.exports = function (app, fs) {

    app.post('/api/login', function (req, res) {
        if (req.headers.authorization != undefined) {
            res.send({error: true, message: 'Already logged in', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.user(req.body.customer, 'all', {}, function (err, users) {
                if(err) res.send({error: true, message: 'Login error', error_code: 'auth_1'}).end();
                else {
                    users = _.filter(JSON.parse(users), function(user){ 
                        return user.login == req.body.login && user.password == req.body.password; 
                    });
                    if(users.length == 0) res.send({error: true, message: 'Invalid username and password', error_code: 'auth_2'}).end();
                    else if(users.length == 0) {
                        res.send({
                            error: false, 
                            message: 'Success', 
                            data: users[0]
                        }).end();
                    }
                }
            });
        }
    });

    app.post('/api/logout', function (req, res) {

    });



    app.post('/api/getUsers', function (req, res) {
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
                    redisRequests.user(userData.customer, 'all', {}, function (err, users) {
                        if(err) {
                            console.log(err);
                        }
                        else {
                            users = JSON.parse(users);
                            users = _.filter(users, function(user){ return user.customer  == userData.customer; });
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

    app.post('/api/getUser', function (req, res) {
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
                if(err) {
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
                if(err) {
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

    app.post('/api/delUser', function (req, res) {
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
                   redisRequests.clients(userData.customer, 'all', {}, function (err, cliensData) {
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

    app.post('/api/getClient', function (req, res) {
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
                if(err) {
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
                if(err) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
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
            });
        }
    });

    app.post('/api/delClient', function (req, res) {
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
            });
        }
    });







    app.post('/api/getTransactions', function (req, res) {

    });

    app.get('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });

    app.post('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });
};
