/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller('customersController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

        $scope.customerToAdd = {};
        $scope.customerList = [];
        $scope.customerToEdit = {};
        $scope.customerToDelete = '';

        $scope.getCustomers = function() {
            $rootScope.httpRequest("getCustomers", 'POST', {}, function (data) {
                if(!data.error && data.data) {
                    $scope.customerList = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.addCustomer = function() {
            if($scope.customerAddForm.$valid) {
                $rootScope.httpRequest("addCustomer", 'POST', {customer_info : $scope.customerToAdd}, function (data) {
                    if(!data.error) {
                        $scope.customerToAdd = {};
                        $scope.getCustomers();
                        $('#addCustomerModal').modal('hide');
                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                    }
                });
            }
        };

        $scope.prepareEditCustomer = function(customer) {
            $scope.customerToEdit = angular.copy(customer);
        };
        $scope.editCustomer = function() {
            $rootScope.httpRequest("editCustomer", 'POST', {
                customer_id : $scope.customerToEdit.id,
                customer_info: $scope.customerToEdit
            }, function (data) {
                if(!data.error) {
                    $scope.customerToEdit = {};
                    $scope.getCustomers();
                    $('#editCustomerModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.prepareDeleteCustomer = function(id) {
            $scope.customerToDelete = {
                customer_id : id
            };
        };
        $scope.deleteCustomer = function() {
            $rootScope.httpRequest("delCustomer", 'POST', {customer_id : $scope.customerToDelete}, function (data) {
                if(!data.error) {
                    $scope.customerToDelete = '';
                    $scope.getCustomers();
                    $('#confirmDeleteCustomerModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
    }
]);