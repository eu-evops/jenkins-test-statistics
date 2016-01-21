'use strict';

describe('Controller: BuildsCtrl', function () {

  // load the controller's module
  beforeEach(module('testReporterApp'));

  var BuildsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BuildsCtrl = $controller('BuildsCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(BuildsCtrl.awesomeThings.length).toBe(3);
  });
});
