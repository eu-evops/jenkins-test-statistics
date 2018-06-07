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

        $scope.showError = function (execution) {
          execution.showException = true;
          SolrSearch.getSimilarDocuments(execution.id).then(function (docs) {
            var dcs = [];
            docs.response.docs.forEach(function (doc) {
              if(dcs.length == 0) {
                dcs.push(doc);
              } else {
                if(dcs.find(function (d) {
                  return d.name === doc.name;
                }) == null){
                  dcs.push(doc);
                }
              }
            });
            $scope.testNames = dcs;
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
