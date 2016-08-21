/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

var redisRequests = require('./redisRequests');
var uuid = require('node-uuid');

module.exports = {
    
    init : function() {
        //console.log(this);
        this.updateUpcomingEventsEveryDay();
        this.setUpcomingEventsEveryDay();
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
        // this.everyFixedTime(1, 0, 'day', function(){
        //     console.log("Every DAY")
        // });
        var _this = this;
        redisRequests.customer('', 'all', '', function (err, customers) {
            if(err) {
                res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
            }
            else {
                _this.everyFixedTime(1, 0, 'month', function(){
                    var _uE = [
                        {
                            clientname: "Ashotik",
                            description: "d111111",
                            dt: "2016-08-19T07:03:00.000Z",
                            id: uuid.v4()
                        },
                        {
                            clientname: "Valera",
                            description: "VVVVVVVVVVV",
                            dt: "2016-08-19T07:03:00.000Z",
                            id: uuid.v4()
                        },
                        {
                            clientname: "Maratik",
                            description: "MMMMMMM",
                            dt: "2016-08-19T07:03:00.000Z",
                            id: uuid.v4()
                        },
                        {
                            clientname: "Lyosh",
                            description: "LLLLLLL",
                            dt: "2016-08-19T07:03:00.000Z",
                            id: uuid.v4()
                        }
                    ];

                    _.each(customers, function(customer, keyC){
                        customers[keyC] = JSON.parse(customer);
                        customers[keyC].id = keyC;
                        var multiR = client.multi();
                        _.each(_uE, function(event, keyE){
                            multiR.hmset('customer:' + keyC + ':upcomingEvents:', event.id, JSON.stringify(event));
                        });
                        multiR.exec(function (err, res) {
                            if(err) console.error(err);
                            else console.log(res);
                        });
                    });
                });
                


            }
        });
    },

    updateUpcomingEvents : function() {
        
    },

    setUpcomingEventsEveryDay : function() {
        
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
