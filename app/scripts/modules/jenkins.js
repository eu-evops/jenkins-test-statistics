(function (window, angular) {
  'use strict';

  function TestCaseExecution(execution) {
    this.execution = execution;
    this.duration = execution.duration;
    this.passing = this.execution.status == 'PASSED'
      || this.execution.status == 'FIXED'
  }

  function TestCase(testCase, baseUrl, job) {
    this.job = job;
    this.name = testCase.name;
    this.className = testCase.className;
    this.urlName = this.name.replace(/\s+/g, '_').replace(/[^\w\d]+/g, '_');
    this.url = baseUrl + "testReport/(root)/" + this.className + "/" + this.urlName + "/history/"
    this.executions = [new TestCaseExecution(testCase)];

    this.getPassRate = function () {
      this.passingCount = this.executions.filter(function (e) {
        return e.passing;
      }).length;

      return this.passingCount / this.executions.length;
    }
  }

  function TestReport(builds) {
    var self = this;
    this.cases = [];
    builds = builds || [];

    builds.forEach(function (build) {
      if (!build || !build.report || !build.report.suites) return;
      build.report.suites.forEach(function (suite) {
        suite.cases.forEach(function (testCase) {
          if (testCase.name == "dummy" || testCase.name == "<init>") return;
          var testCaseMatches = self.cases.filter(function (tc) {
            if (build.job)
              return tc.name == testCase.name && tc.className == testCase.className && tc.job.name == build.job.name;

            return tc.name == testCase.name && tc.className == testCase.className;
          });

          if (testCaseMatches.length == 0) {
            self.cases.push(new TestCase(testCase, build.url, build.job));
          } else {
            var executionMatches = testCaseMatches[0].executions.filter(function (ex) {
              return ex.duration == testCase.duration;
            });
            if (executionMatches.length > 0) return;
            testCaseMatches[0].executions.push(new TestCaseExecution(testCase));
          }
        })
      });
    });

    this.passingTests = 0;
    this.totalTests = 0;
    this.cases.forEach(function (testCase) {
      testCase.executions.forEach(function (execution) {
        if (execution.passing) self.passingTests++;
        self.totalTests++;
      })
    });

    this.passRate = this.passingTests / this.totalTests;
  }


  var sanitiseJob = function (job, view) {
    job.report = new TestReport();
    job.view = view;
    job.tests = job.tests || [];

    job.builds = job.builds.map(function (build) {
      return sanitiseBulid(build);
    });

    job.passingBuilds = job.builds.filter(function (b) {
      return b.passing;
    }).length;

    job.failingBuilds = job.builds.filter(function (b) {
      return !b.passing;
    }).length;

    if (job.builds && job.builds.length > 0) {
      job.passRate = job.passingBuilds / job.builds.length;
    } else {
      job.passRate = null;
    }

    return job;
  };

  var sanitiseBulid = function (build) {
    build.aborted = build.result == 'ABORTED';
    build.passing = !build.aborted && build.result != 'FAILURE';

    return build;
  };

  var jenkins = angular.module('Jenkins', ['LocalStorageModule', 'base64', 'Configuration']);

  jenkins.config(['localStorageServiceProvider', function (localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('jenkins');
  }]);

  jenkins.provider('jenkins', function JenkinsProvider() {
    // default Jenkins URL
    this.baseUrl = 'http://localhost:8080/jenkins';

    this.$get =
      ['$http', '$base64', 'configuration', '$rootScope',
        function (http, base64, configuration, $rootScope) {
          console.log('Getting jenkins instance');
          var self = this;
          var url = self.baseUrl;

          var getConf = function () {
            var jenkinsConfiguration = configuration.get('jenkins') || {};
            if (jenkinsConfiguration && jenkinsConfiguration.server) {
              jenkinsConfiguration.url = jenkinsConfiguration.server.replace(/\/?$/, '');
            }
            return jenkinsConfiguration;
          };

          var login = function (user, pass, server) {
            var jenkinsConfiguration = getConf();

            // Use server passed in, otherwise use the one from configuration;
            server = server || jenkinsConfiguration.server;

            var basicAuth = "Basic " + base64.encode(user + ':' + pass);
            return http.get(server + "/me/configure", {
                headers: {
                  Authorization: basicAuth
                }
              })
              .then(function (response) {
                var match = response.data.match('name=._\.apiToken. value=["\']?([^"\']+)["\']?');
                if (match) {
                  jenkinsConfiguration.token = match[1];
                  jenkinsConfiguration.username = user;
                  configuration.set('jenkins', jenkinsConfiguration);
                }
              })
              .catch(function (error) {
                throw 'Authentication error';
              });
          };

          var sanitiseView = function (view, viewName) {
            view.name = viewName;
            view.passRate = null;

            var getAllJobsRecursive = function (node) {
              var jobs = node.jobs.map(function (j) {
                return sanitiseJob(j, node);
              });

              if (node.views) {
                node.views.forEach(function (v) {
                  v.jobs.forEach(function (j) {
                    jobs.push(sanitiseJob(j, v));
                  })
                })
              }

              return jobs;
            };

            view.allJobs = getAllJobsRecursive(view);

            if (view.allJobs && view.allJobs.length > 0) {
              var sumPassRate = view.allJobs
                .filter(function (j) {
                  return j.passRate != null;
                })
                .map(function (a) {
                  return a.passRate;
                }).reduce(function (a, b) {
                  return a + b;
                }, 0);

              var averagePassRate = sumPassRate / view.allJobs.filter(function (j) {
                  return j.passRate != null;
                }).length || null;

              view.passRate = averagePassRate;
            }

            return view;
          };

          var sanitiseViews = function (top) {
            var views = [];

            if (!top.views) return views;
            top.views.forEach(function (view) {
              views.push(view);

              view.allJobs = view.jobs.map(function (job) {
                return sanitiseJob(job, view);
              });

              view.fullName = view.name;
              view.relativeUrl = view.url.replace(getConf().url, '');
              var subViews = sanitiseViews(view);
              subViews.forEach(function (subView) {
                subView.fullName = view.fullName + ' -> ' + subView.name;
                subView.jobs.forEach(function (job) {
                  view.allJobs.push(sanitiseJob(job, subView));
                });

                views.push(subView);
              });

              sanitiseView(view, view.name);
            });

            return views;
          };

          var recursiveTreeCall = function (depth, parameters) {
            var call = parameters.join(',');

            for (var i = 0; i < depth; i++) {
              call = parameters + ',views[' + call + ']';
            }


            return call;
          };

          // build report per
          // - build
          // - job
          // - view

          var testReport = function (builds) {
            var promises = [];

            builds.forEach(function (build) {
              promises.push(http.get(build.url + '/testReport/api/json?tree=failCount,passCount,skipCount,suites[cases[className,duration,name,skipped,status]]')
                .then(function (response) {
                  build.report = response.data;
                  build.report.numberOfTests = (build.report.passCount + build.report.failCount + build.report.skipCount);
                  build.report.passRate = build.report.passCount / build.report.numberOfTests;

                  if (build.job) build.job.report = build.report;

                  return build;
                })
                .catch(function () {
                  build.report = {
                    numberOfTests: 0,
                    passRate: null,
                    suites: []
                  };

                  return build;
                })
              );
            });

            return Promise.all(promises)
              .then(function (builds) {
                var report = new TestReport(builds);
                var grouping = {};
                builds.forEach(function (b) {
                  console.log(b);
                  b.report = new TestReport([b]);
                  if (b && b.job) {
                    grouping[b.job.name] = grouping[b.job.name] || [];
                    grouping[b.job.name].push({job: b.job, build: b});
                  }
                });

                angular.forEach(grouping, function (builds) {
                  builds[0].job.report = new TestReport(builds.map(function (obj) {
                    return obj.build;
                  }));

                  console.log(builds[0].job.report);
                });

                return report;
              });
          };

          var getNumberOfBuilds = function () {
            return '{,' + $rootScope.numberOfRecentBuilds + '}';
          };

          var getViews = function () {
            return http.get(getConf().url + '/api/json?depth=100&tree=' + recursiveTreeCall(10, ['name', 'url', 'jobs[displayName,name,builds[result]' + getNumberOfBuilds() + ']']))
              .then(function (response) {
                return sanitiseViews(response.data);
              })
          };

          var getView = function (view) {
            return http.get(getConf().url + '/' + view + '/api/json?depth=3&tree=' + recursiveTreeCall(10, ['jobs[name,displayName,builds[name,result,number,url]' + getNumberOfBuilds() + ']']))
              .then(function (response) {
                return sanitiseView(response.data, view);
              });
          };

          var getBuilds = function (job) {
            return http.get(getConf().url + '/job/' + job + '/api/json?tree=builds[*]' + getNumberOfBuilds())
              .then(function (response) {
                return response.data.builds.map(sanitiseBulid);
              });
          };

          return {
            login: login,
            views: getViews,
            view: getView,
            builds: getBuilds,
            testReport: testReport
          };
        }];
  });
})(window, angular);
