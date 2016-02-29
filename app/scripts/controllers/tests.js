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
    '$scope', '$routeParams', 'jenkins', 'ngTableParams',
    function ($scope, route, jenkins, NgTableParams) {
      $scope.job = route.job;
      var job;

      $scope.progress = 0;
      $scope.$on('jenkins-report', function (event, progress) {
        $scope.progress = progress;
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
              data: $scope.testReport.cases
            });

          $scope.$watch('testSearch', function () {
            $scope.testTableParameters.filter({name: $scope.testSearch});
          });
        });
    }]);
