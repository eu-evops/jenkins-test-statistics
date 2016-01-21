'use strict';

/**
 * @ngdoc service
 * @name testReporterApp.JenkinsAuthenticationHttpInterceptor
 * @description
 * # JenkinsAuthenticationHttpInterceptor
 * Service in the testReporterApp.
 */
angular.module('testReporterApp')
  .service('JenkinsAuthenticationHttpInterceptor', ['$base64', 'configuration', function (base64, configuration) {

    this.request = function (config) {
      var jenkinsConfiguration = configuration.get('jenkins') || {};
      if(jenkinsConfiguration.username && jenkinsConfiguration.token) {
        config.headers['Authorization'] = 'Basic ' + base64.encode(jenkinsConfiguration.username + ':' + jenkinsConfiguration.token);
      }

      return config;
    };
    // AngularJS will instantiate a singleton by calling "new" on this function
  }]);
