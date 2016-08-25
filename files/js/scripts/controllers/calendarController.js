/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller("calendarController", ['$http', '$scope', '$rootScope', '$filter', '$q', '$timeout', '$log', 'MaterialCalendarData', '$cookies', 'socket',
    function($http, $scope, $rootScope, $filter, $q, $timeout, $log, MaterialCalendarData, $cookies, socket) {

        $scope.selectedDate = new Date();
        $scope.weekStartsOn = 0;
        $scope.dayFormat = "d";
        $scope.tooltips = true;
        $scope.disableFutureDates = false;

        $scope.preAddDate = '';

        $scope.fullscreen = function() {
            var elem = document.querySelector("#calendar-demo");
            if(!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.msRequestFullscreen) {
                    elem.msRequestFullscreen();
                } else if (elem.mozRequestFullScreen) {
                    elem.mozRequestFullScreen();
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        };

        $scope.setDirection = function(direction) {
            $scope.direction = direction;
            $scope.dayFormat = direction === "vertical" ? "EEEE, MMMM d" : "d";
        };

        $scope.dayClick = function(date) {
            $scope.msg = "You clicked " + $filter("date")(date, "MMM d, y h:mm:ss a Z");

            $scope.preAddDate = date;
            $rootScope.httpRequest("getEvents", 'POST', {
                dt : date
            }, function (data) {
                if(!data.error) {
                    $scope.daysEventsList = data.data;
                    $('#daysEventsModal').modal('show');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });

        };

        $scope.prevMonth = function(data) {
            $scope.msg = "You clicked (prev) month " + data.month + ", " + data.year;
        };

        $scope.nextMonth = function(data) {
            $scope.msg = "You clicked (next) month " + data.month + ", " + data.year;
        };

        var loadContentAsync = true;
        $log.info("setDayContent.async", loadContentAsync);

        var numFmt = function(num) {
            num = num.toString();
            if (num.length < 2) {
                num = "0" + num;
            }
            return num;
        };

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

        $scope.setDayContent = function(date) {
            var key = [date.getDate(), date.getMonth()+1, date.getFullYear()].join("-");
            if(!$scope.eventList || $scope.eventList.length == 0) {
                $.ajax({
                    url: '/api/getAllEvents',
                    type: 'POST',
                    data: {},
                    async: false,
                    headers:  {
                        'Authorization': $cookies.get('token')
                    },
                    success: function(data) {
                        if(!data.error && data.data) {
                            $scope.eventList = data.data;
                        }
                        else {
                            $scope.error = data.error;
                            $scope.message = data.message;
                        }
                    }
                });
            }
            var data = '';
            if($scope.eventList[key]) {
                data = generateStringForDate($scope.eventList[key]);
            }
            var deferred = $q.defer();
            $timeout(function() {
                deferred.resolve(data);
            });
            return deferred.promise;
        };

        $scope.eventToAdd = {
            dt : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes())
        };
        $scope.eventList = [];
        $scope.eventToEdit = {};
        $scope.eventToDelete = '';

        $scope.getClients = function() {
            $rootScope.httpRequest("getClients", 'POST', {}, function (data) {
                if(!data.error && data.data && data.data['schema']) {
                    $scope.clientList = _.filter(data.data, function(item){ return item.id != 'schema'; });
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
        $scope.getClients();

        $scope.getUsers = function() {
            $rootScope.httpRequest("getUsers", 'POST', {}, function (data) {
                if(!data.error && data.data) {
                    $scope.doctorsList = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
        $scope.getUsers();

        $scope.getEvents = function() {
            $rootScope.httpRequest("getAllEvents", 'POST', {
                date : new Date()
            }, function (data) {
                if(!data.error && data.data) {
                    $scope.eventList = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.getUpcomingEvents = function() {
            $rootScope.httpRequest("getUpcomingEvents", 'POST', {}, function (data) {
                if(!data.error && data.data) {
                    $scope.eventList = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        socket.on('event added' + $rootScope.userInfo.customer, function (event) {
            var key = [new Date(event.dt).getDate(), new Date(event.dt).getMonth()+1, new Date(event.dt).getFullYear()].join("-");
            $scope.eventList[""+key].push(event);
            MaterialCalendarData.setDayContent(new Date(event.dt), generateStringForDate($scope.eventList[key]));
        });

        $scope.openAddEvent = function(date) {
            date = new Date(date);
            $scope.eventToAdd = {
                dt : new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes())
            };
            $('#addEventModal').modal('show');
        };
        $scope.addEvent = function() {
            if($scope.eventAddForm.$valid) {
                console.log($scope.eventToAdd);
                var formData = {
                    clientname : JSON.parse($scope.eventToAdd.client).FirstName + " " + JSON.parse($scope.eventToAdd.client).LastName,
                    client_id : JSON.parse($scope.eventToAdd.client).id,
                    description : $scope.eventToAdd.description,
                    doctorname : JSON.parse($scope.eventToAdd.doctor).name,
                    doctor_id : JSON.parse($scope.eventToAdd.doctor).id,
                    dt : $scope.eventToAdd.dt
                };
                $rootScope.httpRequest("addEvent", 'POST', {event : formData}, function (data) {
                    if(!data.error) {
                        $rootScope.httpRequest("getEvents", 'POST', {
                            dt : $scope.eventToAdd.dt
                        }, function (data) {
                            if(!data.error) {
                                $scope.daysEventsList = data.data;
                                $scope.eventToAdd = {
                                    dt : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes())
                                };
                                $scope.getEvents();
                                $('#addEventModal').modal('hide');
                            }
                            else {
                                $scope.error = data.error;
                                $scope.message = data.message;
                            }
                        });

                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                    }
                });
            }
        };

        $scope.prepareEditEvent = function(event) {
            $scope.eventToEdit = angular.copy(event);
        };
        $scope.editEvent = function() {
            $rootScope.httpRequest("editEvent", 'POST', {
                event_id : $scope.eventToEdit.id,
                event_info: $scope.eventToEdit
            }, function (data) {
                if(!data.error) {
                    $scope.eventToEdit = {};
                    $scope.getEvents();
                    $('#editEventModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.prepareDeleteEvent = function(id, login) {
            $scope.eventToDelete = {
                event_id : id,
                login : login
            };
        };
        $scope.deleteEvent = function() {
            $rootScope.httpRequest("delEvent", 'POST', {event_id : $scope.eventToDelete}, function (data) {
                if(!data.error) {
                    $scope.eventToDelete = '';
                    $scope.getEvents();
                    $('#confirmDeleteEventModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

    }
]);