var app = angular.module('crmApp', ['ngRoute', 'ngSanitize', 'ngAnimate', 'ngCookies']);

app.config(['$routeProvider', '$locationProvider', '$httpProvider',
    function ($routeProvider, $locationProvider, $httpProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/html/home.html',
                controller: 'homeController'
            });

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
                    if (data && !data.error) {
                        $rootScope.isLoggedIn = true;
                        //$rootScope.userInfo = data;
                    }
                });

            }
            else {

            }
        }
        getUserInfo(token);
        $scope.userLogin = function () {
            console.log($scope.login);
            if ($scope.login) {
                console.log($scope.login);
                var formData = {
                    customer: $scope.login.company,
                    login: $scope.login.username,
                    password: $scope.login.password
                };
                $rootScope.httpRequest("login", 'POST', formData, function (data) {
                    $scope.error = data.error;
                    $scope.message = data.message;
                    if (!data.error) {
                        var token = data.data.id;
                        console.log(token);
                        $cookies.put('token', token);
                        getUserInfo(token);
                    }
                });
            } else {
                $scope.message = 'Fields are required!';
            }
        };
        //var token = $cookies.get('token');
        //console.log(token);
        //if(token) {
        //    $rootScope.httpRequest('userInfo', 'POST', {}).success(function(data){
        //        if(!data.error && data.data && data.data.id) {
        //            var token = data.id;
        //        }
        //        else {
        //            console.log(data);
        //        }
        //    });
        //}
        //else {
        //    $rootScope.httpRequest('login', 'POST', {customer : 'admin', login : 'mark', password : 'q'}).success(function(data){
        //        if(!data.error && data.data && data.data.id) {
        //            var token = data.data.id;
        //            $cookies.put('token', token);
        //        }
        //        else {
        //            console.log(data);
        //        }
        //    });
        //}
    }
]);

app.controller('homeController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {
        
    }
]);