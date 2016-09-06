/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

module.exports = {
    
    eventsReportsByDay : function (events) {
        var response = {};
        events = _.groupBy(events, function(arr, day){ return day + 1 });
        events = _.each(events, function(arr, day){
            if(arr.length == 1 && arr[0] == null) {
                events[day] = [];
            }
            else events[day] = JSON.parse(arr);
        });
        response = {
            numByDay : _.map(events, function(byDay, key){return byDay.length})
        };
        response.dayReport = {};
        response.doctors = [];
        events = _.each(events, function(arr, day){
            response.dayReport[""+day] = {};
            _.each(arr, function(item, key){
                if(item.doctorname) {
                    if(response.doctors.indexOf(""+item.doctorname) == -1) response.doctors.push(item.doctorname);
                    if(!response.dayReport[""+day][""+item.doctorname]) response.dayReport[""+day][""+item.doctorname] = 1;
                    else response.dayReport[""+day][""+item.doctorname]++;
                }
            });
        });
        return response;
        
    },
    
    transactionsReportsByDay : function (transactions) {
        var response = {};
        transactions = _.groupBy(transactions, function(arr, day){ return day + 1 });
        transactions = _.each(transactions, function(arr, day){
            if(arr.length == 1 && arr[0] == null) {
                transactions[day] = [];
            }
            else transactions[day] = JSON.parse(arr);
        });
        response = {
            dayReport : {}
        };
        _.each(transactions, function(arr, day){
            response.dayReport[""+day] = {};
            response.dayReport[""+day].total = 0;
            response.dayReport[""+day].inputs = [];
            response.dayReport[""+day].outputs = [];
            _.each(arr, function(item, key){
                response.dayReport[""+day].total += item.amount;
                if(Number(item.amount) > 0) response.dayReport[""+day].inputs.push(item);
                if(Number(item.amount) < 0) response.dayReport[""+day].outputs.push(item);
            });
            response.dayReport[""+day].total_input = _.reduce(response.dayReport[""+day].inputs, function(memo, item){ return memo + item.amount; }, 0);
            response.dayReport[""+day].total_output = _.reduce(response.dayReport[""+day].outputs, function(memo, item){ return memo + item.amount; }, 0);
        });
        return response;
    }
    
};