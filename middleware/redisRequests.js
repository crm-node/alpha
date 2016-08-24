/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */
var uuid = require('node-uuid');

module.exports = {

    setUser : function(id, data, callback) {
        client.set('token:' + id, JSON.stringify(data), callback);
    },

    getUser : function(id, callback) {
        client.get('token:' + id, callback);
    },

    delUser : function(id, callback) {
        client.del('token:' + id, callback);
    },

    customer : function (customer_id, what, data, callback) {
        switch (what) {
            case 'add':
                client.hset('customer:', customer_id, JSON.stringify(data.customer_info), callback);
                break;
            case 'edit':
                client.hset('customer:', data.customer_id, JSON.stringify(data.customer_info), callback);
                break;
            case 'all':
                client.hgetall('customer:', callback);
                break;
            case 'get':
                client.hget('customer:', customer_id, callback);
                break;
            case 'del':
                client.hdel('customer:', customer_id, callback);
                break;
        }
    },

    user : function (customer_id, what, data, callback) {
        switch (what) {
            case 'add':
                var uniqId = uuid.v4();
                var devUser = {id : uniqId, login : data.user_info.login, password : data.user_info.password, customer : data.user_info.customer};
                var userData = JSON.stringify(data.user_info);
                client.hset('customer:' + customer_id + ':users:', "" + uniqId, userData, function(err, resp){
                    client.hset('devusers:', "" + devUser.login, JSON.stringify(devUser), function(errD, respD){
                        callback(err, resp);
                    });
                });
                break;
            case 'edit':
                var devUser = {id : data.user_info.id, login : data.user_info.login, password : data.user_info.password, customer : data.user_info.customer};
                var userData = JSON.stringify(data.user_info);
                client.hset('customer:' + customer_id + ':users:', "" + data.user_id, userData, function(err, resp) {
                    client.hset('devusers:', "" + devUser.login, JSON.stringify(devUser), function (errD, respD) {
                        callback(err, resp);
                    })
                });
                break;
            case 'all':
                client.hgetall('customer:' + customer_id + ':users:', callback);
                break;
            case 'get':
                client.hget('customer:' + customer_id + ':users:', data.user_id, callback);
                break;
            case 'devget':
                client.hget('devusers:', "" + data.login, callback);
                break;
            case 'del':
                client.hdel('customer:' + customer_id + ':users:', data.user_id, function(err, resp) {
                    client.hdel('devusers:', data.login, function (errD, respD) {
                        callback(err, resp);
                    })
                });
                break;
        }
    },
    
    clients : function (customer_id, what, data, callback) {
        switch (what) {
            case 'add':
                client.hset('customer:' + customer_id + ':clients:', "" + uuid.v4(), JSON.stringify(data.client_info), callback);
                break;
            case 'edit':
                client.hset('customer:' + customer_id + ':clients:', "" + data.client_id, "" + JSON.stringify(data.client_info), callback);
                break;
            case 'all':
                client.hgetall('customer:' + customer_id + ':clients:', callback);
                break;
            case 'get':
                client.hget('customer:' + customer_id + ':clients:', data.client_id, callback);
                break;
            case 'del':
                client.hdel('customer:' + customer_id + ':clients:', data.client_id, callback);
                break;
        }
    },
    
    transactions : function (customer_id, what, data, callback) {
        switch (what) {
            case 'add':
                client.hset('customer:' + customer_id + ':transaction:'  , data.transaction_info.id, JSON.stringify(data.transaction_info), callback);
                break;
            case 'edit':
                client.hset('customer:' + customer_id + ':transaction:', "" + data.transaction_id, "" + JSON.stringify(data.transaction_info), callback);
                break;
            case 'all':
                client.hgetall('customer:' + customer_id + ':transaction:', callback);
                break;
            case 'get':
                client.hget('customer:' + customer_id + ':transaction:', data.transaction_id, callback);
                break;
            case 'del':
                client.hdel('customer:' + customer_id + ':transaction:', data.transaction_id.transaction_id, callback);
                break;
            case 'del-multi':
                client.hdel('customer:' + customer_id + ':transaction:', data, callback);
                break;
        }
    },

    events : function (customer_id, what, date, data, callback) {
        switch (what) {
            case 'add':
                client.hset('customer:' + customer_id + ':event:'  , "" + date, JSON.stringify(data.events), callback);
                break;
            case 'edit':
                client.hset('customer:' + customer_id + ':event:', "" + date, "" + JSON.stringify(data.events), callback);
                break;
            case 'all':
                client.hgetall('customer:' + customer_id + ':event:', callback);
                break;
            case 'get':
                client.hget('customer:' + customer_id + ':event:',  date, callback);
                break;
            case 'del':
                client.hdel('customer:' + customer_id + ':event:', date, callback);
                break;
            case 'del-multi':
                client.hdel('customer:' + customer_id + ':event:', data, callback);
                break;
        }
    },

    archive : function (customer_id, what, type, data, callback) {
        var i, multiR;
        switch (what) {
            case 'add':
                multiR = client.multi();
                _.each(data, function(dataByYear, keyY){
                    _.each(dataByYear, function(dataByDay, keyD){
                        multiR.hmset('customer:' + customer_id + ':archive:' + type + ':' + keyY, "" + keyD, JSON.stringify(dataByDay));
                    })
                });
                multiR.exec(callback);
                break;
            case 'get':
                function generateDays(from, to) {
                    var arr=[], i;
                    for(i=from; i<=to; i++) { arr.push(i + ""); }
                    return arr;
                }
                if(data.from.year == data.to.year) {
                    client.hmget('customer:' + customer_id + ':archive:' + type + ':' + data.from.year, generateDays(data.from.day, data.to.day), callback);
                }
                else {
                    multiR = client.multi();
                    var d1 = data.from.year < data.to.year ? data.from : data.to, d2 = data.from.year < data.to.year ? data.to : data.from;
                    multiR.hmget('customer:' + customer_id + ':archive:' + type + ':' + d1.year, generateDays(d1.day, (d1.year%4 == 0 ? 366 : 355)));
                    for(i=d1.year+1; i<d2.year; i++) {
                        multiR.hmget('customer:' + customer_id + ':archive:' + type + ':' + i, generateDays(1, (i%4 == 0 ? 366 : 355)));
                    }
                    multiR.hmget('customer:' + customer_id + ':archive:' + type + ':' + d2.year, generateDays(1, d2.day));
                    multiR.exec(callback);
                }
                break;
        }
    },

    upcomingEvent : function (customer_id, what, data, callback) {
        var date;
        if(data && data.date) date = "" + new Date(data.date).getDay() + "-" + new Date(data.date).getMonth() + "-" + new Date(data.date).getFullYear();
        switch (what) {
            case 'add':
                client.hset('customer:' + customer_id +':upcomingEvents:', "" + uuid.v4(), JSON.stringify(data.upcomingEvent), callback);
                break;
            case 'edit':
                client.hset('customer:' + customer_id +':upcomingEvents:', data.id, JSON.stringify(data.upcomingEvent), callback);
                break;
            case 'all':
                client.hgetall('customer:' + customer_id +':upcomingEvents:', callback);
                break;
            case 'get':
                client.hget('customer:' + customer_id +':upcomingEvents:', data.id, callback);
                break;
            case 'del':
                client.hdel('customer:' + customer_id +':upcomingEvents:', data.id, callback);
                break;
        }
    }

};