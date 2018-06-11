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
              var erroredExecutions = [];
              var errors = [];
              testReport.cases.forEach(function (tc) {
                tc.executions.forEach(function (te) {
                  if(!te.passing && !te.skipped) {
                    erroredExecutions.push(te);
                  }
                });
              });

              var failingTest = erroredExecutions.shift();
              SolrSearch.getSimilarDocuments(failingTest)
                .then(function _(response) {
                  var error = {
                    error: response.test.error,
                    interestingTerms: response.data.interestingTerms,
                    url: response.url,
                    affectedTests: [response.test]
                  };
                  var docs = response.data.response.docs;

                  docs.forEach(function (doc) {

                    if(doc.id == response.test.id) {
                      error.affectedTests.push(doc);
                    }

                    var match = erroredExecutions.findIndex(function(te) {
                      return te.id == doc.id;
                    });

                    if(match !== -1) {
                      error.affectedTests.push(erroredExecutions.splice(match, 1)[0]);
                    }
                  });

                  errors.push(error);
                  var nextError = erroredExecutions.shift();
                  if(nextError) {
                    return SolrSearch.getSimilarDocuments(nextError)
                    .then(_)
                  }
                })
                .then(function() {
                  $rootScope.$broadcast('error-report', errors);
                  $scope.errorDetails = errors.sort(function (a, b) {
                    return b.affectedTests.length - a.affectedTests.length;
                  });
                });
          });
        }
    }
  }]);
