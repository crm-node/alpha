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
                client.hset('customer:' + customer_id + ':users:', "" + uuid.v4(), JSON.stringify(data.user_info), callback);
                break;
            case 'edit':
                client.hset('customer:' + customer_id + ':users:', "" + data.user_id, JSON.stringify(data.user_info), callback);
                break;
            case 'all':
                client.hgetall('customer:' + customer_id + ':users:', callback);
                break;
            case 'get':
                client.hget('customer:' + customer_id + ':users:', data.user_id, callback);
                break;
            case 'del':
                client.hdel('customer:' + customer_id + ':users:', data.user_id, callback);
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
                data.user_id = JSON.stringify(data.user_id);
                data.transaction = JSON.stringify(data.transaction);
                client.hset('customer:' + customer_id + ':users:' + data.user_id + ':transaction:'  , "" + uuid.v4(), JSON.stringify(data.transaction.info), callback);
                break;
            case 'get':
                client.hget('customer:' + customer_id + ':users:' + data.user_id + ':transaction:' + data.transaction_id, callback);
                break;
            case 'del':
                client.hdel('customer:' + customer_id + ':users:' + data.user_id + ':transaction:', data.transaction_id, callback);
                break;
        }
    }
    
};