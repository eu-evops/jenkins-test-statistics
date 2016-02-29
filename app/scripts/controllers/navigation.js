'use strict';

/**
 * @ngdoc function
 * @name testReporterApp.controller:NavigationCtrl
 * @description
 * # NavigationCtrl
 * Controller of the testReporterApp
 */
angular.module('testReporterApp')
  .directive('menuItem', [function() {
    return {
      restrict: 'E'
    };
  }])
  .controller('NavigationCtrl', function ($location) {
    this.menus = [
      { name: 'Home', route: '/' },
      { name: 'About', route: '/about' },
      { name: 'Settings', route: '/settings' }
    ];

    this.active = function(item) {
      return item.route === $location.$$path;
    };
  });
