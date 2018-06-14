'use strict';

angular.module('testReporterApp')
  .directive('testReportTable', [function () {
    return {
      templateUrl: '/views/directives/test-report-table.html',
      restrict: 'E',
      scope: {
        tests: '=tests',
      },
      link: function ($scope) {
        $scope.$watch('tests', function (tests) {
          if(!tests) {
            return;
          }
        });
      }
    };
  }]);
