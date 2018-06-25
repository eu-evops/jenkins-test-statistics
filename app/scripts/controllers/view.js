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
    '$scope', 'jenkins', 'NgTableParams', 'FileSaver', 'Blob', '$rootScope', '$filter', '$stateParams', '$http','$q', 'SolrSearch',
    function ($scope, jenkins, NgTableParams, FileSaver, Blob, $rootScope, $filter, $stateParams, $http, $q, SolrSearch) {
      var percentageFilter = $filter('percentage');

      $scope.view = {
        name: $stateParams.view
      };

      $scope.search = {
        jobSearch: '',
        testSearch: '',
        errorSearch: ''
      };

      $scope.testSearch = "";
      $scope.solrIndexed = false;


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
            testReport.cases.forEach(function(tc) {
              //index only failures
              if(tc.status !== 'Passed') {
                tc.executions.forEach(function (te) {
                  var document = {
                    id: te.id,
                    testReportId: testReport.testReportId,
                    name: te.name,
                    className: te.className,
                    error: te.error,
                    shortError: te.shortError,
                    stderr: te.stderr,
                    stdout: te.stdout,
                    view: tc.job.view,
                    url: te.url,
                    jobDisplayName: te.build.job.displayName,
                    jobName: te.build.job.name,
                    errorStackTrace: te.errorStackTrace,
                    time_to_live_s: '+1DAYS'
                  };
                  solrReport.push(document);
                });
              }
            });

            SolrSearch.selectByTestReportId(testReport.getHash())
              .then(function(response) {
                if(response.data.response.numFound === 0) {
                  return SolrSearch.indexData(solrReport);
                }
              })
              .finally(function() {
                $scope.solrIndexed = true;
              });
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

          $scope.$watch('search.jobSearch', function () {
            $scope.tableParameters.filter({displayName: $scope.search.jobSearch});
          });

          $scope.$watch('search.testSearch', function (term) {
            if(!term || !$scope.testReport) {
              return;
            }

            SolrSearch.search({ error: term, testReportId: $scope.testReport.testReportId })
              .then(function(results) {
                $scope.search.testSearchResults = results.response.docs.map(function (doc) {
                  return $scope.testReport.getExecution(doc.id);
                });
                $scope.search.facet_fields = results.facet_counts.facet_fields;
              });
          });
        });


      $scope.assignErrorReport = function() {
        $scope.errorReport = $scope.testReport;
      };
    }]);
