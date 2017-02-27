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
    '$scope', '$routeParams', 'jenkins', 'ngTableParams', 'FileSaver', 'Blob',
    function ($scope, route, jenkins, NgTableParams, FileSaver, Blob) {
      $scope.view = {
        name: route.view
      };

      $scope.progress = 0;
      $scope.$on('jenkins-report', function (event, progress) {
        $scope.progress = progress;
      });

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

              $scope.testTableParameters = new NgTableParams({
                  count: 25,
                  sorting: {
                    'getPassRate()': 'asc'
                  }
                },
                {
                  data: $scope.testReport.cases
                });

              $scope.tableParameters.sorting('report.passRate', 'asc');

              $scope.$watch('testSearch', function () {
                $scope.testTableParameters.filter({name: $scope.testSearch});
              });
              $scope.$apply();
            });

          $scope.range = function(n) {
            return new Array(n);
          };

          $scope.exportCsv = function () {
            var tcs = $scope.testReport.cases.map(function (tc) {
              return [
                tc.className,
                tc.name,
                tc.executions.length,
                tc.passingCount,
                tc.getPassRate(),
                tc.getFUPassRate(),
                tc.url
              ].join(",");
            }).join("\n");

            var header = "Test Suite,Test Name, Number of executions, Passing count, Pass rate, FU Pass rate, Jenkins Test history URL";
            var exportBlob = new Blob([header + "\n" + tcs], {type: 'text/csv'});
            FileSaver.saveAs(exportBlob, "TestReport.csv");
          };

          $scope.tableParameters = new NgTableParams({
              count: 25,
              sorting: {
                passRate: 'asc'
              }
            },
            {
              data: view.allJobs
            });

          $scope.$watch('jobSearch', function () {
            $scope.tableParameters.filter({displayName: $scope.jobSearch});
          });
        });
    }]);
