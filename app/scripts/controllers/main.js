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
    '$scope', '$rootScope', 'jenkins', 'localStorageService', 'configuration', 'NgTableParams', 'jenkinsServers',
    function ($scope, $rootScope, jenkins, storage, configuration, NgTableParams, jenkinsServers) {

      jenkins.getAllViews()
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
              dataset: views
            }
          );

          $scope.$watch('search', function () {
            $scope.tableParameters.filter({ name: $scope.search });
          });
        });
    }])
;
