'use strict';

/**
 * @ngdoc directive
 * @name testReporterApp.directive:passRate
 * @description
 * # passRate
 */
angular.module('testReporterApp')
  .directive('passRate', function () {
    return {
      restrict: 'A',
      scope: {
        rate: '=passRate'
      },
      link: function postLink($scope, element) {
        $scope.$watch('rate', function () {
          if(typeof $scope.rate === 'undefined') {
            return;
          }

          if($scope.rate === null) {
            return;
          }

          element.removeClass('success', 'bg-success', 'panel-success');
          element.removeClass('danger', 'bg-danger', 'panel-danger');
          element.removeClass('warning', 'bg-warning', 'panel-warning');

          if($scope.rate >= 0.9) {
            element.addClass('success');
            element.addClass('bg-success');
            element.addClass('panel-success');
          } else if($scope.rate < 0.5) {
            element.addClass('danger');
            element.addClass('bg-danger');
            element.addClass('panel-danger');
          } else if($scope.rate < 0.9) {
            element.addClass('warning');
            element.addClass('bg-warning');
            element.addClass('panel-warning');
          }
        });
      }
    };
  });
