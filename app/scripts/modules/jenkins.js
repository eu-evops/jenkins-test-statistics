/**
 * TestReport
 *   testCases: [
 *     {
 *        suite: 'Test case suite',
 *        name: 'Test case name',
 *        executions: [
   *        {
   *          build: build,
   *          passing: boolean
   *        }
 *        ]
 *     }
 *   ]
 */

(function (window, angular) {
  'use strict';

  function TestCaseExecution(execution, build) {
    this.execution = execution;
    this.duration = execution.duration;
    this.build = build;
    this.url = this.build.url + 'testReport/(root)/' + this.execution.className + "/" + this.execution.name;
    this.passing = (this.execution.status === 'PASSED' || this.execution.status === 'FIXED');
  }

  function TestCase(testCase, build, job) {
    this.job = job;
    this.name = testCase.name;
    this.className = testCase.className;
    this.urlName = this.name.replace(/\s+/g, '_').replace(/[^\w\d]+/g, '_');
    this.url = build.url + "testReport/(root)/" + this.className + "/" + this.urlName + "/history/";
    this.build = build;
    this.executions = [];

    this.getPassRate = function () {
      this.passingCount = this.executions.filter(function (e) {
        return e.passing;
      }).length;

      return this.passingCount / this.executions.length;
    };

    this.mapping = function () {
      return this.job.name + " / " + this.className + " / " + this.name;
    };

    this.mappingString = this.mapping();

    this.addExecution = function (tce) {
      this.executions.push(tce);
    }
  }

  function TestReport(builds) {
    var self = this;
    this.cases = [];
    builds = builds || [];

    var testCaseMapping = {};

    builds.forEach(function (build) {
      if (!build || !build.report || !build.report.suites) {
        return;
      }
      build.report.suites.forEach(function (suite) {
        suite.cases.forEach(function (testCase) {
          var tc = new TestCase(testCase, build, build.job);
          var tce = new TestCaseExecution(testCase, build);

          if (testCaseMapping[tc.mapping()]) {
            var previousTC = testCaseMapping[tc.mapping()];
            previousTC.addExecution(tce);
          } else {
            tc.addExecution(tce);
            testCaseMapping[tc.mapping()] = tc;
            self.cases.push(tc);
          }
        });
      });
    });

    this.passingTests = 0;
    this.failingTests = 0;
    this.unstableTests = 0;

    this.cases.forEach(function (testCase) {
      var passing = testCase.executions.every(function(e) { return e.passing })
      var failing = testCase.executions.every(function(e) { return !e.passing })
      var unstable = !passing && !failing

      if(passing) {
        self.passingTests += 1;
      }

      if(failing) {
        self.failingTests += 1;
      }

      if(unstable) {
        self.unstableTests += 1;
      }
    });

    this.passRate = this.passingTests / this.cases.length;
    this.failRate = this.failingTests / this.cases.length;
    this.unstableRate = this.unstableTests / this.cases.length;
  }

  TestReport.prototype.numberPassingTimes = function (n) {
    var testsPassing = 0;
    this.cases.forEach(function (testCase) {
      var numberPassing = testCase.executions.filter(function(execution) {
          return execution.passing;
        }).length;

      if(numberPassing === testCase.executions.length || numberPassing > n - 1) {
        testsPassing += 1;
      }
    });
    return testsPassing;
  }

  TestReport.prototype.passRatePassingTimes = function (n) {
    return this.numberPassingTimes(n) / this.cases.length || 0;
  };


  var sanitiseJob = function (job, view) {
    job.report = new TestReport();
    job.view = view;
    job.tests = job.tests || [];
    job.builds = job.builds || [];

    job.builds = job.builds.map(function (build) {
      return sanitiseBuild(build);
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

  var sanitiseBuild = function (build) {
    build.aborted = build.result === 'ABORTED';
    build.passing = !build.aborted && build.result !== 'FAILURE' && build.result != 'UNSTABLE';

    return build;
  };

  var jenkins = angular.module('Jenkins', ['LocalStorageModule', 'base64', 'Configuration']);

  jenkins.config(['localStorageServiceProvider', function (localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix('jenkins');
  }]);

  jenkins.provider('jenkins', function JenkinsProvider() {
    this.$get =
      ['$http', '$base64', 'configuration', '$rootScope',
        function (http, base64, configuration, $rootScope) {
          $rootScope.$broadcast('jenkins-newInstance');

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
              });
          };

          var getAllJobsRecursive = function (node) {
            var jobs = [];

            node.jobs.forEach(function (j) {
              jobs.push(sanitiseJob(j, node));
            });

            if (node.views) {
              // TODO Fix recursion
              node.views.forEach(function (v) {
                getAllJobsRecursive(v).forEach(function (sj) {
                  jobs.push(sj);
                });
              });
            }

            return jobs;
          };

          var sanitiseView = function (view, viewName) {
            view.name = viewName;
            view.passRate = null;
            view.allJobs = getAllJobsRecursive(view);

            if (view.allJobs && view.allJobs.length > 0) {
              var sumPassRate = view.allJobs
                .filter(function (j) {
                  return j.passRate !== null;
                })
                .map(function (a) {
                  return a.passRate;
                }).reduce(function (a, b) {
                  return a + b;
                }, 0);

              view.passRate = sumPassRate / view.allJobs.filter(function (j) {
                  return j.passRate !== null;
                }).length || null;
            }

            return view;
          };

          var generateFullViewName = function (v) {
            var n = v.name;
            var p = v.parent;
            while (p != null && p.name !== undefined) {
              n = p.name + ' -> ' + n;
              p = p.parent;
            }

            return n;
          };

          var flattenViews = function (jenkinsView, parent) {
            if (parent === undefined) {
              parent = null;
            }

            var views = [];
            sanitiseView(jenkinsView, jenkinsView.name);

            jenkinsView.parent = parent;
            jenkinsView.fullName = generateFullViewName(jenkinsView);
            if (jenkinsView.url) {
              jenkinsView.relativeUrl = jenkinsView.url.replace(getConf().url, '');
            }

            if (!jenkinsView.views) {
              return views;
            }

            jenkinsView.views.forEach(function (subView) {
              views.push(subView);

              var subViews = flattenViews(subView, jenkinsView);
              subViews.forEach(function (sv) {
                views.push(sv);
              });
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

            var grouping = {};
            builds.forEach(function (b) {
              b.report = new TestReport([b]);
              if (b && b.job) {
                grouping[b.job.name] = grouping[b.job.name] || [];
                grouping[b.job.name].push(b);
              }
            });

            var allBuilds = builds.length;
            var processedBuilds = 0;

            angular.forEach(grouping, function (group) {
              group.forEach(function (build) {
                promises.push(
                  http.get(build.url + '/testReport/api/json?tree=failCount,passCount,skipCount,suites[cases[className,duration,name,skipped,status]]')
                    .then(function (response) {
                      // Store jenkins test report under report key
                      build.report = response.data;

                      // Update report with calculated statistics
                      build.report.totalTests = (build.report.passCount + build.report.failCount + build.report.skipCount);
                      build.report.passRate = build.report.passCount / build.report.totalTests;

                      if (build.job) {
                        build.job.report = new TestReport(build.job.builds);
                      }

                      return build;
                    })
                    .catch(function (error) {
                      console.error('Error generating report', error)
                      build.report = {
                        numberOfTests: 0,
                        passRate: null,
                        suites: []
                      };

                      return build;
                    })
                    .finally(function (build) {
                      processedBuilds++;
                      var progress = processedBuilds / allBuilds * 100;
                      $rootScope.$broadcast('jenkins-report', progress);
                      return build;
                    })
                );
              });
            });

            return Promise.all(promises)
              .then(function (builds) {
                return new TestReport(builds);
              });
          };

          var getNumberOfBuilds = function () {
            return '{,' + $rootScope.numberOfRecentBuilds + '}';
          };

          var getViews = function () {
            return http.get(getConf().url + '/api/json?depth=100&tree=' + recursiveTreeCall(10, ['name', 'url', 'jobs[displayName,name,builds[result]' + getNumberOfBuilds() + ']']))
              .then(function (response) {
                return flattenViews(response.data);
              });
          };

          var getView = function (view) {
            return http.get(getConf().url + '/' + view + '/api/json?depth=3&tree=' + recursiveTreeCall(10, ['jobs[name,displayName,builds[name,result,number,url]' + getNumberOfBuilds() + ']']))
              .then(function (response) {
                return sanitiseView(response.data, view);
              });
          };

          var getBuilds = function (job) {
            if (typeof job === 'object') {
              job = job.name;
            }

            return http.get(getConf().url + '/job/' + job + '/api/json?tree=builds[*]' + getNumberOfBuilds())
              .then(function (response) {
                // excluding currently running builds
                var filteredBuilds = response.data.builds.filter(function (b) {
                  return !b.building;
                });

                return filteredBuilds.map(sanitiseBuild);
              });
          };

          var getJob = function (name) {
            return http.get(getConf().url + '/job/' + name + '/api/json')
              .then(function (response) {
                return response.data;
              });
          };

          return {
            login: login,
            views: getViews,
            view: getView,
            job: getJob,
            builds: getBuilds,
            testReport: testReport
          };
        }]
    ;
  })
  ;
})
(window, angular);
