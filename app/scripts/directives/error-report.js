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
              var totalIds=0;
              testReport.cases.forEach(function (tc) {
                if(tc.status !== 'Passed') {
                  tc.executions.forEach(function (tcE) {
                     totalIds++;
                   })
                }
              });
              testReport.cases.forEach(function (tc) {
                if(tc.status !== 'Passed') {
                  tc.executions.forEach(function (tcE) {
                    if(tcE.error != null|| tcE.error != undefined) {
                         promises.push(
                          SolrSearch.getSimilarDocuments(tcE.id)
                            .then(function (doc) {
                              if(doc.response != undefined && doc.response != null) {
                                var tests = doc.response.docs;
                                if(tests !== undefined || tests !== null) {
                                  return {
                                    tests: tests,
                                    error:tcE.error
                                  };
                                }
                              }
                            }).catch(function (error) {
                            console.log(error);
                          }).finally(function (response) {
                            collectedRecords++;
                            var progress = Math.ceil(collectedRecords / totalIds * 100);
                            if(progress % 10 === 0) {
                              $rootScope.$broadcast('error-report', {
                                progress: progress,
                                processed: collectedRecords,
                                total: totalIds
                              });
                            }
                            return response;
                          })
                        );
                    }
                  })
                }
              });
              $q.all(promises).then(function (data) {
                  $scope.errorDetails = data;
                }).catch(function (err) {
                  console.log(err);
              });
          });
        }
    }
  }]);
