'use strict';

/**
 * @ngdoc function
 * @name testReporterApp.controller:ViewsCtrl
 * @description
 * # ViewsCtrl
 * Controller of the testReporterApp
 */
angular.module('testReporterApp')
  .controller('ViewCtrl', [
    '$scope', 'jenkins', 'NgTableParams', 'FileSaver', 'Blob', '$rootScope', '$filter', '$stateParams', '$http','$q',
    function ($scope, jenkins, NgTableParams, FileSaver, Blob, $rootScope, $filter, $stateParams, $http,$q) {
      var percentageFilter = $filter('percentage');

      $scope.view = {
        name: $stateParams.view
      };

      $scope.$on('jenkins-report', function (event, downloadProgress) {
        $scope.downloadProgress = downloadProgress;
      });

      $scope.$on('error-report', function (event, downloadProgress) {
        $scope.errorProgress = downloadProgress;
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

          var indexInSolr = function(testReport) {
            var solrReport = [];
            var regexp = new RegExp('.*?\/testReport\/');
            testReport.cases.forEach(function(tc) {
              //index only failures
              if(tc.status !== 'Passed') {
                tc.executions.forEach(function (te) {
                  var document = {
                    id: te.id,
                    name: te.name,
                    className: te.className,
                    error: (te.error || ''),
                    shortError: (te.shortError || '').substr(0, 255),
                    stderr: (te.stderr || ''),
                    stdout: (te.stdout || '' ),
                    errorStackTrace: (te.errorStackTrace || ''),
                    buildUrl: tc.url.match(regexp)[0],
                    appView: $scope.view.name,
                    time_to_live_s: '+1DAYS'
                  };
                  solrReport.push(document);
                });
              }
            });
            $http.post('http://localhost:8983/solr/stats/update?commit=true', solrReport)
              .then(function(response) {
                console.log(response);
              });
            console.log("Indexing in solr", solrReport);
          };

          jenkins.testReport(allBuilds)
            .then(function(testReport) {
              indexInSolr(testReport);
              return testReport;
            })
            .then(function (testReport) {
              $scope.testReport = testReport;

              var testReportSummary = '';
              for(var i=0; i<$rootScope.numberOfRecentBuilds; i++) {
                testReportSummary += 'Passing at least ' + (i + 1) + ' times: ' + percentageFilter(testReport.passRatePassingTimes(i + 1));
                testReportSummary += ' (' + testReport.numberPassingTimes(i + 1) + ')';
                testReportSummary += "\n";
              }

              $scope.testReportSummary = testReportSummary;

              $scope.$apply();

              $scope.tableParameters.sorting('report.passRate', 'asc');
              $scope.$apply();
            });

          $scope.range = function(n) {
            return new Array(n);
          };

          $scope.tableParameters = new NgTableParams({
              count: 25,
              sorting: {
                passRate: 'asc'
              }
            },
            {
              dataset: view.allJobs
            });

          $scope.$watch('jobSearch', function () {
            $scope.tableParameters.filter({displayName: $scope.jobSearch});
          });
        });

      $scope.assignErrorReport = function () {
        $scope.errorReport = $scope.testReport;
      }
    }]);
