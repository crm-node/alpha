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