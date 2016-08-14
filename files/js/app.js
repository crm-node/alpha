var app = angular.module('vilkaApp', ['ngRoute', 'ngSanitize', 'ngAnimate']);

app.config(['$routeProvider', '$locationProvider', '$httpProvider',
    function ($routeProvider, $locationProvider, $httpProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/html/home.html',
                controller: 'homeController'
            });
        $httpProvider.interceptors.push(['$q', '$location', '$cookieStore', function($q, $location, $cookieStore, $rootScope) {
            return {
                'request': function (config) {
                    config.headers = config.headers || {};
                    config.timeout = 15000;
                    var token = $cookieStore.get('token');
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
                            $cookieStore.remove('token');
                            break;
                        case 408 :
                        case -1 :
                            alert('Connection lost / timed out.');
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
app.run(['$rootScope', '$timeout',
    function($rootScope, $timeout) {

    }
]);

app.controller('mainController', ['$http', '$routeParams', '$scope', '$rootScope', '$sce', 'mainService',
    function($http, $routeParams, $scope, $rootScope, $sce, mainService) {
        
    }
]);

app.controller('homeController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

    }
]);