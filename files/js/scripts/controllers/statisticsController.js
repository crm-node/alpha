/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller('statisticsController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

        $scope.stst = [];
        var months = ['January', 'February', 'March', 'April', 'May', 'June',  'July', 'August', 'September', 'October', 'November', 'December']
        $scope._now = {
            month : new Date().getMonth(),
            monthName : months[new Date().getMonth()],
            year : new Date().getFullYear()
        };
        $scope.formDataEvent = {
            month : new Date().getMonth(),
            monthName : months[new Date().getMonth()],
            year : new Date().getFullYear()
        };
        $scope.eventsMonth = function(type) {
            switch (type) {
                case 'prev':
                    if ($scope.formDataEvent.month > 1) {
                        $scope.formDataEvent.month--;
                        $scope.formDataEvent.monthName = months[$scope.formDataEvent.month];
                    }
                    else {
                        $scope.formDataEvent.month = 11;
                        $scope.formDataEvent.monthName = months[$scope.formDataEvent.month];
                        $scope.formDataEvent.year--;
                    }
                    break;
                case 'next':
                    if ($scope.formDataEvent.month < 11) {
                        $scope.formDataEvent.month++;
                        $scope.formDataEvent.monthName = months[$scope.formDataEvent.month];
                    }
                    else {
                        $scope.formDataEvent.month = 0;
                        $scope.formDataEvent.monthName = months[$scope.formDataEvent.month];
                        $scope.formDataEvent.year++;
                    }
                    break;
            }
            $scope.getEventsStats($scope.formDataEvent.month, $scope.formDataEvent.year)
        };

    }
]);