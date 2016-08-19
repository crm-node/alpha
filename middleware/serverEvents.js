/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

var redisRequests = require('./redisRequests');

module.exports = {
    
    init : function() {
        //console.log(this);
        
    },
    
    everyFixedTime : function (t, func) {
        var now = new Date(), start, wait, time = new Date(t);
        if (now.getUTCHours() < time.getUTCHours() || (now.getUTCHours() == time.getUTCHours() && now.getUTCMinutes() < time.getUTCMinutes())) {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), time.getUTCHours(), time.getUTCMinutes(), 0, 0);
        } else {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, time.getUTCHours(), time.getUTCMinutes(), 0, 0);
        }
        wait = start.getTime() - now.getTime();
        if(wait <= 0) {
            console.log('Oops, missed the hour');
            this.everyFixedTime(t, func);
        } else {
            setTimeout(function () {
                setInterval(function () {
                    func(new Date());
                }, 86400000);
            },wait);
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
    }
    
};