var app = angular.module('crmApp', ['ngRoute', 'ngSanitize', 'ngCookies']);

app.config(['$routeProvider', '$locationProvider', '$httpProvider',
    function ($routeProvider, $locationProvider, $httpProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/html/home.html',
                controller: 'homeController'
            })
            .when("/calendar", {
                templateUrl: '/html/material/calendar.html',
                controller: 'calendarController'
            })
            .when("/clients", {
                templateUrl: '/html/material/clients.html',
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
                templateUrl: '/html/material/users.html',
                controller: 'usersController'
            })
            //.when("/user/:id", {
            //    templateUrl: '/html/home.html',
            //    controller: 'homeController'
            //})
            .when("/customers", {
                templateUrl: '/html/customers.html',
                controller: 'customersController'
            })
            .when("/archive", {
                templateUrl: '/html/archive.html',
                controller: 'archiveController'
            })
            .when("/statistics", {
                templateUrl: '/html/statistics.html',
                controller: 'statisticsController'
            })
            .otherwise({ redirectTo: '/' });
        
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
        };
    }
]);









