/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller('mainController', ['$http', '$routeParams', '$scope', '$rootScope', '$sce', '$cookies', '$location', 'socket','$timeout',
    function($http, $routeParams, $scope, $rootScope, $sce, $cookies, $location, socket,$timeout) {

        $rootScope.isLoggedIn = false;
        $scope.login = {};

        var token = $cookies.get('token');
        $rootScope.upcomingEvent = {};

        function getUserInfo(token) {
            if (token) {
                $rootScope.getUserInfo(function (data) {
                    console.log(data);
                    if (data && !data.error && data.data) {
                        $rootScope.isLoggedIn = true;
                        $rootScope.userInfo = data.data;
                        socket.on('upcoming event' + $rootScope.userInfo.customer, function (event) {
                            $rootScope.upcomingEvent = event;
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
        console.log(token)
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
                        var token = data.data.id;
                        $cookies.put('token', token);
                        getUserInfo(token);
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