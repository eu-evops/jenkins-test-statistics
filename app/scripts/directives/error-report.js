'use strict';
angular.module('testReporterApp')
  .directive('errorReport', [ '$http', '$q','SolrSearch','$rootScope', function ($http, $q, SolrSearch, $rootScope) {
    return {
        templateUrl: '/views/directives/error-report.html',
        restrict: 'A',
        scope: {
          errorReport: '='
        },
        link: function ($scope) {
          $scope.$watch('errorReport', function (testReport) {
              if(!testReport) {
                return;
              }

              var promises = [];
              var collectedRecords = 0;
              var totalIds=0;

              var erroredExecutions = [];
              var errors = [];
              testReport.cases.forEach(function (tc) {
                tc.executions.forEach(function (te) {
                  if(!te.passing) {
                    erroredExecutions.push(te);
                  }
                });
              });

              console.log('Number of errored executions before', erroredExecutions.length);
              var failingTest = erroredExecutions.shift();
              SolrSearch.getSimilarDocuments(failingTest)
                .then(function _(response) {
                  var error = {
                    error: response.test.error,
                    interestingTerms: response.data.interestingTerms,
                    url: response.url,
                    affectedTests: [response.test]
                  };

                  response.data.response.docs.forEach(function (doc) {

                    var match = erroredExecutions.findIndex(function(te) {
                      return te.id == doc.id;
                    });

                    if(match !== -1) {
                      error.affectedTests.push(erroredExecutions.splice(match, 1)[0]);
                    }
                  })

                  errors.push(error);

                  var nextError = erroredExecutions.shift();
                  if(nextError) {
                    return SolrSearch.getSimilarDocuments(nextError)
                    .then(_)
                  }
                })
                .then(function() {
                  console.log('Found all the errors', errors);
                  $rootScope.$broadcast('error-report', errors);
                  $scope.errorDetails = errors.sort(function (a, b) {
                    return b.affectedTests.length - a.affectedTests.length;
                  });
                });

              // console.log(erroredExecutions);

              // testReport.cases.forEach(function (tc) {
              //   if(tc.status !== 'Passed') {
              //     tc.executions.forEach(function (tcE) {
              //       if(tcE.error != null|| tcE.error != undefined) {
              //            promises.push(
              //             SolrSearch.getSimilarDocuments(tcE.id, tcE.testReportId)
              //               .then(function (doc) {
              //                 if(doc.response != undefined && doc.response != null) {
              //                   var tests = doc.response.docs;
              //                   if(tests !== undefined || tests !== null) {
              //                     return {
              //                       tests: tests,
              //                       error:tcE.error
              //                     };
              //                   }
              //                 }
              //               }).catch(function (error) {
              //               console.log(error);
              //             }).finally(function (response) {
              //               collectedRecords++;
              //               var progress = Math.ceil(collectedRecords / totalIds * 100);
              //               if(progress % 10 === 0) {
              //                 $rootScope.$broadcast('error-report', {
              //                   progress: progress,
              //                   processed: collectedRecords,
              //                   total: totalIds
              //                 });
              //               }
              //               return response;
              //             })
              //           );
              //       }
              //     })
              //   }
              // });
              // $q.all(promises).then(function (data) {
              //     $scope.errorDetails = data;
              //   }).catch(function (err) {
              //     console.log(err);
              // });
          });
        }
    }
  }]);
