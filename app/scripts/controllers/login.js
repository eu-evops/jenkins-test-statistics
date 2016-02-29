'use strict';

/**
 * @ngdoc function
 * @name testReporterApp.controller:LoginCtrl
 * @description
 * # MainCtrl
 * Controller of the testReporterApp
 */
angular.module('testReporterApp')
  .controller('LoginCtrl', [
    '$scope', '$rootScope', 'jenkins', 'localStorageService', 'configuration', 'ngTableParams', 'jenkinsServers', '$location',
    function ($scope, $rootScope, jenkins, storage, configuration, ngTableParams, jenkinsServers, $location) {

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
        jenkins.login($scope.jenkins.username, $scope.jenkins.token, $scope.jenkins.server)
          .then(function () {
            $rootScope.authenticated = $scope.authenticated = true;
            configuration.set('jenkins', $scope.jenkins);
            var destination = '/';
            if ($rootScope.redirectTo) destination = $rootScope.redirectTo;
            $location.path(destination);
          })
          .catch(function (error) {
            $scope.authenticationError = `Failed to authenticate against ${$scope.jenkins.server}`;
          })
          .finally(function () {
            $scope.authenticating = false;
            $scope.authenticated = false;
          })
      };

      $scope.authenticate();
    }])
;
