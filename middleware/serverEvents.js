/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

var redisRequests = require('./redisRequests');
var helper = require('./helperFunctions');
var schedule = require('node-schedule');
var uuid = require('node-uuid');

ScheduledServerEvents = {};

module.exports = {
    
    init : function() {
        //console.log(this);
        this.updateUpcomingEventsEveryDay();
    },
    
    everyFixedTime : function (hour, minute, type, name, callback) {
        var rule = new schedule.RecurrenceRule();
        rule.minute = minute; rule.hour = hour;
        switch (type) {
            case 'month' :
                rule.dayOfMonth = 1;
                break;
            case 'day' :
                break;
        }
        ScheduledServerEvents[""+name] = schedule.scheduleJob(rule, callback);
    },
    
    atFixedTime : function (date, name, callback) {
        var _date = new Date(date);
        console.log(date);
        ScheduledServerEvents[""+name] = schedule.scheduleJob(_date, callback);
    },

    updateUpcomingEventsEveryDay : function() {
        var _this = this;
        redisRequests.customer('', 'all', '', function (err, customers) {
            if(err) {
                res.send({error: true, message: 'Events request error', error_code: 'cli_1'}).end();
            }
            else {
                _this.everyFixedTime(13, 7, 'day', 'updateUpcomingEventsEveryDay', function(){
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
                    console.log(now, eventTime)
                    if(now < eventTime) {
                        upcoming["" + event.id] = _this.atFixedTime(eventTime, 'upcoming' + customer_id + '', function () {
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
    }
    
};
