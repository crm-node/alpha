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
            .when("/client/:id", {
                templateUrl: '/html/client.html',
                controller: 'homeController'
            })
            .when("/transactions", {
                templateUrl: '/html/transactions.html',
                controller: 'transactionsController'
            })
            .when("/transaction/:id", {
                templateUrl: '/html/transaction.html',
                controller: 'homeController'
            })
            .when("/users", {
                templateUrl: '/html/users.html',
                controller: 'usersController'
            })
            .when("/user/:id", {
                templateUrl: '/html/home.html',
                controller: 'homeController'
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
        }
    }
]);

app.controller('mainController', ['$http', '$routeParams', '$scope', '$rootScope', '$sce', '$cookies', '$location',
    function($http, $routeParams, $scope, $rootScope, $sce, $cookies, $location) {

        $rootScope.isLoggedIn = false;
        $scope.login = {};

        var token = $cookies.get('token');

        function getUserInfo(token) {
            if (token) {
                $rootScope.getUserInfo(function (data) {
                    if (data && !data.error && data.data) {
                        console.log(data);
                        $rootScope.isLoggedIn = true;
                        $rootScope.userInfo = data.data;
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

app.controller("calendarCtrl", function($scope, $filter, $q, $timeout, $log, MaterialCalendarData) {

    $scope.selectedDate = new Date();
    $scope.weekStartsOn = 0;
    $scope.dayFormat = "d";
    $scope.tooltips = true;
    $scope.disableFutureDates = false;

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
        console.log($scope.msg);
    };

    $scope.prevMonth = function(data) {
        $scope.msg = "You clicked (prev) month " + data.month + ", " + data.year;
    };

    $scope.nextMonth = function(data) {
        $scope.msg = "You clicked (next) month " + data.month + ", " + data.year;
    };

    $scope.setContentViaService = function() {
        var today = new Date();
        MaterialCalendarData.setDayContent(today, '<span> :oD </span>')
    }

    var holidays = {"2015-01-01":[{"name":"Last Day of Kwanzaa","country":"US","date":"2015-01-01"},{"name":"New Year's Day","country":"US","date":"2015-01-01"}],"2015-01-06":[{"name":"Epiphany","country":"US","date":"2015-01-06"}],"2015-01-07":[{"name":"Orthodox Christmas","country":"US","date":"2015-01-07"}],"2015-01-19":[{"name":"Martin Luther King, Jr. Day","country":"US","date":"2015-01-19"}],"2015-02-02":[{"name":"Groundhog Day","country":"US","date":"2015-02-02"}],"2015-02-14":[{"name":"Valentine's Day","country":"US","date":"2015-02-14"}],"2015-02-16":[{"name":"Washington's Birthday","country":"US","date":"2015-02-16"}],"2015-02-18":[{"name":"Ash Wednesday","country":"US","date":"2015-02-18"}],"2015-03-08":[{"name":"International Women's Day","country":"US","date":"2015-03-08"}],"2015-03-17":[{"name":"Saint Patrick's Day","country":"US","date":"2015-03-17"}],"2015-03-29":[{"name":"Palm Sunday","country":"US","date":"2015-03-29"}],"2015-04-01":[{"name":"April Fools' Day","country":"US","date":"2015-04-01"}],"2015-04-03":[{"name":"Good Friday","country":"US","date":"2015-04-03"}],"2015-04-05":[{"name":"Easter","country":"US","date":"2015-04-05"}],"2015-04-22":[{"name":"Earth Day","country":"US","date":"2015-04-22"}],"2015-04-24":[{"name":"Arbor Day","country":"US","date":"2015-04-24"}],"2015-05-01":[{"name":"May Day","country":"US","date":"2015-05-01"}],"2015-05-04":[{"name":"Star Wars Day","country":"US","date":"2015-05-04"}],"2015-05-05":[{"name":"Cinco de Mayo","country":"US","date":"2015-05-05"}],"2015-05-10":[{"name":"Mother's Day","country":"US","date":"2015-05-10"}],"2015-05-25":[{"name":"Memorial Day","country":"US","date":"2015-05-25"}],"2015-06-14":[{"name":"Flag Day","country":"US","date":"2015-06-14"}],"2015-06-21":[{"name":"Father's Day","country":"US","date":"2015-06-21"}],"2015-06-27":[{"name":"Helen Keller Day","country":"US","date":"2015-06-27"}],"2015-07-04":[{"name":"Independence Day","country":"US","date":"2015-07-04"}],"2015-08-26":[{"name":"Women's Equality Day","country":"US","date":"2015-08-26"}],"2015-09-07":[{"name":"Labor Day","country":"US","date":"2015-09-07"}],"2015-09-11":[{"name":"Patriot Day","country":"US","date":"2015-09-11"}],"2015-09-13":[{"name":"Grandparent's Day","country":"US","date":"2015-09-13"}],"2015-09-17":[{"name":"Constitution Day","country":"US","date":"2015-09-17"}],"2015-10-06":[{"name":"German-American Day","country":"US","date":"2015-10-06"}],"2015-10-09":[{"name":"Leif Erkson Day","country":"US","date":"2015-10-09"}],"2015-10-12":[{"name":"Columbus Day","country":"US","date":"2015-10-12"}],"2015-10-31":[{"name":"Halloween","country":"US","date":"2015-10-31"}],"2015-11-03":[{"name":"Election Day","country":"US","date":"2015-11-03"}],"2015-11-11":[{"name":"Veterans Day","country":"US","date":"2015-11-11"}],"2015-11-26":[{"name":"Thanksgiving Day","country":"US","date":"2015-11-26"}],"2015-11-27":[{"name":"Black Friday","country":"US","date":"2015-11-27"}],"2015-12-07":[{"name":"Pearl Harbor Remembrance Day","country":"US","date":"2015-12-07"}],"2015-12-08":[{"name":"Immaculate Conception of the Virgin Mary","country":"US","date":"2015-12-08"}],"2015-12-24":[{"name":"Christmas Eve","country":"US","date":"2015-12-24"}],"2015-12-25":[{"name":"Christmas","country":"US","date":"2015-12-25"}],"2015-12-26":[{"name":"First Day of Kwanzaa","country":"US","date":"2015-12-26"}],"2015-12-27":[{"name":"Second Day of Kwanzaa","country":"US","date":"2015-12-27"}],"2015-12-28":[{"name":"Third Day of Kwanzaa","country":"US","date":"2015-12-28"}],"2015-12-29":[{"name":"Fourth Day of Kwanzaa","country":"US","date":"2015-12-29"}],"2015-12-30":[{"name":"Fifth Day of Kwanzaa","country":"US","date":"2015-12-30"}],"2015-12-31":[{"name":"New Year's Eve","country":"US","date":"2015-12-31"},{"name":"Sixth Day of Kwanzaa","country":"US","date":"2015-12-31"}],"2016-01-01":[{"name":"Last Day of Kwanzaa","country":"US","date":"2016-01-01"},{"name":"New Year's Day","country":"US","date":"2016-01-01"}],"2016-01-06":[{"name":"Epiphany","country":"US","date":"2016-01-06"}],"2016-01-07":[{"name":"Orthodox Christmas","country":"US","date":"2016-01-07"}],"2016-01-18":[{"name":"Martin Luther King, Jr. Day","country":"US","date":"2016-01-18"}],"2016-02-02":[{"name":"Groundhog Day","country":"US","date":"2016-02-02"}],"2016-02-10":[{"name":"Ash Wednesday","country":"US","date":"2016-02-10"}],"2016-02-14":[{"name":"Valentine's Day","country":"US","date":"2016-02-14"}],"2016-02-15":[{"name":"Washington's Birthday","country":"US","date":"2016-02-15"}],"2016-03-08":[{"name":"International Women's Day","country":"US","date":"2016-03-08"}],"2016-03-17":[{"name":"Saint Patrick's Day","country":"US","date":"2016-03-17"}],"2016-03-20":[{"name":"Palm Sunday","country":"US","date":"2016-03-20"}],"2016-03-25":[{"name":"Good Friday","country":"US","date":"2016-03-25"}],"2016-03-27":[{"name":"Easter","country":"US","date":"2016-03-27"}],"2016-04-01":[{"name":"April Fools' Day","country":"US","date":"2016-04-01"}],"2016-04-22":[{"name":"Earth Day","country":"US","date":"2016-04-22"}],"2016-04-29":[{"name":"Arbor Day","country":"US","date":"2016-04-29"}],"2016-05-01":[{"name":"May Day","country":"US","date":"2016-05-01"}],"2016-05-04":[{"name":"Star Wars Day","country":"US","date":"2016-05-04"}],"2016-05-05":[{"name":"Cinco de Mayo","country":"US","date":"2016-05-05"}],"2016-05-08":[{"name":"Mother's Day","country":"US","date":"2016-05-08"}],"2016-05-30":[{"name":"Memorial Day","country":"US","date":"2016-05-30"}],"2016-06-14":[{"name":"Flag Day","country":"US","date":"2016-06-14"}],"2016-06-19":[{"name":"Father's Day","country":"US","date":"2016-06-19"}],"2016-06-27":[{"name":"Helen Keller Day","country":"US","date":"2016-06-27"}],"2016-07-04":[{"name":"Independence Day","country":"US","date":"2016-07-04"}],"2016-08-26":[{"name":"Women's Equality Day","country":"US","date":"2016-08-26"}],"2016-09-05":[{"name":"Labor Day","country":"US","date":"2016-09-05"}],"2016-09-11":[{"name":"Grandparent's Day","country":"US","date":"2016-09-11"},{"name":"Patriot Day","country":"US","date":"2016-09-11"}],"2016-09-17":[{"name":"Constitution Day","country":"US","date":"2016-09-17"}],"2016-10-06":[{"name":"German-American Day","country":"US","date":"2016-10-06"}],"2016-10-09":[{"name":"Leif Erkson Day","country":"US","date":"2016-10-09"}],"2016-10-10":[{"name":"Columbus Day","country":"US","date":"2016-10-10"}],"2016-10-31":[{"name":"Halloween","country":"US","date":"2016-10-31"}],"2016-11-08":[{"name":"Election Day","country":"US","date":"2016-11-08"},{"name":"Super Tuesday","country":"US","date":"2016-11-08"}],"2016-11-11":[{"name":"Veterans Day","country":"US","date":"2016-11-11"}],"2016-11-24":[{"name":"Thanksgiving Day","country":"US","date":"2016-11-24"}],"2016-11-25":[{"name":"Black Friday","country":"US","date":"2016-11-25"}],"2016-12-07":[{"name":"Pearl Harbor Remembrance Day","country":"US","date":"2016-12-07"}],"2016-12-08":[{"name":"Immaculate Conception of the Virgin Mary","country":"US","date":"2016-12-08"}],"2016-12-24":[{"name":"Christmas Eve","country":"US","date":"2016-12-24"}],"2016-12-25":[{"name":"Christmas","country":"US","date":"2016-12-25"}],"2016-12-26":[{"name":"First Day of Kwanzaa","country":"US","date":"2016-12-26"}],"2016-12-27":[{"name":"Second Day of Kwanzaa","country":"US","date":"2016-12-27"}],"2016-12-28":[{"name":"Third Day of Kwanzaa","country":"US","date":"2016-12-28"}],"2016-12-29":[{"name":"Fourth Day of Kwanzaa","country":"US","date":"2016-12-29"}],"2016-12-30":[{"name":"Fifth Day of Kwanzaa","country":"US","date":"2016-12-30"}],"2016-12-31":[{"name":"New Year's Eve","country":"US","date":"2016-12-31"},{"name":"Sixth Day of Kwanzaa","country":"US","date":"2016-12-31"}]};

    // You would inject any HTML you wanted for
    // that particular date here.
    var numFmt = function(num) {
        num = num.toString();
        if (num.length < 2) {
            num = "0" + num;
        }
        return num;
    };

    var loadContentAsync = true;
    $log.info("setDayContent.async", loadContentAsync);
    console.log(loadContentAsync);
    $scope.setDayContent = function(date) {

        var key = [date.getFullYear(), numFmt(date.getMonth()+1), numFmt(date.getDate())].join("-");
        var data = (holidays[key]||[{ name: ""}])[0].name;
        if (loadContentAsync) {
            var deferred = $q.defer();
            $timeout(function() {
                deferred.resolve(data);
            });
            return deferred.promise;
        }

        return data;

    };

});


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
    }
]);
