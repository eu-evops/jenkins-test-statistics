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
    '$scope', '$rootScope', 'jenkins', 'localStorageService', 'configuration', 'ngTableParams', 'jenkinsServers',
    function ($scope, $rootScope, jenkins, storage, configuration, ngTableParams, jenkinsServers) {
      $scope.jenkins = configuration.get('jenkins') || {};

      $scope.jenkinsServers = jenkinsServers;

      $scope.authenticate = function () {
        if (!$scope.jenkins.username) return;
        if (!$scope.jenkins.token) return;
        if (!$scope.jenkins.server) return;

        jenkins.baseUrl = $scope.jenkins.server;

        $scope.authenticating = true;
        try {
          jenkins.login($scope.jenkins.username, $scope.jenkins.token)
            .then(function () {
              $rootScope.authenticated = $scope.authenticated = true;
              configuration.set('jenkins', $scope.jenkins);
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
            });
        } catch (err) {
          console.log('Error: ', err);
        }
      };


      $scope.authenticate();
    }])
;
