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

redisRequests.getData('admin', 'customers', {}, function (err, customer) {
    if(err) {
        console.log(err);
    }
    else {
        console.log('customers : ', customer);
    }
});

redisRequests.getData('admin', 'customer', {}, function (err, customer) {
    if(err) {
        console.log(err);
    }
    else {
        console.log('customer : ', customer);
    }
});

redisRequests.getData('admin', 'users', {}, function (err, users) {
    if(err) {
        console.log(err);
    }
    else {
        console.log('users : ', users);
    }
});

redisRequests.getData('admin', 'clients-get', {}, function (err, clients) {
    if(err) {
        console.log(err);
    }
    else {
        console.log('clients : ', clients);
    }
});

redisRequests.getData('admin', 'client-get', {client_id : 1}, function (err, clients) {
    if(err) {
        console.log(err);
    }
    else {
        console.log('client : ', clients);
    }
});

redisRequests.getData('admin', 'user', {user_id : 1}, function (err, userData) {
    if(err) {
        console.log(err);
    }
    else {
        console.log('user : ', userData);
    }
});

module.exports = function (app, fs) {

    app.post('/api/login',function (req, res) {
        if (req.headers.authorization != undefined) {
            res.send({error: true, message: 'Already logged in', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getData('admin', 'users', {}, function (err, users) {
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

    app.post('/api/logout',function (req, res) {
        dbRequest.getSports(function(callback){
            res.send(callback).end();
        });
    });

    app.post('/api/getUsers',function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getData(req.headers.authorization, 'users', function (err, userData) {
                if(err) {
                    res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
                }
                else {
                    userData = JSON.parse(userData);
                    redisRequests.getData(userData.customer, 'users', {}, function (err, users) {
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

    app.post('/api/getUser',function (req, res) {
        dbRequest.getSports(function(callback){
            res.send(callback).end();
        });
    });
    
    app.post('/api/getClients',function (req, res) {
        if (req.headers.authorization == undefined) {
            res.send({error: true, message: 'Authorizatioin token required', error_code: 'auth_1'}).end();
        }
        else {
            redisRequests.getData(req.headers.authorization, 'users', function (err, userData) {
               if(err) {
                   res.send({error: true, message: "User doesn't exist", error_code: 'auth_1'}).end();
               }
               else {
                   userData = JSON.parse(userData);
                   redisRequests.getData(userData.customer, 'clients-get', {}, function (err, cliensData) {
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

    app.post('/api/getClient',function (req, res) {
        redisRequests
    });

    app.post('/api/addClient',function (req, res) {
        redisRequests
    });

    app.post('/api/delClient',function (req, res) {
        redisRequests
    });

    app.post('/api/getTransactions',function (req, res) {

    });

    app.get('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });

    app.post('*', function (req, res) {
        res.sendFile('index.html', { root: './files/' });
    });
};
