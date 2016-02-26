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
    'Configuration',
    'config'
  ])
  .config(['localStorageServiceProvider', function (localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('testReporter');
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('JenkinsAuthenticationHttpInterceptor');
  }])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        controllerAs: 'login'
      })
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main',
        authenticate: true
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .when('/tests/:job', {
        templateUrl: 'views/tests.html',
        controller: 'TestsCtrl',
        controllerAs: 'tests',
        authenticate: true
      })
      .when('/builds', {
        templateUrl: 'views/builds.html',
        controller: 'BuildsCtrl',
        controllerAs: 'builds',
        authenticate: true
      })
      .when('/settings', {
        templateUrl: 'views/settings.html',
        controller: 'SettingsCtrl',
        controllerAs: 'settings'
      })
      .when('/views/:view*', {
        templateUrl: 'views/views.html',
        controller: 'ViewsCtrl',
        controllerAs: 'views',
        authenticate: true
      })
      .otherwise({
        redirectTo: '/'
      });
    // use the HTML5 History API
    $locationProvider.html5Mode(false);
  })
  .run([
    '$rootScope', 'localStorageService', '$window', '$location', 'configuration', 'jenkins', '$route',
    function ($rootScope, storage, window, $location, configuration, jenkins, $route) {
      $rootScope.numberOfRecentBuilds = 5;

      $rootScope.$on('$routeChangeStart', function (event, toState, toParams) {
        if(toState.authenticate && !$rootScope.authenticated) {
          $rootScope.redirectTo = $location.path();
          $location.path('/login');
        }
        console.log("State change start", toState.authenticate);
      });

      //$rootScope.numberOfRecentBuilds = 10;
      //var jenkinsConfiguration = configuration.get('jenkins');
      //
      //if(jenkinsConfiguration) {
      //  $rootScope.numberOfRecentBuilds = storage.get('numberOfRecentBuilds') || 10;
      //  $rootScope.authenticated = jenkinsConfiguration.username && jenkinsConfiguration.token;
      //
      //  if ($rootScope.authenticated) {
      //    jenkins.login(jenkinsConfiguration.username, jenkinsConfiguration.token, jenkinsConfiguration.server)
      //      .then(function () {
      //        $rootScope.authenticated = true;
      //      })
      //      .catch(function () {
      //        $window.alert('Failed to authenticate, try again');
      //        $location.path('/');
      //      });
      //  }
      //} else {
      //  console.log("Saving location to redirect to", $location.path());
      //  $rootScope.redirectTo = $location.path();
      //  $location.path('/');
      //}
      //
      //$rootScope.saveNumberOfBuildsAndRefresh = function () {
      //  console.log("Setting number of builds", $rootScope.numberOfRecentBuilds);
      //  storage.set('numberOfRecentBuilds', $rootScope.numberOfRecentBuilds);
      //  $route.reload();
      //}
    }])
;
