(function (window, angular) {
  'use strict';

  var STORAGE_KEY = 'configuration';

  var configuration = angular.module('Configuration', ['LocalStorageModule']);

  configuration.service('configuration', ['localStorageService', function (storage) {
    var config = {};

    var storedConfig = storage.get(STORAGE_KEY);
    if(storedConfig) {
      config = JSON.parse(storedConfig);
    }

    return {
      get: function(name) {
        return config[name];
      },
      set: function(name, value) {
        config[name] = value;
        storage.set(STORAGE_KEY, JSON.stringify(config));
      }
    };
  }]);
})(window, angular);
