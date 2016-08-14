var app = angular.module('vilkaApp', ['ngRoute', 'ngSanitize', 'ngAnimate']);

app.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $routeProvider
            .when("/", {
                templateUrl: '/html/home.html',
                controller: 'homeController'
            })
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