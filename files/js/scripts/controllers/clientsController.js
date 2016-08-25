/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller('clientsController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

        $scope.clientToAdd = {};
        $scope.clientList = [];
        $scope.clientToEdit = {};
        $scope.clientToDelete = '';
        $scope.clientsSchema = {};
        $scope.schema = {};
        $scope.editSchema = {};

        $scope.sortType = ''; // set the default sort type
        $scope.sortReverse = false;  // set the default sort order
        $scope.new_field = {};

        $scope.changeSortType = function(field) {
            if($scope.sortType == field.field) {
                $scope.sortReverse = !$scope.sortReverse;
            }
            else {
                $scope.sortType = field.field;
                $scope.sortReverse = true;
            }
        };

        $scope.getClients = function() {
            $scope.clientList = [];
            $rootScope.httpRequest("getClients", 'POST', {}, function (data) {
                if(!data.error && data.data && data.data['schema']) {
                    $scope.schema = data.data['schema'];
                    $scope.clientsSchema = data.data['schema'].fields;
                    $scope.clientList = _.filter(data.data, function(item){ return item.id != 'schema'; });
                    $scope.changeSortType(_.find($scope.clientsSchema, function(item){return item.title=="Registration"}));
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.addClient = function() {
            if($scope.clientAddForm.$valid) {
                $rootScope.httpRequest("addClient", 'POST', {client_info : $scope.clientToAdd}, function (data) {
                    if(!data.error) {
                        $scope.clientToAdd = {};
                        $scope.getClients();
                        $('#addClientModal').modal('hide');
                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                    }
                });
            }
        };


        $scope.prepareDeleteClient = function(id) {
            $scope.clientToDelete = id;
        };
        $scope.deleteClient = function() {
            $rootScope.httpRequest("delClient", 'POST', {client_id : $scope.clientToDelete}, function (data) {
                if(!data.error) {
                    $scope.clientToDelete = '';
                    $scope.getClients();
                    $('#confirmDeleteClientModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };


        $scope.prepareEditClient = function(client) {
            $scope.clientToEdit = angular.copy(client);
        };
        $scope.editClient = function() {
            $rootScope.httpRequest("editClient", 'POST', {
                client_id : $scope.clientToEdit.id,
                client_info: $scope.clientToEdit
            }, function (data) {
                if(!data.error) {
                    $scope.clientToEdit = {};
                    $scope.getClients();
                    $('#editClientModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.prepareEditSchema = function() {
            $scope.editSchemaForm = angular.copy($scope.clientsSchema);
        };
        $scope.editSchema = function() {
            $scope.schema.fields = $scope.editSchemaForm;
            $rootScope.httpRequest("editClient", 'POST', {
                client_id : 'schema',
                client_info: $scope.schema
            }, function (data) {
                if(!data.error) {
                    $scope.editSchemaForm = {};
                    $scope.getClients();
                    $('#editClientsSchema').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
        $scope.addNewField = function () {
            $scope.new_field = {
                show : true,
                title : '',
                field : '',
                type : ''
            };
            console.log($scope.new_field);
        };
        $scope.cancelNewField = function () {
            $scope.new_field = {};
        };
        $scope.saveNewField = function () {
            $scope.new_field.field = $scope.new_field.title.replace(" ","");
            $scope.editSchemaForm = $scope.editSchemaForm.concat($scope.new_field);
            $scope.new_field = {};
            console.log($scope.editSchemaForm);
        };

        $scope.getClientTransactions = function(client) {
            $scope.clientForTransactions = client;
            $rootScope.httpRequest("clientTransactions", 'POST', {
                client_id : client.id
            }, function (data) {
                if(!data.error) {
                    $scope.clientForTransactions.transactions = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
    }
]);