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

            var testCases = testReport.cases;
            var promises = [];
            //
            // //returns the total list of ids
            // var getIdFromTests = function (testCases) {
            //   var ids = [];
            //   angular.forEach(testCases, function (testcase) {
            //     if(testcase.status !== 'Passed') {
            //       angular.forEach(testcase.executions, function (testexecution) {
            //         this.push(testexecution.id);
            //       }, ids);
            //     }
            //   });
            //   return ids;
            // };
            //
            // var getIdFromMltResponse = function (docs) {
            //   var ids = [];
            //   angular.forEach(docs, function (doc) {
            //       this.push(doc.id);
            //   }, ids);
            //   return ids;
            // };
            //
            // var idsT = getIdFromTests(testCases);
            // $scope.idsToQuery = idsT;
            // callPromiseAgain(idsT[0])]
            //   .then(function (data) {
            //     var mltIds = getIdFromMltResponse(data);
            //     mltIds.forEach(function(mltId) {
            //       var index = idsT.indexOf(parseInt(mltId));
            //       if( index > 0) {
            //         $scope.idsToQuery.splice(index, 1);
            //       }
            //     })
            //     return data;
            // });
            //
            // var callPromiseAgain = function (id) {
            //   return SolrSearch.getSimilarDocuments(id);
            // };
            //
            // var idsNotToQuery = [];
            // var datas = [];
            // getIdFromTests(testCases).forEach(async (id) => {
            //   if(idsNotToQuery.length === 0 || idsNotToQuery.indexOf(parseInt(id)) < 0) {
            //     var data = await callPromiseAgain(id);
            //     console.log(data);
            //     datas.push(data);
            //     var ids = getIdFromMltResponse(data.docs);
            //     for(var id of ids) {
            //       idsNotToQuery.push(id);
            //     }
            //   }
            // });
            // console.log(datas);
            //
            //
            // //
            // // $scope.idsNotToQuery = [];
            // //
            // // idsT.forEach(function(idToQuery) {
            // //   if($scope.idsNotToQuery.length == 0 || $scope.idsNotToQuery.indexOf(parseInt(idToQuery)) == -1) {
            // //     promises.push(SolrSearch.getSimilarDocuments(idToQuery)
            // //       .then(function (data) {
            // //         var ids = getIdFromMltResponse(data.response.docs);
            // //         for (var id of ids) {
            // //           var index = idsT.indexOf(parseInt(id));
            // //           if (index > -1) {
            // //             console.log('adding index');
            // //             $scope.idsNotToQuery.push(index);
            // //             console.log($scope.idsNotToQuery.length);
            // //           }
            // //           return data;
            // //         }
            // //       })
            // //       .catch(function (error) {
            // //         console.log(error);
            // //       }));
            // //   }
            // // });
            // //
            // // $q.all(promises).then(function (data) {
            // //   console.log($scope.idsNotToQuery.length);
            // //   console.log(promises.length);
            // //   var details = data.map(function (d) {
            // //     if(angular.isDefined(d)){
            // //       return d;
            // //     }
            // //   });
            // //   console.log(details);
            // // })
            // //   .catch(function (error) {
            // //     console.log(error);
            // //   });

            // for(var tc of testCases) {
            //   if(tc.status !== 'Passed') {
            //     for(var te of tc.executions) {
            //       if(idsNotToQuery.indexOf(te.id) < 0) {
            //         promises.push(SolrSearch.getSimilarDocuments(te.id)
            //           .then(function (document) {
            //             if(document.response != undefined && document.response != null) {
            //               var docs = document.response.docs;
            //               //updating the list of ids that should not be queried again
            //               for(var doc of docs) {
            //                 idsNotToQuery.push(doc.id);
            //               }
            //               console.log(docs.length);
            //               // console.log(idsNotToQuery);
            //               return {execution: te, docs: docs};
            //             }
            //           })
            //           .catch(function (error) {
            //             console.log(error);
            //           }));
            //       }
            //     };
            //   }
            // };

            // console.log(promises);

            // $q.all(promises).then(function (docs) {
            //   console.log(docs);
            //   var details = [];
            //   for(var doc of docs){
            //     details.push({error: doc.execution.error, totalTests: docs.length, tests: docs});
            //   }
            //   console.log('details are');
            //   console.log(details);
            //   $scope.errorDetails = details;
            // })
            // .catch(function (error) {
            //   console.log(error);
            // });




            var cases = testReport.cases;
            for(var tcIndex=0; tcIndex < cases.length; tcIndex++) {
              var tc = cases[tcIndex];
              if(tc.status !== 'Passed') {
                for(var tcExecution=0; tcExecution < tc.executions.length; tcExecution++) {
                  var tcE = tc.executions[tcExecution];
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
                }
              }
            }
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
