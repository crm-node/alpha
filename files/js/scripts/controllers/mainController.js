/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller('mainController', ['$http', '$routeParams', '$scope', '$rootScope', '$sce', '$cookies', '$location', 'socket','$timeout',
    function($http, $routeParams, $scope, $rootScope, $sce, $cookies, $location, socket,$timeout) {

        var token = $cookies.get('token');
       // if(!token && location.pathname!="/login") location.pathname="/login";

        $('.button-collapse').sideNav({
                menuWidth: 200, // Default is 240
                edge: 'left', // Choose the horizontal origin
                closeOnClick: true // Closes side-nav on <a> clicks, useful for Angular/Meteor
            }
        );
        $rootScope.isLoggedIn = false;
        $scope.login = {};


        $rootScope.upcomingEvent = {};

        function getUserInfo(token) {
            if (token) {
                $rootScope.getUserInfo(function (data) {
                    if (data && !data.error && data.data) {
                        $rootScope.isLoggedIn = true;
                        $rootScope.userInfo = data.data;
                        socket.on('upcoming event' + $rootScope.userInfo.customer, function (event) {
                            $rootScope.upcomingEvent = event;
                            var $toastContent = $('<span class="upcoming-toast">' +
                                '<span>Client Name : </span>' +
                                '<span>' + $rootScope.upcomingEvent.clientname + '</span>' +
                                '<span>Description : </span>' +
                                '<span>' + $rootScope.upcomingEvent.description + '</span>' +
                                '</span>');
                            Materialize.toast($toastContent, 5000);
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
                    if (data && !data.error) {
                        console.log(data.data)
                        var token = data.data.login;
                        $cookies.put('token', token);
                        //getUserInfo(token);
                        location.reload();
                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                        $timeout(function(){
                            $scope.message = '';
                        }, 3000);
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
                    // $location.path("/");
                    location.reload();
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
    }
]);