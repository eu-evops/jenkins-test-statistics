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

          const isFolder = $scope.path.indexOf('/job/') > -1;
          const pathClassifier = isFolder ? 'job' : 'view';

          var breadcrumbs = $scope.path.split(/\/(view|job)\/?/)
            .map(function (el) {
              return el.replace(/^\//, '').replace(/\/$/, '').replace(/^$/, 'Home');
            })
            .map(function (el) {
              return decodeURIComponent(el);
            })
            .filter(function(el, index) { return index % 2 == 0 })
            .reduce(function (crumbsArray, currentElement) {
              var crumb = {
                name: currentElement
              };
              crumbsArray.push(crumb);
              crumb.path = '/' + pathClassifier + '/' + crumbsArray.slice(1).map(function (el) {
                return el.name;
              }).join('/' + pathClassifier + '/');

              return crumbsArray;
            }, []);

          $scope.breadcrumbs = breadcrumbs.slice(1);
        });
      }
    };
  });
