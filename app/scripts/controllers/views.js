'use strict';

/**
 * @ngdoc function
 * @name testReporterApp.controller:ViewsCtrl
 * @description
 * # ViewsCtrl
 * Controller of the testReporterApp
 */
angular.module('testReporterApp')
  .controller('ViewsCtrl', [
    '$scope', '$routeParams', 'jenkins', 'ngTableParams',
    function ($scope, route, jenkins, ngTableParams) {
      $scope.view = {
        name: route.view
      };

      jenkins.view($scope.view.name)
        .then(function (view) {
          $scope.jobs = view.allJobs;
          $scope.view = view;

          var allBuilds = [];
          $scope.jobs.forEach(function (j) {
            j.builds.forEach(function (b) {
              b.job = j;
              allBuilds.push(b);
            });
          });

          jenkins.testReport(allBuilds)
            .then(function (testReport) {
              $scope.testReport = testReport;
              $scope.$apply();

              $scope.testTableParameters = new ngTableParams({
                  count: 25,
                  sorting: {
                    'getPassRate()': 'asc'
                  }
                },
                {
                  data: $scope.testReport.cases
                })
            });

          $scope.tableParameters = new ngTableParams({
              count: 25,
              sorting: {
                passRate: 'asc'
              }
            },
            {
              data: view.allJobs
            });
        });
    }]);
