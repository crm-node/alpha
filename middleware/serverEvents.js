/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

var redisRequests = require('./redisRequests');
var uuid = require('node-uuid');

module.exports = {
    
    init : function() {
        //console.log(this);
        this.updateUpcomingEventsEveryDay();
        this.archiveEventsEveryMonth();
        this.archiveTransactionsEveryMonth();
    },
    
    everyFixedTime : function (hour, minute, type, func) {
        var now = new Date(), start, wait, offset = now.getTimezoneOffset() / 60, _now,
            _hour = now.getUTCHours() - offset, _minute = now.getUTCMinutes(), _interval;
        if (_hour < hour || (_hour == hour && _minute < minute)) {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour - offset, minute, 0, 0);
        } else {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour - offset, minute, 0, 0);
        }
        _now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - offset, now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        wait = start.getTime() - _now.getTime();
        if(wait <= 0) {
            this.everyFixedTime(t, func);
        } else {
            setTimeout(function () {
                switch (type) {
                    case 'month' :
                        function daysInMonth() {
                            return new Date(now.getFullYear(), now.getMonth(), 0).getDate();
                        }
                        function monthLoop() {
                            var nextExecutionTime = daysInMonth() * 86400000;
                            console.log(nextExecutionTime);
                            func();
                            setTimeout(monthLoop, nextExecutionTime);
                        }
                        monthLoop();
                        break;
                    case 'day' :
                    default :
                        setInterval(function () {
                            func();
                        }, 86400000);
                        break;
                }
                func();
            }, wait);
        }
    },
    
    atFixedTime : function (delay, code) {
        this.atFixedTime.conv = this.atFixedTime.conv || {
                'number': function numberInSecsToUnixTs(delay) {
                    return (new Date().getTime() / 1000) + delay;
                },
                'string': function dateTimeStrToUnixTs(datetime) {
                    return new Date(datetime).getTime() / 1000;
                },
                'object': function dateToUnixTs(date) {
                    return date.getTime() / 1000;
                }
            };
        var delayInSec = this.atFixedTime.conv[typeof delay](delay) - (new Date().getTime() / 1000);
        if (delayInSec < 0) throw "Cannot execute in past";
        var id = setTimeout(code, delayInSec * 1000);
        return (function(id) {
            return function() {
                clearTimeout(id);
            }
        })(id);
    },

    updateUpcomingEventsEveryDay : function() {
        var _this = this;
        redisRequests.customer('', 'all', '', function (err, customers) {
            if(err) {
                res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
            }
            else {
                _this.everyFixedTime(13, 7, 'day', function(){
                    _.each(customers, function(customer, keyC){
                        _this.updateUpcomingEventsForCustomer(keyC);
                    });
                });
            }
        });
    },

    updateUpcomingEventsForCustomer : function (customer_id, callback) {
        var _this = this;
        var today = new Date();
        var date = "" + today.getDate() + "-" + (today.getMonth() + 1) + "-" + today.getFullYear();
        client.hget('customer:' + customer_id +':event:', date, function(err, todayEvents){
            todayEvents = JSON.parse(todayEvents);
            client.del('customer:' + customer_id +':upcomingEvents:', function(err, res){
                var multiR = client.multi();
                var upcoming = {};
                _.each(todayEvents, function(event){
                    var now = new Date(), eventTime = new Date(event.dt);
                    var secondsDelay = (eventTime.getTime() -  now.getTime()) / 1000;
                    if(secondsDelay > 0) {
                        upcoming["" + event.id] = _this.atFixedTime(secondsDelay, function () {
                            io.emit('upcoming event' + customer_id, event);
                        });
                    }
                    multiR.hmset('customer:' + customer_id + ':upcomingEvents:', event.id, JSON.stringify(event));
                });
                multiR.exec(function (err, res) {
                    if(err) console.error(err);
                    else {
                        console.log(res);
                        if(callback) callback();
                    }
                });
            });
        });
    },

    archiveEventsEveryMonth : function() {
        this.everyFixedTime(1, 0, 'month', function(){
            console.log("Every DAY")
        });
    },

    archiveTransactionsEveryMonth : function() {
        this.everyFixedTime(1, 0, 'month', function(){
            console.log("Every DAY")
        });
    }
    
};
