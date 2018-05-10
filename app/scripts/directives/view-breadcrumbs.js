'use strict';

/**
 * @ngdoc directive
 * @name testReporterApp.directive:passRate
 * @description
 * # passRate
 */
angular.module('testReporterApp')
  .directive('viewBreadcrumbs', function () {
    return {
      restrict: 'A',
      templateUrl: '/views/directives/view-breadcrumbs.html',
      scope: {
        path: '=viewBreadcrumbs'
      },
      link: function postLink($scope, element) {
        $scope.$watch('path', function (path) {
          if (!path) {
            return;
          }

          var breadcrumbs = $scope.path.split(/\/view\/?/)
            .map(function (el) {
              return el.replace(/^\//, '').replace(/\/$/, '').replace(/^$/, 'Home');
            })
            .map(function (el) {
              return decodeURIComponent(el);
            })
            .reduce(function (crumbsArray, currentElement) {
              var crumb = {
                name: currentElement
              };
              crumbsArray.push(crumb);
              crumb.path = '/view/' + crumbsArray.slice(1).map(function (el) {
                return el.name;
              }).join('/view/');

              return crumbsArray;
            }, []);

          $scope.breadcrumbs = breadcrumbs.slice(1);
        });
      }
    };
  });
