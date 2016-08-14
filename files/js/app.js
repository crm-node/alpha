var app = angular.module('crmApp', ['ngRoute', 'ngSanitize', 'ngAnimate', 'ngCookies']);

app.config(['$routeProvider', '$locationProvider', '$httpProvider',
    function ($routeProvider, $locationProvider, $httpProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/html/home.html',
                controller: 'homeController'
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
                controller: 'homeController'
            })
            .when("/transaction/:id", {
                templateUrl: '/html/transaction.html',
                controller: 'homeController'
            })
            .when("/users", {
                templateUrl: '/html/home.html',
                controller: 'homeController'
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

app.controller('mainController', ['$http', '$routeParams', '$scope', '$rootScope', '$sce', '$cookies',
    function($http, $routeParams, $scope, $rootScope, $sce, $cookies) {

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
            $cookies.remove('token');
            $rootScope.isLoggedIn = false;
        };

        $scope.getClients = function() {
            $rootScope.httpRequest("getClients", 'POST', {}, function (data) {
                if(!data.error) {
                    $scope.clientList = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
        $scope.getClients();
    }
]);

app.controller('homeController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

    }
]);

app.controller('clientsController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

        $scope.addUserForm = {};
        $scope.clientList = [];

        $scope.getClients = function() {
            $rootScope.httpRequest("getClients", 'POST', {}, function (data) {
                if(!data.error) {
                    if($scope.clientList.length == 0) {
                        data.data['schema'].values.forEach(function(val){
                            $scope.addUserForm[''+val] = '';
                        });
                    }
                    $scope.clientList = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.addClient = function() {
            //console.log($scope.userAddForm);
            if($scope.userAddForm.$valid) {
                $rootScope.httpRequest("addClient", 'POST', {client_info : $scope.addUserForm}, function (data) {
                    if(!data.error) {
                        $scope.getClients();
                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                    }
                });
            }
        };


        $scope.userToDelete = '';
        $scope.prepareDeleteClient = function(id) {
            $scope.userToDelete = id;
        };
        $scope.deleteClient = function() {
            $rootScope.httpRequest("delClient", 'POST', {client_id : $scope.userToDelete}, function (data) {
                if(!data.error) {
                    $scope.getClients();
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
    }
]);