var app = angular.module('crmApp', ['ngRoute', 'ngSanitize', 'ngAnimate', 'ngCookies','ngMaterial', 'materialCalendar']);

app.config(['$routeProvider', '$locationProvider', '$httpProvider',
    function ($routeProvider, $locationProvider, $httpProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/html/home.html',
                controller: 'homeController'
            })
            .when("/calendar", {
                templateUrl: '/html/calendar.html',
                controller: 'calendarCtrl'
            })
            .when("/clients", {
                templateUrl: '/html/clients.html',
                controller: 'clientsController'
            })
            //.when("/client/:id", {
            //    templateUrl: '/html/client.html',
            //    controller: 'homeController'
            //})
            .when("/transactions", {
                templateUrl: '/html/transactions.html',
                controller: 'transactionsController'
            })
            //.when("/transaction/:id", {
            //    templateUrl: '/html/transaction.html',
            //    controller: 'homeController'
            //})
            .when("/users", {
                templateUrl: '/html/users.html',
                controller: 'usersController'
            })
            //.when("/user/:id", {
            //    templateUrl: '/html/home.html',
            //    controller: 'homeController'
            //})
            .when("/archive", {
                templateUrl: '/html/archive.html',
                controller: 'archiveController'
            })
        ;
        $httpProvider.interceptors.push(['$q', '$location', '$cookies', '$rootScope', function($q, $location, $cookies, $rootScope) {
            return {
                'request': function (config) {
                    config.headers = config.headers || {};
                    config.timeout = 15000;
                    var token = $cookies.get('token');
                    if (token) {
                        config.headers.Authorization = token;
                    }
                    return config;
                },
                'responseError': function(response) {
                    switch (response.status) {
                        case 401:
                        case 403:
                            $rootScope.isLoggedIn = false;
                            $cookies.remove('token');
                            break;
                        case 408 :
                        case -1 :
                            //alert('Connection lost / timed out.');
                            break;
                    }
                    return $q.reject(response);
                }
            };
        }]);
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    }
]);
app.config(function($mdThemingProvider) {
    $mdThemingProvider
        .theme("default")
        .primaryPalette("pink")
});
app.run(['$rootScope', '$timeout', '$http','$cookies',
    function($rootScope, $timeout, $http,$cookies) {
        $rootScope.httpRequest = function(path, method, obj, callback) {
            return $http({
                url: '/api/' + path,
                method: method,
                data: obj
            }).success(callback).error(callback);
        };
        $rootScope.getUserInfo = function(callback) {
            var token = $cookies.get('token');
            $http({
                method: 'POST',
                timeout: 15000,
                url: '/api/userInfo',
                headers:  {
                    'Authorization': token
                }
            }).success(callback);
        };
    }
]);
app.factory('socket', function ($rootScope) {
    var socket = io.connect('http://localhost:999');
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});
app.controller('mainController', ['$http', '$routeParams', '$scope', '$rootScope', '$sce', '$cookies', '$location', 'socket',
    function($http, $routeParams, $scope, $rootScope, $sce, $cookies, $location, socket) {

        $rootScope.isLoggedIn = false;
        $scope.login = {};

        var token = $cookies.get('token');
        $rootScope.upcomingEvent = {};

        function getUserInfo(token) {
            if (token) {
                $rootScope.getUserInfo(function (data) {
                    if (data && !data.error && data.data) {
                        $rootScope.isLoggedIn = true;
                        $rootScope.userInfo = data.data;
                        socket.on('upcoming event' + $rootScope.userInfo.customer, function (event) {
                            $rootScope.upcomingEvent = event;
                            console.log($rootScope.upcomingEvent);
                            $('#upcomingEventModal').modal('show');
                        });
                    }
                    else {
                        $rootScope.isLoggedIn = false;
                    }
                });
            }
            else {

            }
        }
        getUserInfo(token);
        $scope.userLogin = function () {
            if ($scope.login) {
                var formData = {
                    customer: $scope.login.company,
                    login: $scope.login.username,
                    password: $scope.login.password
                };
                $rootScope.httpRequest("login", 'POST', formData, function (data) {
                    if (!data.error) {
                        var token = data.data.id;
                        $cookies.put('token', token);
                        getUserInfo(token);
                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                    }
                });
            } else {
                $scope.message = 'Fields are required!';
            }
        };
        $scope.logout = function () {
            $rootScope.httpRequest("logout", 'POST', {}, function (data) {
                if(!data.error) {
                    $cookies.remove('token');
                    $rootScope.isLoggedIn = false;
                    $location.path("/");
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
    }
]);

app.controller('homeController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

        $scope.getUpcomingEvents = function() {
            $rootScope.httpRequest("getUpcomingEvents", 'POST', {
                date: new Date()
            }, function (data) {
                if(!data.error && data.data) {
                    $scope.upcomingEvents = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

    }
]);

app.controller('clientsController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

        $scope.clientToAdd = {};
        $scope.clientList = [];
        $scope.clientToEdit = {};
        $scope.clientToDelete = '';
        $scope.clientsSchema = {};
        $scope.schema = {};
        $scope.editSchema = {};

        $scope.sortType = ''; // set the default sort type
        $scope.sortReverse = false;  // set the default sort order
        $scope.new_field = {};
        
        $scope.changeSortType = function(field) {
            if($scope.sortType == field.field) {
                $scope.sortReverse = !$scope.sortReverse;
            }
            else {
                $scope.sortType = field.field;
                $scope.sortReverse = true;
            }
        };

        $scope.getClients = function() {
            $scope.clientList = [];
            $rootScope.httpRequest("getClients", 'POST', {}, function (data) {
                if(!data.error && data.data && data.data['schema']) {
                    $scope.schema = data.data['schema'];
                    $scope.clientsSchema = data.data['schema'].fields;
                    $scope.clientList = _.filter(data.data, function(item){ return item.id != 'schema'; });
                    $scope.changeSortType(_.find($scope.clientsSchema, function(item){return item.title=="Registration"}));
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.addClient = function() {
            if($scope.clientAddForm.$valid) {
                $rootScope.httpRequest("addClient", 'POST', {client_info : $scope.clientToAdd}, function (data) {
                    if(!data.error) {
                        $scope.clientToAdd = {};
                        $scope.getClients();
                        $('#addClientModal').modal('hide');
                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                    }
                });
            }
        };


        $scope.prepareDeleteClient = function(id) {
            $scope.clientToDelete = id;
        };
        $scope.deleteClient = function() {
            $rootScope.httpRequest("delClient", 'POST', {client_id : $scope.clientToDelete}, function (data) {
                if(!data.error) {
                    $scope.clientToDelete = '';
                    $scope.getClients();
                    $('#confirmDeleteClientModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        
        $scope.prepareEditClient = function(client) {
            $scope.clientToEdit = angular.copy(client);
        };
        $scope.editClient = function() {
            $rootScope.httpRequest("editClient", 'POST', {
                client_id : $scope.clientToEdit.id,
                client_info: $scope.clientToEdit
            }, function (data) {
                if(!data.error) {
                    $scope.clientToEdit = {};
                    $scope.getClients();
                    $('#editClientModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
        
        $scope.prepareEditSchema = function() {
            $scope.editSchemaForm = angular.copy($scope.clientsSchema);
        };
        $scope.editSchema = function() {
            $scope.schema.fields = $scope.editSchemaForm;
            $rootScope.httpRequest("editClient", 'POST', {
                client_id : 'schema',
                client_info: $scope.schema
            }, function (data) {
                if(!data.error) {
                    $scope.editSchemaForm = {};
                    $scope.getClients();
                    $('#editClientsSchema').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
        $scope.addNewField = function () {
            $scope.new_field = {
                show : true,
                title : '',
                field : '',
                type : ''
            };
            console.log($scope.new_field);
        };
        $scope.cancelNewField = function () {
            $scope.new_field = {};
        };
        $scope.saveNewField = function () {
            $scope.new_field.field = $scope.new_field.title.replace(" ","");
            $scope.editSchemaForm = $scope.editSchemaForm.concat($scope.new_field);
            $scope.new_field = {};
            console.log($scope.editSchemaForm);
        };

        $scope.getClientTransactions = function(client) {
            $scope.clientForTransactions = client;
            $rootScope.httpRequest("clientTransactions", 'POST', {
                client_id : client.id
            }, function (data) {
                if(!data.error) {
                    $scope.clientForTransactions.transactions = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
    }
]);

app.controller('usersController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {
        
        $scope.userToAdd = {};
        $scope.userList = [];
        $scope.userToEdit = {};
        $scope.userToDelete = '';

        $scope.getUsers = function() {
            $rootScope.httpRequest("getUsers", 'POST', {}, function (data) {
                if(!data.error && data.data) {
                    $scope.userList = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.addUser = function() {
            if($scope.userAddForm.$valid) {
                $scope.userToAdd.customer = $rootScope.userInfo.customer;
                $rootScope.httpRequest("addUser", 'POST', {user_info : $scope.userToAdd}, function (data) {
                    if(!data.error) {
                        $scope.userToAdd = {};
                        $scope.getUsers();
                        $('#addUserModal').modal('hide');
                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                    }
                });
            }
        };
        
        $scope.prepareEditUser = function(user) {
            $scope.userToEdit = angular.copy(user);
        };
        $scope.editUser = function() {
            $rootScope.httpRequest("editUser", 'POST', {
                user_id : $scope.userToEdit.id,
                user_info: $scope.userToEdit
            }, function (data) {
                if(!data.error) {
                    $scope.userToEdit = {};
                    $scope.getUsers();
                    $('#editUserModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
        
        $scope.prepareDeleteUser = function(id, login) {
            $scope.userToDelete = {
                user_id : id,
                login : login
            };
        };
        $scope.deleteUser = function() {
            $rootScope.httpRequest("delUser", 'POST', {user_id : $scope.userToDelete}, function (data) {
                if(!data.error) {
                    $scope.userToDelete = '';
                    $scope.getUsers();
                    $('#confirmDeleteUserModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
    }
]);

app.controller("calendarCtrl", ['$http', '$scope', '$rootScope', '$filter', '$q', '$timeout', '$log', 'MaterialCalendarData', '$cookies', 'socket',
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
                $rootScope.httpRequest("addEvent", 'POST', {event : $scope.eventToAdd}, function (data) {
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


app.controller('transactionsController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

        $scope.transactionToAdd = {};
        $scope.transactionList = [];
        $scope.transactionToEdit = {};
        $scope.transactionToDelete = '';

        $scope.sortType = 'dt'; // set the default sort type
        $scope.sortReverse = false;  // set the default sort order
        $scope.new_field = {};

        $scope.changeSortType = function(field) {
            if($scope.sortType == field) {
                $scope.sortReverse = !$scope.sortReverse;
            }
            else {
                $scope.sortType = field;
                $scope.sortReverse = true;
            }
        };
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
        
        $scope.getTransactions = function() {
            $scope.transactionList = [];
            $rootScope.httpRequest("getTransactions", 'POST', {}, function (data) {
                if(!data.error && data.data) {
                    $scope.transactionList = _.filter(data.data, function(item){ return item.id != 'schema'; });
                    $scope.changeSortType('dt');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.addTransaction = function(type) {
            if($scope.transactionAddForm.$valid) {
                if($scope.transactionToAdd.type != 'Client paid') $scope.transactionToAdd.client = undefined;
                else {
                    $scope.transactionToAdd.client = {
                        client_id : JSON.parse($scope.transactionToAdd.client).id,
                        client_name : JSON.parse($scope.transactionToAdd.client).FirstName + ' ' + JSON.parse($scope.transactionToAdd.client).LastName
                    };
                }
                $scope.transactionToAdd.customer = $rootScope.userInfo.customer;
                $scope.transactionToAdd.user_id = $rootScope.userInfo.id;
                $scope.transactionToAdd.user_name = $rootScope.userInfo.name;
                $scope.transactionToAdd.amount = (type=='input' ? 1 : -1) * $scope.transactionToAdd.amount;
                $rootScope.httpRequest("addTransaction", 'POST', {transaction_info : $scope.transactionToAdd}, function (data) {
                    if(!data.error) {
                        $scope.transactionToAdd = {};
                        $scope.getTransactions();
                        $('#addTransactionModalIn').modal('hide');
                        $('#addTransactionModalOut').modal('hide');
                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                    }
                });
            }
        };

        $scope.prepareEditTransaction = function(transaction) {
            $scope.transactionToEdit = angular.copy(transaction);
        };
        $scope.editTransaction = function() {
            $rootScope.httpRequest("editTransaction", 'POST', {
                transaction_id : $scope.transactionToEdit.id,
                transaction_info: $scope.transactionToEdit
            }, function (data) {
                if(!data.error) {
                    $scope.transactionToEdit = {};
                    $scope.getTransactions();
                    $('#editTransactionModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.prepareDeleteTransaction = function(id, login) {
            $scope.transactionToDelete = {
                transaction_id : id,
                login : login
            };
        };
        $scope.deleteTransaction = function() {
            $rootScope.httpRequest("delTransaction", 'POST', {transaction_id : $scope.transactionToDelete}, function (data) {
                if(!data.error) {
                    $scope.transactionToDelete = '';
                    $scope.getTransactions();
                    $('#confirmDeleteTransactionModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
        
        $scope.sendToArchive = function() {
            $scope.transactionList = [];
            $rootScope.httpRequest("sendToArchive", 'POST', {type : 'transactions'}, function (data) {
                if(!data.error && data.data) {
                    $scope.getTransactions();
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        }
    }
]);

app.controller('archiveController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

        $scope.transactionList = [];
        $scope.visitList = [];

        $scope.sortType = 'dt'; // set the default sort type
        $scope.sortReverse = false;  // set the default sort order
        $scope.dateFrom = new Date();
        $scope.dateTill = new Date();

        $scope.changeSortType = function(field) {
            if($scope.sortType == field) {
                $scope.sortReverse = !$scope.sortReverse;
            }
            else {
                $scope.sortType = field;
                $scope.sortReverse = true;
            }
        };

        $scope.getArchiveTransactions = function() {
            $scope.transactionList = [];
            $rootScope.httpRequest("getFromArchive", 'POST', {
                type : 'transactions',
                dateFrom : $scope.dateFrom, 
                dateTill : $scope.dateTill
            }, function (data) {
                if(!data.error && data.data) {
                    console.log(data)
                    $scope.transactionList = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.getArchiveVisits = function() {
            $scope.transactionList = [];
            $rootScope.httpRequest("getTransactions", 'POST', {}, function (data) {
                if(!data.error && data.data) {
                    $scope.transactionList = _.filter(data.data, function(item){ return item.id != 'schema'; });
                    $scope.changeSortType('dt');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.updateArchive = function(section) {
            console.log($scope.dateFrom, $scope.dateTill);
            switch (section) {
                case 'transactions':
                    $scope.getArchiveTransactions();
                    break;
                case 'visits':
                    $scope.getArchiveVisits();
                    break;
            }
        };

        $scope.changeArchiveSection = function(section) {
            switch (section) {
                case 'transactions':

                    break;
                case 'visits':

                    break;
            }
            $scope.currentSection = section;
            $scope.updateArchive(section);
        };
        $scope.changeArchiveSection('transactions');





    }
]);
