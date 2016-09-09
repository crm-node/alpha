/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */
var uuid = require('node-uuid');
var  multiR = client.multi();

module.exports = {

    setUser : function(id, data, callback) {
        console.log(id);
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
            case 'config':
                client.get('customer:' + customer_id + ':config', callback);
                break;
        }
    },

    user : function (customer_id, what, data, callback) {
        var userData, devUser, uniqId, now;
        switch (what) {
            case 'all':
                client.hgetall('customer:' + customer_id + ':users:', callback);
                break;
            case 'get':
                client.hget('customer:' + customer_id + ':users:', data, callback);
                break;
            case 'del':
                client.hdel('customer:' + customer_id + ':users:', data, function(err, resp) {
                    client.hdel('devusers:', data, function (errD, respD) {
                        callback(err, resp);
                    })
                });
                break;
            case 'add':
                client.hset('customer:' + customer_id + ':users:', "" + data.login, JSON.stringify(data.user_info), function(err, resp){
                    client.hset('devusers:', "" + devUser.login, JSON.stringify({login : data.user_info.login, password : data.user_info.password, customer : data.user_info.customer}), function(errD, respD){
                        callback(err, resp);
                    });
                });
                break;
            case 'edit':
                client.hset('customer:' + customer_id + ':users:', "" + data.user_id, JSON.stringify(data.user_info), function(err, resp) {
                    client.hset('devusers:', "" + devUser.login, JSON.stringify({login : data.user_info.login, password : data.user_info.password, customer : data.user_info.customer}), function (errD, respD) {
                        callback(err, resp);
                    })
                });
                break;
            case 'devget':
                client.hget('devusers:', "" + data, callback);
                break;
            case 'dev-all':
                client.hgetall('devusers:', callback);
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

    transactions : function (customer_id, what, date, data, callback) {
        switch (what) {
            case 'add':
                multiR.hset('customer:' + customer_id + ':transactions:'  , data.id, JSON.stringify(data));
                multiR.hset('customer:' + customer_id + ':user:transactions:' + data.doctor_id  , data.id, data.id);
                multiR.hset('customer:' + customer_id + ':daily:transactions:' + date, data.id, data.id);
                if(data.client_id) multiR.hset('customer:' + customer_id + ':client:' + data.client_id +':transactions:', data.id, '');
                multiR.exec(callback);
                break;
            case 'edit':
                client.hset('customer:' + customer_id + ':transactions:', "" + data.transaction_id, "" + JSON.stringify(data.transaction_info), callback);
                break;
            case 'get-by-customer':
                client.hgetall('customer:' + customer_id + ':transactions:', callback);
                break;
            case 'get-by-users':
                client.hmget('customer:' + customer_id + ':user:transactions:', data.users, callback);
                break;
            case 'get-by-client':
                client.hget('customer:' + customer_id + ':client:' + data + ':transactions:', callback);
                break;
            case 'get-by-date':
                client.hmget('customer:' + customer_id + ':daily:transactions:', data, callback);
                break;
            case 'get-by-id':
                client.hget('customer:' + customer_id + ':transactions:', data.id, callback);
                break;
            case 'del':
                multiR.hdel('customer:' + customer_id + ':transactions:'  , data.id);
                multiR.hdel('customer:' + customer_id + ':user:transactions:' + data.user_id  , data.id);
                multiR.hdel('customer:' + customer_id + ':daily:transactions:' + date, data.id);
                if(data.client_id) multiR.hdel('customer:' + customer_id + ':client:' + data.client_id +':transactions:', data.id);
                multiR.exec(callback);
                break;
        }
    },

    events : function (customer_id, what, date, data, callback) {
        switch (what) {
            case 'add':
                console.log('customer:' + customer_id + ':events:'  , data.id, JSON.stringify(data));
                console.log('customer:' + customer_id + ':user:events:' + data.doctor_id  , data.id, data.id);
                console.log('customer:' + customer_id + ':daily:events:' + date, data.id, data.id);
                multiR.hset('customer:' + customer_id + ':events:'  , data.id, JSON.stringify(data));
                multiR.hset('customer:' + customer_id + ':user:events:' + data.user_id  , data.id, data.id);
                multiR.hset('customer:' + customer_id + ':daily:events:' + date, data.id, data.id);
                if(data.client_id) multiR.hset('customer:' + customer_id + ':client:' + data.client_id +':events:', data.id, '');
                multiR.exec(callback);
                break;
            case 'edit':
                client.hset('customer:' + customer_id + ':events:', "" + data.transaction_id, "" + JSON.stringify(data.transaction_info), callback);
                break;
            case 'get-by-customer':
                client.hgetall('customer:' + customer_id + ':events:', callback);
                break;
            case 'get-by-users':
                client.hmget('customer:' + customer_id + ':user:events:', data.users, callback);
                break;
            case 'get-by-client':
                client.hget('customer:' + customer_id + ':client:' + data + ':events:', callback);
                break;
            case 'get-by-date':
                //client.hmget('customer:' + customer_id + ':daily:events:', data, callback);
                _.each(data, function(item){
                    multiR.hgetall('customer:admin:daily:events:' + item);
                });
                multiR.exec(callback);
                break;
            case 'get-by-id':
                client.hget('customer:' + customer_id + ':events:', data, callback);
                break;
            case 'del':
                multiR.hdel('customer:' + customer_id + ':events:'  , data.id);
                multiR.hdel('customer:' + customer_id + ':user:events:' + data.user_id  , data.id);
                multiR.hdel('customer:' + customer_id + ':daily:events:' + date, data.id);
                if(data.client_id) multiR.hdel('customer:' + customer_id + ':client:' + data.client_id +':events:', data.id);
                multiR.exec(callback);
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