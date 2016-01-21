'use strict';

describe('Directive: passRate', function () {

  // load the directive's module
  beforeEach(module('testReporterApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<pass-rate></pass-rate>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the passRate directive');
  }));
});
