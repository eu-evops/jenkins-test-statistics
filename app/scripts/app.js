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
    'ui.bootstrap',
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
    'ngFileSaver',
    'ui.router',
    'tooltips'
  ])
  .config(['localStorageServiceProvider', function (localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('testReporter');
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $httpProvider.interceptors.push('JenkinsAuthenticationHttpInterceptor');
  }])
  .config(function ($stateProvider, $locationProvider) {
    // $locationProvider.hashPrefix('');

    $stateProvider
      .state('/', {
        url: '/',
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main',
        authenticate: true
      })
      .state('login', {
        url: '/login',
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        controllerAs: 'login',
        authenticate: false
      })
      .state('about', {
        url: '/about',
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .state('tests', {
        url: '/tests/:job',
        templateUrl: 'views/tests.html',
        controller: 'TestsCtrl',
        controllerAs: 'tests',
        authenticate: true
      })
      .state('builds', {
        url: '/builds',
        templateUrl: 'views/builds.html',
        controller: 'BuildsCtrl',
        controllerAs: 'builds',
        authenticate: true
      })
      .state('settings', {
        url: '/settings',
        templateUrl: 'views/settings.html',
        controller: 'SettingsCtrl',
        controllerAs: 'settings'
      })
      .state('view', {
        url: '/view/{view:any}',
        templateUrl: 'views/view.html',
        controller: 'ViewCtrl',
        controllerAs: 'view',
        authenticate: true
      });

    $locationProvider.html5Mode(true);
  })
  .run([
    '$rootScope', 'localStorageService', '$window', '$location', 'configuration', 'jenkins', '$transitions', '$state', '$window',
    function ($rootScope, storage, window, $location, configuration, jenkins, $transitions, $state, $window) {
      $rootScope.numberOfRecentBuilds = 3;
      var jenkinsConfiguration = configuration.get('jenkins');
      if (jenkinsConfiguration) {
        $rootScope.numberOfRecentBuilds = storage.get('numberOfRecentBuilds') || 10;
      }

      $rootScope.jenkins = jenkinsConfiguration;

      $transitions.onBefore({}, function (transition) {
        if(transition.to().authenticate && !$rootScope.authenticated) {
          $rootScope.redirectTo = $location.path();
          return transition.router.stateService.target('login');
        }
      });

      $rootScope.signOut = function () {
        console.log("Sign out");
        delete jenkinsConfiguration.token;
        configuration.set('jenkins', jenkinsConfiguration);
        $rootScope.authenticated = false;
        $state.go('login');
      };

      $rootScope.saveNumberOfBuildsAndRefresh = function () {
        if($rootScope.numberOfRecentBuilds > 5) {
          var shouldContinue = $window.confirm('Are you sure you want more than 5 recent builds? This generates quite a lot of requests to Jenkins.');
          if(!shouldContinue) {
            return;
          }
        }

        console.log("Setting number of builds", $rootScope.numberOfRecentBuilds);
        storage.set('numberOfRecentBuilds', $rootScope.numberOfRecentBuilds);
        $state.reload();
      };
    }])
;
