'use strict';

angular.module('testReporterApp')
  .service('SolrSearch', ['$http', function (http) {


    this.getSimilarDocs = function (ids) {
      var url = "http://localhost:8983/solr/stats/mlt?q=id:\""+id+"\"&mlt=true&mlt.fl=error" +
        "&mlt.mindf=1&mlt.mintf=1&mlt.minwl=1&mlt.maxqt=1000&mlt.count=3" +
        "&mlt.interestingTerms=details&mlt.match.include=false&wt=json&mlt.maxwl=50";
      return http.get(url)
        .then(function (response) {
          return response.data;
        });
    };

    this.getSimilarDocuments = function (execution) {
      var url = "http://localhost:8983/solr/stats/mlt?q=id:\""+execution.id+"\"&mlt=true&mlt.fl=error" +
        "&mlt.mindf=1&mlt.mintf=1&mlt.minwl=1&mlt.maxqt=1000&mlt.count=3" +
        "&mlt.interestingTerms=details&mlt.match.include=false&wt=json&mlt.maxwl=50";
      return http.get(url).then(function (data) {
        return data.data;
      });
    };

    this.indexData = function (data) {
      return http.post('http://localhost:8983/solr/stats/update?commit=true', data)
        .then(function(response) {
          return response;
        });
    };
  }]);
