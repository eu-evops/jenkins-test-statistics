'use strict';

describe('Service: JenkinsAuthenticationHttpInterceptor', function () {

  // load the service's module
  beforeEach(module('testReporterApp'));

  // instantiate service
  var JenkinsAuthenticationHttpInterceptor;
  beforeEach(inject(function (_JenkinsAuthenticationHttpInterceptor_) {
    JenkinsAuthenticationHttpInterceptor = _JenkinsAuthenticationHttpInterceptor_;
  }));

  it('should do something', function () {
    expect(!!JenkinsAuthenticationHttpInterceptor).toBe(true);
  });

});
