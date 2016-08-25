/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller('archiveController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

        $scope.transactionList = [];
        $scope.visitList = [];

        $scope.sortType = 'dt'; // set the default sort type
        $scope.sortReverse = false;  // set the default sort order
        $scope.dateFrom = new Date();
        $scope.dateTill = new Date();

        $scope.changeSortType = function(field) {
            if($scope.sortType == field) {
                $scope.sortReverse = !$scope.sortReverse;
            }
            else {
                $scope.sortType = field;
                $scope.sortReverse = true;
            }
        };

        $scope.getArchiveTransactions = function() {
            $scope.transactionList = [];
            $rootScope.httpRequest("getFromArchive", 'POST', {
                type : 'transactions',
                dateFrom : $scope.dateFrom,
                dateTill : $scope.dateTill
            }, function (data) {
                if(!data.error && data.data) {
                    console.log(data)
                    $scope.transactionList = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.getArchiveVisits = function() {
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

        $scope.updateArchive = function(section) {
            console.log($scope.dateFrom, $scope.dateTill);
            switch (section) {
                case 'transactions':
                    $scope.getArchiveTransactions();
                    break;
                case 'visits':
                    $scope.getArchiveVisits();
                    break;
            }
        };

        $scope.changeArchiveSection = function(section) {
            switch (section) {
                case 'transactions':

                    break;
                case 'visits':

                    break;
            }
            $scope.currentSection = section;
            $scope.updateArchive(section);
        };
        $scope.changeArchiveSection('transactions');





    }
]);