/**
 * Created by Mark Sarukhanov on 06.09.2016.
 */

module.exports = {

    daysInMonth: function (now) {
        return new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    },

    parseEachAndGiveId: function (data) {
        _.each(data, function (item, key) {
            data[key] = JSON.parse(item);
            data[key].id = key;
        });
        return data;
    },

    parseResponse : function(err, resp, res, additionalFunc) {
        var _this = this;
        if(err || !resp || resp.error || resp == 'null') {
            return res.send({error: true, message: "Request Error or No data", error_code: 'data_null_1'}).end();
        }
        else {
            if(additionalFunc) additionalFunc();
            switch(typeof resp) {
                case 'object' :
                    res.send({error: false, message: 'Success', data: _this.parseEachAndGiveId(resp)}).end();
                    break;
                case 'string':
                default :
                    res.send({error: false, message: 'Success', data: JSON.parse(resp)}).end();
                    break;
            }
        }

    },

    isLeapYear: function () {
        var year = this.getFullYear();
        if ((year & 3) != 0) return false;
        return ((year % 100) != 0 || (year % 400) == 0);
    },

    getDOY: function () {
        var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var mn = this.getMonth();
        var dn = this.getDate();
        var dayOfYear = dayCount[mn] + dn;
        if (mn > 1 && this.isLeapYear()) dayOfYear++;
        return dayOfYear;
    },

    newUTCDate: function () {
        var now = new Date();
        now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
        return now;
    }

};