/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller('usersController', ['$http', '$scope', '$rootScope',
    function($http, $scope, $rootScope) {

        $scope.userToAdd = {};
        $scope.userList = [];
        $scope.userToEdit = {};
        $scope.userToDelete = '';

        $scope.getUsers = function() {
            $rootScope.httpRequest("getUsers", 'POST', {}, function (data) {
                if(!data.error && data.data) {
                    $scope.userList = data.data;
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.addUser = function() {
            if($scope.userAddForm.$valid) {
                $scope.userToAdd.customer = $rootScope.userInfo.customer;
                $rootScope.httpRequest("addUser", 'POST', {user_info : $scope.userToAdd}, function (data) {
                    if(!data.error) {
                        $scope.userToAdd = {};
                        $scope.getUsers();
                        $('#addUserModal').modal('hide');
                    }
                    else {
                        $scope.error = data.error;
                        $scope.message = data.message;
                    }
                });
            }
        };

        $scope.prepareEditUser = function(user) {
            $scope.userToEdit = angular.copy(user);
        };
        $scope.editUser = function() {
            $rootScope.httpRequest("editUser", 'POST', {
                user_id : $scope.userToEdit.id,
                user_info: $scope.userToEdit
            }, function (data) {
                if(!data.error) {
                    $scope.userToEdit = {};
                    $scope.getUsers();
                    $('#editUserModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };

        $scope.prepareDeleteUser = function(id, login) {
            $scope.userToDelete = {
                user_id : id,
                login : login
            };
        };
        $scope.deleteUser = function() {
            $rootScope.httpRequest("delUser", 'POST', {user_id : $scope.userToDelete}, function (data) {
                if(!data.error) {
                    $scope.userToDelete = '';
                    $scope.getUsers();
                    $('#confirmDeleteUserModal').modal('hide');
                }
                else {
                    $scope.error = data.error;
                    $scope.message = data.message;
                }
            });
        };
    }
]);