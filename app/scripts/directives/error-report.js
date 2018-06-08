'use strict';
angular.module('testReporterApp')
  .directive('errorReport', [ '$http', '$q','SolrSearch','$rootScope', function ($http, $q, SolrSearch, $rootScope) {
    return {
        templateUrl: '/views/directives/errors-report.html',
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
              var totalExecutions=[];
              testReport.cases.forEach(function (tc) {
                if(tc.status !== 'Passed') {
                  tc.executions.forEach(function (tcE) {
                    totalExecutions.push(tcE);
                   })
                }
              });

            var exeuction = totalExecutions.shift();
            var errors= [];
            SolrSearch.getSimilarDocuments(exeuction)
              .then(function (response) {
                var error = {
                  error: response.test.error,
                  affectedTests: [response.test]
                }
                response.data.response.docs.forEach(function (doc) {
                  var match = totalExecutions.findIndex(function(te) {
                    return te.id === doc.id;
                  });

                  if(match !== -1) {
                    error.affectedTests.push(totalExecutions.splice(match, 1)[0]);
                  }
                });
                errors.push(error);
                console.log('Number of errored executions within', erroredExecutions.length);
                var nextError = totalExecutions.shift();
                if(nextError) {
                  console.log('Interrogate next error', nextError.error);
                  return SolrSearch.getSimilarDocuments(nextError)
                    .then(_)
                }
              })
              .then(function() {
              console.log('Found all the errors', errors);
              $rootScope.$broadcast('error-report', errors);
              $scope.errorDetails = errors;
              console.log(errors);
            });




             // //working code
             //  testReport.cases.forEach(function (tc) {
             //    if(tc.status !== 'Passed') {
             //      tc.executions.forEach(function (tcE) {
             //        if(tcE.error != null|| tcE.error != undefined) {
             //             promises.push(
             //              SolrSearch.getSimilarDocuments(tcE.id)
             //                .then(function (doc) {
             //                  if(doc.response != undefined && doc.response != null) {
             //                    var tests = doc.response.docs;
             //                    if(tests !== undefined || tests !== null) {
             //                      return {
             //                        tests: tests,
             //                        error:tcE.error
             //                      };
             //                    }
             //                  }
             //                }).catch(function (error) {
             //                console.log(error);
             //              }).finally(function (response) {
             //                collectedRecords++;
             //                var progress = Math.ceil(collectedRecords / totalIds * 100);
             //                if(progress % 10 === 0) {
             //                  $rootScope.$broadcast('error-report', {
             //                    progress: progress,
             //                    processed: collectedRecords,
             //                    total: totalIds
             //                  });
             //                }
             //                return response;
             //              })
             //            );
             //        }
             //      })
             //    }
             //  });
             //  $q.all(promises).then(function (data) {
             //      $scope.errorDetails = data;
             //    }).catch(function (err) {
             //      console.log(err);
             //  });
          });
        }
    }
  }]);
