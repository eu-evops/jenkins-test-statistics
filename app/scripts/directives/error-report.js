'use strict';
angular.module('testReporterApp')
  .directive('errorReport', [ '$http', '$q','SolrSearch', function ($http, $q, SolrSearch) {
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
              angular.forEach(testReport.cases, function (tc) {
                if(tc.status !== 'Passed') {
                  angular.forEach(tc.executions, function (tcE) {
                    if(tcE.error != null|| tcE.error != undefined) {
                      promises.push(
                        SolrSearch.getSimilarDocuments(tcE.id)
                          .then(function (errordocs) {
                            if(errordocs.response != undefined && errordocs.response != null) {
                              var tests = errordocs.response.docs;
                              if(tests !== undefined || tests !== null) {
                                return {
                                  tests: tests,
                                  error:tcE.error
                                };
                              }
                            }
                          }).catch(function (error) {
                          console.log(error);
                        })
                      );
                    }
                  })
                }
              });

              $q.all(promises).then(function (data) {
                  $scope.errorDetails = data;
                  console.log(data);
                }).catch(function (err) {
                  console.log(err);
              });

          });
        }
    }
  }]);
