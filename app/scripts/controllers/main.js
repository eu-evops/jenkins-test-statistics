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
      $scope.jenkins = configuration.get('jenkins') || {
          server: jenkinsServers[0]
        };

      $scope.jenkinsServers = jenkinsServers;
      jenkins.baseUrl = $scope.jenkins.server;
      jenkins.views()
        .then(function (views) {
          $scope.jenkinsViews = views;
          $scope.tableParameters = new ngTableParams(
            {
              count: 25,
              sorting: {
                passRate: 'asc'
              }
            },
            {
              data: views
            }
          );

          $scope.$watch('search', function () {
            $scope.tableParameters.filter({ name: $scope.search });
          });
        })
    }])
;
