/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

module.exports = {
    storeEvent : function (event_id, param, object, callback) {
        if(!callback) callback = function (err, keys) {
            if (err) return console.error(err);
        };
        switch (param) {
            case '':
                client.set('' + event_id, object, callback);
                break;
            case 'pricelist':
                client.set('' + event_id + ':pricelist', object, callback);
                break;
            case 'updated':
                client.set('' + event_id + ':updated', object, callback);
                break;
            default :
                client.hset('' + event_id + ':price:' + param + '', "" + object[0], "" + object[1], callback);
                break;
        }
    },

    getEvent : function(event_id, param, callback) {
        switch (param) {
            case '':
                callback = callback || function(err, object) {
                        if (err) return console.log(err);
                        else {
                            var vilkas = JSON.parse(object);
                            console.log("vilkas : ", vilkas);
                        }
                    };
                client.get('' + event_id, callback);
                break;
            case 'pricelist':
                callback = callback || function(err, object) {
                        if (err) return console.log(err);
                        else {
                            console.log("pricelist : ", object.split(","))
                        }
                    };
                //console.log('' + event_id + ':pricelist')
                client.get('' + event_id + ':pricelist', callback);
                break;
            case 'updated':
                callback = callback || function(err, object) {
                        if (err) return console.log(err);
                        else {
                            //console.log("updated : ", object);
                        }
                    };
                client.get('' + event_id + ':updated', callback);
                break;
            default :
                callback = callback || function(err, object) {
                        if (err) return console.error(err);
                        else {
                            //console.log("event_id:price:price_id : ", event_id, param, object);
                        }
                    };
                client.hgetall('' + event_id + ':price:' + param + '', callback);
                break;
        }
    },

    deleteEvent : function(event_id, param, callback) {
        switch (param) {
            case '':
                callback = callback || function(err, object) {
                        if (err) return console.log(err);
                        else {
                            var vilkas = JSON.parse(object);
                            //console.log("vilkas : ", vilkas);
                        }
                    };
                client.del('' + event_id, callback);
                break;
            case 'pricelist':
                callback = callback || function(err, object) {
                        if (err) return console.log(err);
                        else {
                            console.log("pricelist : ", object.split(","))
                        }
                    };
                client.del('' + event_id + ':pricelist', callback);
                break;
            case 'updated':
                callback = callback || function(err, object) {
                        if (err) return console.log(err);
                        else {
                            //console.log("updated : ", object);
                        }
                    };
                client.del('' + event_id + ':updated', callback);
                break;
            default :
                callback = callback || function(err, object) {
                        if (err) return console.error(err);
                        else {
                            //console.log("event_id:price:price_id : ", event_id, param, object);
                        }
                    };
                client.hdel('' + event_id + ':price:' + param + '', "" + object[0], callback);
                break;
        }
    }
};