var app = angular.module('crmApp', ['ngRoute', 'ngSanitize', 'ngAnimate', 'ngCookies']);

app.config(['$routeProvider', '$locationProvider', '$httpProvider',
    function ($routeProvider, $locationProvider, $httpProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/html/home.html',
                controller: 'homeController'
            })
            .when("/schedule", {
                templateUrl: '/html/schedule.html',
                controller: 'scheduleController'
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

app.controller('scheduleController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {
        $scope.eventInfo = {};
        $scope.dayInfo = '';
        $(document).ready(function() {
            // page is ready
            $('#calendar').fullCalendar({
                //theme: true, uncomment when css is ready
                businessHours: false,
                weekends: true,
                firstDay: 1,
                editable: true,
                eventLimit: true,
                defaultView: 'month',
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,agendaWeek,agendaDay'
                },
                timeFormat: 'H(:mm)',
                events: [
                     {
                        title  : 'Meeting',
                        start  : '2016-08-16T11:30:00',
                        end    : '2016-08-18T012:30:00',
                        allDay: false
                    },
                    {
                        title  : 'Conference',
                        start  : '2016-08-18T16:30:00',
                        end    : '2016-08-18',
                        allDay : false
                    },
                    {
                        title  : 'Dentist',
                        start  : '2016-08-18T11:30:00',
                        end  : '2016-08-18T012:30:00',
                        user : 'Abul',
                        allDay : false
                    }
                ],
                eventClick: function(calEvent, jsEvent, view) {
                    $scope.eventInfo = calEvent;
                    $('#eventViewModal').modal('show');
                    console.log($scope.eventInfo);

                    console.log('Event: ', calEvent);
                    console.log('Coordinates: ' + jsEvent.pageX + ',' + jsEvent.pageY);
                    console.log('View: ', view);

                    // change the border color just for fun
                    $(this).css('border-color', 'red');

                },
                dayClick : function(date, jsEvent, view) {
                    $scope.dayInfo = date;
                    console.log($scope.dayInfo, typeof $scope.dayInfo);
                    $('#dayViewModal').modal('show');
                    if($(this).hasClass('active')) {
                        return false;
                    } else {
                        $('.fc-day').removeClass('active');
                        $(this).addClass('active');
                    }

                }
            })
        });

        //.fullCalendar( 'renderEvent', event, true ) add new Event to Calendar


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
    }
]);
