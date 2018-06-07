'use strict';

/**
 * @ngdoc directive
 * @name testReporterApp.directive:passRate
 * @description
 * # passRate
 */
angular.module('testReporterApp')
  .directive('testReport', ['NgTableParams', 'FileSaver','SolrSearch', function (NgTableParams, FileSaver, SolrSearch) {
    return {
      templateUrl: '/views/directives/test-report.html',
      restrict: 'A',
      scope: {
        testReport: '=',
        testReportSummary: '='
      },
      link: function ($scope) {
        $scope.$watch('testReport', function (testReport) {
          if (!testReport) {
            return;
          }

          var testStatuses = testReport.cases.map(function (tc) {
            return tc.status;
          });
          $scope.testStatuses = testStatuses.filter(function (el, index) {
            return testStatuses.indexOf(el) === index;
          });

          $scope.testTableParameters = new NgTableParams({
              count: 25,
              sorting: {
                'getPassRate()': 'asc'
              }
            },
            {
              dataset: testReport.cases
            });

        });

        $scope.showError = function (id) {
          $scope.showException = true;
          SolrSearch.getSimilarDocuments(id).then(function (docs) {
            $scope.testNames = SolrSearch.getTestNames(docs)
          });
        };

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
            ].map(function (item) {
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
