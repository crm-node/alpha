/**
 * Created by Mark Sarukhanov on 29.07.2016.
 */

var redisRequests = require('./redisRequests');

// TODO ====== make real VILKA calculating ========
function calculateVilkas(event_id, eventSelections) {

    var vilkas = [], vilkaNum = 1;

    // ================================================
    // TODO ====== make real VILKA calculating ========

    var groupedByMarket = _.groupBy(eventSelections, function(selection){ return selection[1].split(":")[0]; });

    _.each(groupedByMarket, function(market, marketKey) {
        var groupedBySelection = _.groupBy(market, function(selection){ return selection[1].split(":")[1]; });
        var bestSelections = [];
        _.each(groupedBySelection, function(item, kk){
            bestSelections.push(_.max(item, function(selection){ return selection[2]; }));
        });
        if(market.length > 1) {
            vilkaNum = _.reduce(bestSelections, function(memo, num) {return memo + 1/Number(num[2])}, 0);
            if(vilkaNum < 1) vilkas.push(bestSelections);
        }
    });

    if(vilkas.length == 0) redisRequests.deleteEvent(event_id, '');
    else redisRequests.storeEvent(event_id, '', JSON.stringify(vilkas));

    // TODO ====== make real VILKA calculating ========
    // ================================================
}
// TODO ====== make real VILKA calculating ========

var i = 0;

function sortEvents() {
    client.keys('*:pricelist', function (err, event_ids) {
        _.each(event_ids, function(event_id, keyEv) {
            var eventsSelections = [];
            event_id = event_id.replace(":pricelist","");
            client.keys('' + event_id+ ':price:*', function (err, prices_list) {
                _.each(prices_list, function(price, keyPr) {
                    price = price.replace("" + event_id + ":price:","")
                    redisRequests.getEvent(event_id, price, function(err, rates){
                        _.each(rates, function(rate, bookmaker) {
                            eventsSelections.push([bookmaker, price, rate])
                        });
                        if(keyPr == prices_list.length - 1) {
                            calculateVilkas(event_id, eventsSelections);
                        }
                    })
                });
            });
        });
    });
}

function storeDifference(difference) {
    _.each(difference, function (item, dif_key) {
        if(item.rate != null) {
            redisRequests.storeEvent(item.event_id, item.price_id, ['' + item.bookmaker_id, item.rate], function (err, keys) {
                if(err) console.log(err);
                else {
                    client.hgetall('' + item.event_id + ':price:' + item.price_id, function(err, prices) {
                        if (err) return console.error(err);
                        else {
                            client.keys('' + item.event_id + ':price:*', function (err, prices_list) {
                                _.each(prices_list, function (price, price_key) {
                                    prices_list[price_key] = prices_list[price_key].replace("" + item.event_id + ":price:","")
                                });
                                redisRequests.storeEvent(item.event_id, 'pricelist', prices_list.toString(), function() {
                                    if(dif_key == difference.length - 1) {
                                        sortEvents();
                                        if(dif_key == 49999) console.log("Ending data generation");
                                    }
                                })
                            });
                        }
                    });
                }
            });
        }
        else {
            redisRequests.deleteEvent(item.event_id, item.price_id, function (err, keys) {
                if(err) console.log(err);
                else {
                    client.hgetall('' + item.event_id + ':price:' + item.price_id, function(err, prices) {
                        if (err) return console.error(err);
                        else {
                            client.keys('' + item.event_id + ':price:*', function (err, prices_list) {
                                _.each(prices_list, function (price, price_key) {
                                    prices_list[price_key] = prices_list[price_key].replace("" + item.event_id + ":price:","")
                                });
                                redisRequests.storeEvent(item.event_id, 'pricelist', prices_list.toString(), function() {
                                    if(dif_key == difference.length - 1) {
                                        sortEvents();
                                        if(dif_key == 49999) console.log("Ending data generation");
                                    }
                                })
                            });
                        }
                    });

                }
            });
        }
    })
}

function generateCollectedData(number) {
    var newDifference = [];
    _.times(number, function(n){
        var selection = _.sample(["1", "2", "3"]);
        var rate = (Number(selection) * ( 1 + _.random(1, 99)/100)).toFixed(2);
        var eventRange = [1,2];//[_.random(1, 1000),_.random(1, 1000)];
        newDifference.push({
            event_id : _.random(_.min(eventRange), _.max(eventRange)),
            price_id : _.sample(["total", "doublechance", "matchresult"]) + ":" + selection,
            bookmaker_id : _.sample(["toto", "vivaro", "eurofootball", "bet365","toto2", "vivaro2", "eurofootball2", "bet3652"]),
            rate : rate //_.random(1, 8) + "." + _.random(1, 99)
        });
    });
    storeDifference(newDifference);
}

module.exports = {

    init : function(num) {
        var _this = this;
        console.log(num);
        if(!num) num = 50000;
        client.keys("*", function (err, keys) {
            if(err) console.error(err);
            else {
                if(keys.length == 0) {
                    console.log("starting data generation");
                    generateCollectedData(num);
                    setInterval(function(){
                        generateCollectedData(500);
                    }, 1000);
                }
                else {
                    keys.forEach(function (key, pos) {
                        client.del(key, function(err, o) {
                            if (err) console.error(key);
                            else if(pos == keys.length - 1) {
                                console.log("starting data generation");
                                generateCollectedData(num);
                                setInterval(function(){
                                    generateCollectedData(500);
                                }, 1000);
                            }
                        });
                    });
                }
            }
        });
    },
    
    getVilkas : function (event_ids, callback) {
        var _this = this;
        var all_vilkas = {};
        if(event_ids) {
            _.each(event_ids, function(event_id, keyEv) {
                redisRequests.getEvent(event_id, '', function(err, vilkas){
                    if(!err && vilkas != null) {
                        all_vilkas[''+event_id] = vilkas;
                        console.log(vilkas, typeof vilkas)
                    }
                    if(keyEv == event_ids.length-1) {
                        callback(all_vilkas);
                    }
                });
            });
        }
        else {
            client.keys('*:pricelist', function (err, event_ids) {
                _.each(event_ids, function(event_id, keyEv) {
                    event_ids[keyEv] = event_id.replace(":pricelist","");
                });
                _this.getVilkas(event_ids);
            });
        }
    }
    
};
