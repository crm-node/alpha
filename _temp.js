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