/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller('transactionsController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {
        $('.modal-trigger').leanModal({
            ready: function() {
                $('select').material_select()
            }
        });
        $scope.transactionToAdd = {};
        $scope.transactionList = [];
        $scope.transactionToEdit = {};
        $scope.transactionToDelete = '';

        $scope.sortType = 'dt'; // set the default sort type
        $scope.sortReverse = false;  // set the default sort order
        $scope.new_field = {};

        $scope.changeSortType = function(field) {
            if($scope.sortType == field) {
                $scope.sortReverse = !$scope.sortReverse;
            }
            else {
                $scope.sortType = field;
                $scope.sortReverse = true;
            }
        };
        $scope.getClients = function() {
            $rootScope.httpRequest("getClients", 'POST', {}, function (data) {
                if(data && !data.error && data.data && data.data['schema']) {
                    $scope.clientList = _.filter(data.data, function(item){ return item.id != 'schema'; });
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
        $scope.getClients();
        $scope.changeSortType('dt');
        $scope.getTransactions = function() {
            $scope.transactionList = [];
            $rootScope.httpRequest("getTransactions", 'POST', {}, function (data) {
                if(data && !data.error) {
                    $scope.transactionList = _.filter(data.data, function(item){ return item.id != 'schema'; });
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.getTransactionsByDate = function() {
            $rootScope.httpRequest("getTransactionsByDate", 'POST', {
                dt_from : new Date(),
                dt_till : new Date()
            }, function (data) {
                if(data && !data.error) {
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.addTransaction = function(type) {
            if($scope.transactionAddForm.$valid) {
                if($scope.transactionToAdd.type != 'Client paid') $scope.transactionToAdd.client = undefined;
                else {
                    $scope.transactionToAdd.client = {
                        client_id : JSON.parse($scope.transactionToAdd.client).id,
                        client_name : JSON.parse($scope.transactionToAdd.client).FirstName + ' ' + JSON.parse($scope.transactionToAdd.client).LastName
                    };
                }
                $scope.transactionToAdd.customer = $rootScope.userInfo.customer;
                $scope.transactionToAdd.user_id = $rootScope.userInfo.id;
                $scope.transactionToAdd.user_name = $rootScope.userInfo.name;
                $scope.transactionToAdd.amount = (type=='input' ? 1 : -1) * $scope.transactionToAdd.amount;
                $rootScope.httpRequest("addTransaction", 'POST', $scope.transactionToAdd, function (data) {
                    if(data && !data.error) {
                        $scope.transactionToAdd = {};
                        $scope.getTransactions();
                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                    }
                });
            }
        };

        $scope.prepareEditTransaction = function(transaction) {
            $scope.transactionToEdit = angular.copy(transaction);
        };
        $scope.editTransaction = function() {
            $rootScope.httpRequest("editTransaction", 'POST', $scope.transactionToEdit, function (data) {
                if(data && !data.error) {
                    $scope.transactionToEdit = {};
                    $scope.getTransactions();
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.prepareDeleteTransaction = function(id, login) {
            $scope.transactionToDelete = {
                transaction_id : id,
                login : login
            };
        };
        $scope.deleteTransaction = function() {
            $rootScope.httpRequest("delTransaction", 'POST', $scope.transactionToDelete, function (data) {
                if(data && !data.error) {
                    $scope.transactionToDelete = '';
                    $scope.getTransactions();
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

    }
]);