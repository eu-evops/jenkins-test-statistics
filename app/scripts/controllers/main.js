'use strict';

/**
 * @ngdoc function
 * @name testReporterApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the testReporterApp
 */
angular.module('testReporterApp')
  .controller('MainCtrl', [
    '$scope', '$rootScope', 'jenkins', 'localStorageService', 'configuration', 'ngTableParams', 'jenkinsServers', '$location',
    function ($scope, $rootScope, jenkins, storage, configuration, ngTableParams, jenkinsServers, $location) {

      console.log($rootScope.redirectTo);

      $scope.$watch('search', function (newValue, oldValue) {
        console.log(arguments);
      });

      $scope.search = 'PMD';
      $scope.search = 'Sauce';

      $scope.jenkins = configuration.get('jenkins') || {
          server: jenkinsServers[0]
        };

      $scope.jenkinsServers = jenkinsServers;

      $scope.authenticate = function () {
        if (!$scope.jenkins.username) return;
        if (!$scope.jenkins.token) return;
        if (!$scope.jenkins.server) return;

        jenkins.baseUrl = $scope.jenkins.server;

        $scope.authenticating = true;
        try {
          jenkins.login($scope.jenkins.username, $scope.jenkins.token, $scope.jenkins.server)
            .then(function () {
              $rootScope.authenticated = $scope.authenticated = true;
              configuration.set('jenkins', $scope.jenkins);
              console.log("Root scope redirec:", $rootScope.redirectTo);
              if($rootScope.redirectTo) {
                console.log("Redirecting to", $rootScope.redirectTo);
                delete $rootScope.redirectTo;
                $location.path($rootScope.redirectTo);
                return $.Deferred().reject("Redirecting to route");
              }
            })
            .then(jenkins.views)
            .then(function (views) {


              $scope.jenkinsViews = views;
              $scope.tableParameters = new ngTableParams(
                {
                  count: views.length,
                  sorting: {
                    passRate: 'asc'
                  }
                },
                {
                  data: views
                }
              )
            })
            .catch(function (error) {
              $scope.authenticationError = "Failed to authenticate against " + $scope.jenkins.server;
              $scope.authenticated = false;
            })
            .finally(function () {
              $scope.authenticating = false;
              $scope.$watch('search', function (newValue, oldValue) {
                console.log(arguments);
              }, true);
            });
        } catch (err) {
          console.log('Error: ', err);
        }
      };

      $scope.authenticate();
    }])
;
