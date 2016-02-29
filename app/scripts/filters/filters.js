'use strict';

/**
 * @ngdoc filter
 * @name testReporterApp.filter:filters
 * @function
 * @description
 * # filters
 * Filter in the testReporterApp.
 */
angular.module('testReporterApp')
  .filter('regex', function() {
    return function(items, search) {
      if(!items) {
        return;
      }

      if(!search) {
        return items;
      }

      search = search.split(/\s+/).join(".*");

      var r;
      try {
        r = new RegExp(search, 'ig');
      }
      catch(e) {
        return items;
      }

      return items.filter(function(item) {
        var str = "";
        for(var prop in item) {
          if(typeof item[prop] === "string") {
            str += item[prop];
          }
        }
        console.log(str);
        return r.test(str);
      });
    };
  })
  .filter('percentage', ['$filter', function ($filter) {
    return function (input, decimals) {
      if(!decimals) {
        decimals = 0;
      }
      if(input === null) {
        return 'N/A';
      }
      return $filter('number')(input * 100, decimals) + '%';
    };
  }])
;
