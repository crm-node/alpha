/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */
var uuid = require('node-uuid');

module.exports = {

    storeData : function (customer_id, what, data, callback) {
        if(!callback) callback = function (err, keys) {
            if (err) return console.error(err);
        };
        switch (what) {
            case 'customer':
                data = JSON.stringify(data);
                client.hset('customer:', customer_id, data, callback);
                break;
            case 'clients-list-add':
                data = JSON.stringify(data);
                client.hset('customer:' + customer_id + ':clients:', "" + uuid.v4(), "" + data, callback);
                break;
            case 'user':
                data = JSON.stringify(data);
                client.hset('customer:' + customer_id + ':users:', "" + uuid.v4(), data, callback);
                break;
            case 'transactions':
                data.user_id = JSON.stringify(data.user_id);
                data.transaction = JSON.stringify(data.transaction);
                client.hset('customer:' + customer_id + ':users:' + data.user_id + ':transaction:'  , "" + data.uuid.v4(), "" + data.transaction, callback);
                break;
            default :
                callback({error: true, message: 'Invalid request'});
                break;
        }
    },

    getData : function(customer_id, what, data, callback) {
        if(!callback) callback = function (err, keys) {
            if (err) return console.error(err);
        };
        switch (what) {
            case 'customer':
                client.hget('customer:', customer_id, callback);
                break;
            case 'customers':
                client.hgetall('customer:', callback);
                break;
            case 'clients-get':
                client.hgetall('customer:' + customer_id + ':clients:', callback);
                break;
            case 'client-get':
                client.hget('customer:' + customer_id + ':clients:', data.client_id, callback);
                break;
            case 'user':
                client.hget('customer:' + customer_id + ':users:', data.user_id, callback);
                break;
            case 'users':
                client.hgetall('customer:' + customer_id + ':users:', callback);
                break;
            case 'transactions':
                client.hget('customer:' + customer_id + ':users:' + data.user_id + ':transaction:' + data.transaction_id, callback);
                break;
            default :
                callback({error: true, message: 'Invalid request'});
                break;
        }
    },

    deleteEvent : function(customer_id, what, data, callback) {
        if(!callback) callback = function (err, keys) {
            if (err) return console.error(err);
        };
        client.del('' + event_id, callback);
        client.hdel('' + event_id + ':price:' + param + '', "" + object[0], callback);
        switch (what) {
            case 'customer':
                client.hdel('customer:', customer_id, callback);
                break;
            case 'clients-list-get':
                client.hdel('customer:' + customer_id + ':clients:', data.client_id, callback);
                break;
            case 'users':
                client.hdel('customer:' + customer_id + ':users:', data.user_id, callback);
                break;
            case 'transactions':
                client.hdel('customer:' + customer_id + ':users:' + data.user_id + ':transaction:', data.transaction_id, callback);
                break;
            default :
                callback({error: true, message: 'Invalid request'});
                break;
        }
    }

};