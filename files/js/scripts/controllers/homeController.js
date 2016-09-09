/**
 * Created by Mark Sarukhanov on 25.08.2016.
 */
app.controller('homeController', ['$http', '$scope', '$rootScope', 'socket', 'Upload',
    function($http, $scope, $rootScope, socket, Upload) {

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
        // socket.on('upcoming event added' + $rootScope.userInfo.customer, function (event) {
        //     $scope.upcomingEvents.push(event);
        // });

        $scope.submit = function(){ //function to call on form submit
            if ($scope.upload_form.file.$valid && $scope.file) { //check if from is valid
                $scope.upload($scope.file); //call upload function
            }
        };

        $scope.upload = function (file) {
            Upload.upload({
                url: location.href + 'uploadFile', //webAPI exposed to upload the file
                data:{file:file} //pass file as data, should be user ng-model
            }).then(function (resp) { //upload function returns a promise
                if(resp.data.error_code === 0){ //validate success
                    alert('Success ' + resp.config.data.file.name + 'uploaded. Response: ');
                } else {
                    alert('an error occured');
                }
            }, function (resp) { //catch error
                console.log('Error status: ' + resp.status);
                alert('Error status: ' + resp.status);
            }, function (evt) {
                console.log(evt);
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                $scope.progress = 'progress: ' + progressPercentage + '% '; // capture upload progress
            });
        };
        
    }
]);