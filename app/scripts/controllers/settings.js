'use strict';

/**
 * @ngdoc function
 * @name testReporterApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the testReporterApp
 */
angular.module('testReporterApp')
  .controller('SettingsCtrl', ['configuration', 'jenkinsServers', function (configuration, jenkinsServers) {
    var jenkinsConfiguration = configuration.get('jenkins');
    this.jenkins = jenkinsConfiguration || {};

    this.jenkins.servers = jenkinsServers;

    this.setServer = function () {
      configuration.set('jenkins', this.jenkins);
    };

    this.jenkins.server = this.jenkins.servers[0];
    if (jenkinsConfiguration) {
      this.jenkins.server = jenkinsConfiguration.server;
    }

    this.setServer();
  }]);
