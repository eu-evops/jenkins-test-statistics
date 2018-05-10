'use strict';

/**
 * @ngdoc directive
 * @name testReporterApp.directive:passRate
 * @description
 * # passRate
 */
angular.module('testReporterApp')
  .directive('testReport', ['NgTableParams', 'FileSaver', function (NgTableParams, FileSaver) {
    return {
      templateUrl: '/views/directives/test-report.html',
      restrict: 'A',
      scope: {
        testReport: '=',
        testReportSummary: '='
      },
      link: function($scope) {
        $scope.$watch('testReport', function(testReport) {
          if(!testReport) {
            return;
          }

          console.log('Linking test report', testReport.cases);

          $scope.testTableParameters = new NgTableParams({
              count: 25,
              sorting: {
                'getPassRate()': 'asc'
              }
            },
            {
              data: testReport.cases
            });


          $scope.$watch('testSearch', function () {
            $scope.testTableParameters.filter({name: $scope.testSearch});
          });
        });

        $scope.exportCsv = function () {
          var tcs = $scope.testReport.cases.map(function (tc) {
            return [
              tc.job.name,
              tc.className,
              tc.name,
              tc.executions.length,
              tc.passingCount,
              tc.getPassRate(),
              tc.url
            ].map(function(item) {
              return '"' + item + '"';
            }).join(",");
          }).join("\n");

          var header = "Job, Test Suite,Test Name,Number of executions,Passing count,Pass rate,Jenkins Test history URL";
          var exportBlob = new Blob([header + "\n" + tcs], {type: 'text/csv'});
          FileSaver.saveAs(exportBlob, "TestReport.csv");
        };
      }
    };
  }]);
