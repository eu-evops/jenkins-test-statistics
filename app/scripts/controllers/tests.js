'use strict';

/**
 * @ngdoc function
 * @name testReporterApp.controller:TestsCtrl
 * @description
 * # TestsCtrl
 * Controller of the testReporterApp
 */
angular.module('testReporterApp')
  .controller('TestsCtrl', [
    '$scope', '$stateParams', 'jenkins', 'NgTableParams',
    function ($scope, $stateParams, jenkins, NgTableParams) {
      $scope.job = $stateParams.job;
      var job;

      $scope.$on('jenkins-report', function (event, downloadProgress) {
        $scope.downloadProgress = downloadProgress;
      });

      jenkins.job($scope.job)
        .then(function (jobObject) {
          job = jobObject;
          return jenkins.builds(job);
        })
        .then(function (builds) {
          $scope.builds = builds;
          $scope.passRate = builds.filter(function (b) {
              return b.passing;
            }).length / builds.length;

          builds.forEach(function (build) {
            build.job = job;
          });

          return builds;
        })
        .then(jenkins.testReport)
        .then(function (testReport) {
          $scope.testReport = testReport;

          $scope.testTableParameters = new NgTableParams({
              count: 25,
              sorting: {
                'getPassRate()': 'asc'
              }
            },
            {
              dataset: $scope.testReport.cases
            });

          $scope.$watch('testSearch', function () {
            $scope.testTableParameters.filter({name: $scope.testSearch });
          });
        });
    }]);
