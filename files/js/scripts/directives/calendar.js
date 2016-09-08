/**
 * Created by Mark Sarukhanov on 07.09.2016.
 */

function _removeDayTime(date) {
    return date.day(0).hour(0).minute(0).second(0).millisecond(0);
}
function _removeTime(date) {
    return date.hour(0).minute(0).second(0).millisecond(0);
}
function _buildMonth(scope, start, month, firstday) {
    scope.weeks = [];
    var done = false, date = start.clone(), monthIndex = date.month(), count = 0;
    while (!done) {
        scope.weeks.push({days: _buildWeek(date.clone(), month, firstday)});
        date.add(1, "w");
        done = count++ > 2 && monthIndex !== date.month();
        monthIndex = date.month();
    }
}

function _buildWeek(date, month, firstday) {
    var days = [];
    // ====== if 1st day is monday ======
    if(firstday == "mon") date.add(1, "d");
    // ==================================
    for (var i = 0; i < 7; i++) {
        days.push({
            name: date.format("dd").substring(0, 1),
            fullName : date.format('D-M-YYYY'),
            number: date.date(),
            isCurrentMonth: date.month() === month.month(),
            isToday: date.isSame(new Date(), "day"),
            date: date
        });
        date = date.clone();
        date.add(1, "d");
    }
    return days;
}

function numFmt(num) {
    num = num.toString();
    if (num.length < 2) {
        num = "0" + num;
    }
    return num;
}

function generateStringForDate(events) {
    var data = "<div>";
    data += "<div class='event-in-day'>";
    data += "<span class='event-in-day-client'>" + events[0].clientname + "</span>";
    data += "<span class='event-in-day-descr'>" + events[0].description + "</span>";
    var eventTime = new Date(events[0].dt);
    data += "<span class='event-in-day-title'>Time : </span><span class='event-in-day-time'>" + numFmt(eventTime.getHours()) + ":" + numFmt(eventTime.getMinutes()) + "</span>";
    data += "</div>";
    if(events.length > 1) {
        data += "<div class='event-in-day'>";
        data += "<span class='event-in-day-client'>" + (events.length-1) + " more events</span>";
        data += "</div>";
    }
    return data;
}

app.directive("crmcalendar", ['$rootScope', function ($rootScope) {
    return {
        restrict: "E",
        templateUrl: "html/other/calendarInner.html",
        scope: {
            selected: "=",
            firstday: "="
        },
        link: function (scope) {
            
            scope.selected = _removeTime(moment());
            scope.month = scope.selected.clone();

            var start = scope.selected.clone();
            start.date(1);
            _removeDayTime(start.day(0));
            scope.eventList = {};
            scope.eventsHtml = {};
            $rootScope.httpRequest("getAllEvents", 'POST', {}, function (data) {
                if(!data.error) {
                    scope.eventList = data.data;
                    _.each(data.data, function (events, k) {
                        scope.eventsHtml[""+k] = generateStringForDate(events);
                    });
                    console.log(scope.eventsHtml);

                }
                else {
                    scope.error = data.error;
                    scope.message = data.message;
                }
                _buildMonth(scope, start, scope.month, scope.firstday);
            });

            scope.select = function (day) {
                scope.selected = day.date;
            };

            scope.next = function () {
                var next = scope.month.clone();
                _removeDayTime(next.month(next.month() + 1)).date(1);
                scope.month.month(scope.month.month() + 1);
                _buildMonth(scope, next, scope.month);
            };

            scope.previous = function () {
                var previous = scope.month.clone();
                _removeDayTime(previous.month(previous.month() - 1).date(1));
                scope.month.month(scope.month.month() - 1);
                _buildMonth(scope, previous, scope.month);
            };
        }
    };
}]);