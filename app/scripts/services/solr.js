'use strict';

angular.module('testReporterApp')
  .service('SolrSearch', ['$http', '$httpParamSerializer', function (http, httpParamSerializer) {


    this.getSimilarDocs = function (ids) {
      var url = "http://localhost:8983/solr/stats/mlt?q=id:\""+id+"\"&mlt=true&mlt.fl=error" +
        "&mlt.mindf=1&mlt.mintf=1&mlt.minwl=1&mlt.maxqt=1000&mlt.count=3" +
        "&mlt.interestingTerms=details&mlt.match.include=false&wt=json&mlt.maxwl=50";
      return http.get(url)
        .then(function (response) {
          return response.data;
        });
    };

    this.getSimilarDocuments = function (test) {

      var query = {
        q: "id:\""+test.id+"\"",
        mlt: true,
        "mlt.fl": "error",
        "mlt.mindf":1,
        "mlt.mintf":1,
        "mlt.minwl":10,
        "mlt.maxqt":10,
        "fl": "id",
        "mlt.interestingTerms":"details",
        "mlt.match.include":false,
        "wt": "json",
        "mlt.maxwl":50,
        "rows":9999,
        "fq": "testReportId:" + test.testReportId
      };

      var url = "http://localhost:8983/solr/stats/mlt?" + httpParamSerializer(query);

      return http.get(url).then(function (data) {
        return { test: test, data: data.data };
      });
    };

    this.indexData = function (data) {
      return http.post('http://localhost:8983/solr/stats/update?commit=true', data)
        .then(function(response) {
          return response;
        });
    };
  }]);
