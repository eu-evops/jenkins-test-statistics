'use strict';

/**
 * @ngdoc directive
 * @name testReporterApp.directive:viewBreakdown
 * @description
 * # passRate
 */
angular.module('testReporterApp')
    .directive('viewBreakdown', [function() {
        return {
            templateUrl: '/views/directives/view-breakdown.html',
            restrict: 'A',
            scope: {
                viewBreakdown: '=',
            },
            link: function($scope) {
                $scope.$watch('viewBreakdown', function(testReport) {
                    if (!testReport || !testReport.cases) {
                        return;
                    }

                    $scope.breakdown = testReport.getViewBreakdown();
                });
            }
        };
    }]);