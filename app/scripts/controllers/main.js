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
    function ($scope, $rootScope, jenkins, storage, configuration, NgTableParams, jenkinsServers) {

      $scope.jenkins = configuration.get('jenkins') || {
          server: jenkinsServers[0]
        };

      $scope.jenkinsServers = jenkinsServers;
      jenkins.baseUrl = $scope.jenkins.server;
      jenkins.views()
        .then(function (views) {
          $scope.jenkinsViews = views;
          $scope.tableParameters = new NgTableParams(
            {
              count: 25,
              sorting: {
                'allJobs.length': 'desc'
              }
            },
            {
              data: views
            }
          );

          $scope.$watch('search', function () {
            $scope.tableParameters.filter({ name: $scope.search });
          });
        });
    }])
;
