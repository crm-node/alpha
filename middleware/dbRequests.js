/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

var knex = require('knex')({
    client: 'mysql',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'qwerty',
        database: 'test1',
        debug: false,
        typeCast: function (field, next) {
            if (field.type == "BIT" && field.length == 1) {
                var bit = field.string();
                var b = (bit === null) ? null : bit.charCodeAt(0);
                return !!b;
            }
            return next();
        }
    }
});

module.exports = {

    getUser : function(callback) {
        
    },

    getEvents : function(params, callback) {
        
    },

    getVilkas : function(params, callback) {
        
    },

    getVilkaNames : function(vilkas, callback) {
        
    }
};