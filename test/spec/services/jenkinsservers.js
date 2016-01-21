'use strict';

describe('Service: jenkinsServers', function () {

  // load the service's module
  beforeEach(module('testReporterApp'));

  // instantiate service
  var jenkinsServers;
  beforeEach(inject(function (_jenkinsServers_) {
    jenkinsServers = _jenkinsServers_;
  }));

  it('should do something', function () {
    expect(!!jenkinsServers).toBe(true);
  });

});
