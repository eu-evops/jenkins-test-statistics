'use strict';

/**
 * @ngdoc overview
 * @name testReporterApp
 * @description
 * # testReporterApp
 *
 * Main module of the application.
 */
angular
  .module('testReporterApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngTable',
    'ui.sortable',
    'LocalStorageModule',
    'Jenkins',
    'Configuration'
  ])
  .config(['localStorageServiceProvider', function (localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('testReporter');
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('JenkinsAuthenticationHttpInterceptor');
  }])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .when('/tests/:job', {
        templateUrl: 'views/tests.html',
        controller: 'TestsCtrl',
        controllerAs: 'tests'
      })
      .when('/builds', {
        templateUrl: 'views/builds.html',
        controller: 'BuildsCtrl',
        controllerAs: 'builds'
      })
      .when('/settings', {
        templateUrl: 'views/settings.html',
        controller: 'SettingsCtrl',
        controllerAs: 'settings'
      })
      .when('/views/:view*', {
        templateUrl: 'views/views.html',
        controller: 'ViewsCtrl',
        controllerAs: 'views'
      })
      .otherwise({
        redirectTo: '/'
      });
    // use the HTML5 History API
     $locationProvider.html5Mode(false);
  })
  .run([
    '$rootScope', 'localStorageService', '$window',
    function (rootScope, storage, window) {
    rootScope.numberOfRecentBuilds = storage.get('numberOfRecentBuilds') || 10;

    rootScope.saveNumberOfBuildsAndRefresh = function () {
      console.log("Setting number of builds", rootScope.numberOfRecentBuilds);
      storage.set('numberOfRecentBuilds', rootScope.numberOfRecentBuilds);
      window.location.reload();
    }
  }])
;
