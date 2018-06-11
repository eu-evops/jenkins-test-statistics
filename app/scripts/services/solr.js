'use strict';

angular.module('testReporterApp')
  .service('SolrSearch', ['$http', '$httpParamSerializer', function (http, httpParamSerializer) {

    this.search = function(parameters) {
      console.log("Searching for", parameters);
      var url = '/solr/stats/select?';
      url += httpParamSerializer({
        q: 'error:' + parameters.error.replace(/"/g, '\\"').split(/\s+/).map(function(el) { return '"' + el + '"'}).join(" AND ") + ' AND testReportId:' + parameters.testReportId,
        rows: 9999
      });

      return http.get(url)
        .then(function(response) {
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
        "mlt.minwl":5,
        "mlt.maxqt":30,
        "mlt.interestingTerms":"details",
        "mlt.match.include":false,
        "wt": "json",
        "mlt.maxwl":50,
        "rows":9999,
        "fq": "testReportId:" + test.testReportId
      };

      var url = "/solr/stats/mlt?" + httpParamSerializer(query);

      return http.get(url).then(function (data) {
        return { test: test, data: data.data, url: url };
      });
    };

    this.indexData = function (data) {
      return http.post('/solr/stats/update?commit=true', data)
        .then(function(response) {
          return response;
        });
    };
  }]);
