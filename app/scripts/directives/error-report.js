'use strict';
angular.module('testReporterApp')
  .directive('errorReport', [
    '$http', '$q', 'SolrSearch', '$rootScope', 'configuration', 'FileSaver', 'jenkins', '$window', 'Notification',
    function ($http, $q, SolrSearch, $rootScope, configuration, FileSaver, Jenkins, $window, Notification) {
      return {
        templateUrl: '/views/directives/error-report.html',
        restrict: 'A',
        scope: {
          errorReport: '='
        },
        link: function ($scope) {
          $scope.jenkinsConfiguration = configuration.get('jenkins');
          $scope.$watch('errorReport', function (testReport) {
            if (!testReport) {
              return;
            }
            var erroredExecutions = [];
            var errors = [];
            testReport.cases.forEach(function (tc) {
              tc.executions.forEach(function (te) {
                if (!te.passing && !te.skipped) {
                  erroredExecutions.push(te);
                }
              });
            });

            $scope.erroredExecutions = erroredExecutions.slice(0);

            var failingTest = erroredExecutions.shift();
            if (!failingTest) {
              $scope.errorDetails = [];
              $scope.ungroupedTests = [];
              $rootScope.$broadcast('error-report', $scope.errorDetails);
              return;
            }

            SolrSearch.getFacetedSearch(testReport.testReportId)
              .then(function (facets) {
                $scope.facets = facets.facet_counts.facet_pivot['view,jobName'];
                return SolrSearch.getSimilarDocuments(failingTest)
              })
              .then(function _(response) {
                var error = {
                  error: response.test.shortError,
                  interestingTerms: response.data.interestingTerms,
                  url: response.url,
                  affectedTests: [response.test]
                };
                var docs = response.data.response.docs;

                error.getFacets = function () {
                  var self = this;
                  if (this.facets) {
                    return this.facets;
                  }

                  this.facets = {};
                  this.affectedTests.forEach(function (at) {
                    self.facets[at.build.job.view] = self.facets[at.build.job.view] || {};
                    self.facets[at.build.job.view].count = self.facets[at.build.job.view].count || 0;
                    self.facets[at.build.job.view].count += 1;

                    self.facets[at.build.job.view].jobs = self.facets[at.build.job.view].jobs || {};
                    self.facets[at.build.job.view].jobs[at.build.job.name] = self.facets[at.build.job.view].jobs[at.build.job.name] || {};
                    self.facets[at.build.job.view].jobs[at.build.job.name].count = self.facets[at.build.job.view].jobs[at.build.job.name].count || 0;
                    self.facets[at.build.job.view].jobs[at.build.job.name].count += 1;
                    self.facets[at.build.job.view].jobs[at.build.job.name].job = at.job;
                  });

                  return this.facets;
                };

                docs.forEach(function (doc) {
                  var match = erroredExecutions.findIndex(function (te) {
                    return te.id == doc.id;
                  });

                  if (match !== -1) {
                    error.affectedTests.push(erroredExecutions.splice(match, 1)[0]);
                  }
                });

                errors.push(error);
                var nextError = erroredExecutions.shift();
                if (nextError) {
                  return SolrSearch.getSimilarDocuments(nextError)
                    .then(_)
                }
              })
              .then(function () {
                $rootScope.$broadcast('error-report', errors);

                console.log(errors);

                $scope.errorDetails = errors.sort(function (a, b) {
                  return b.affectedTests.length - a.affectedTests.length;
                }).filter(function (e) {
                  return e.affectedTests.length > 1;
                });

                $scope.ungroupedTests = errors.sort(function (a, b) {
                  return b.affectedTests.length - a.affectedTests.length;
                }).filter(function (e) {
                  return e.affectedTests.length === 1;
                });

                $scope.errorDetails.sumOfAffectedTests = $scope.errorDetails.reduce(function (start, current) {
                  start += current.affectedTests.length;
                  return start;
                }, 0)
              });
          });

          $scope.exportCsv = function () {
            var tcs = $scope.errorDetails.map(function (error) {
              return [
                error.error,
                error.affectedTests.length
              ].map(function (item) {
                return '"' + item.toString().replace(/"/g, '""') + '"';
              }).join(",");
            }).join("\n");

            var header = "Error, Number of affected tests";
            var exportBlob = new Blob([header + "\n" + tcs], {type: 'text/csv'});
            FileSaver.saveAs(exportBlob, "TestErrorReport.csv");
          };

          $scope.rerunJobs = function(viewsAndJobs) {
            var jobsToReRun = [];
            if(typeof(viewsAndJobs) === "string") {
              jobsToReRun.push(viewsAndJobs);
            }

            if(typeof(viewsAndJobs) === "object" && viewsAndJobs.hasOwnProperty('jobs')) {
              Object.keys(viewsAndJobs.jobs).forEach(function (jobName) {
                jobsToReRun.push(jobName);
              });
            }

            if(typeof(viewsAndJobs) === "object" && !viewsAndJobs.hasOwnProperty('jobs')) {
              Object.keys(viewsAndJobs).forEach(function (viewName) {
                Object.keys(viewsAndJobs[viewName].jobs).forEach(function (jobName) {
                  jobsToReRun.push(jobName);
                });
              });

            }

            var shouldIContinue = $window.confirm("This will trigger following jobs to run, do you want to continue?\n\n" + jobsToReRun.join("\n"));

            if(shouldIContinue) {
              Jenkins.rerunJobs(jobsToReRun)
                .then(function (success) {
                  if(success) {
                    return Notification.success('Successfully scheduled following jobs: ' + jobsToReRun.join("\n"));
                  }

                  return Notification.error('There was an error scheduling the jobs, please inspect console errors');
                });
            } else {
              Notification('No jobs have been triggered');
            }
          }
        }
      }
    }]);
