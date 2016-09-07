/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller('homeController', ['$http', '$scope', '$rootScope', 'socket',
    function($http, $scope, $rootScope, socket) {

        $scope.getUpcomingEvents = function() {
            $scope.upcomingEvents = [];
            $rootScope.httpRequest("getUpcomingEvents", 'POST', {
                date: new Date()
            }, function (data) {
                if(!data.error && data.data) {
                    $scope.upcomingEvents = _.map(data.data, function(item){ return item; });
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
        socket.on('upcoming event added' + $rootScope.userInfo.customer, function (event) {
            $scope.upcomingEvents.push(event);
        });
        
        
    }
]);