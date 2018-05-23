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

  String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

  function testCaseUrlName(name) {
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z\d]/g, '_');
  }

  function TestCaseExecution(execution, build) {
    this.name = execution.name;
    this.className = execution.className;
    this.execution = execution;
    this.error = execution.errorDetails || execution.stderr;
    this.errorStackTrace = execution.errorStackTrace;
    this.stderr = execution.stderr;
    this.stdout = execution.stdout;
    this.duration = execution.duration;
    this.build = build;
    //
    this.id = (build.url + this.className + this.name).hashCode();

    var urlComps = this.execution.className.split('.');
    var packageName = urlComps.splice(0, urlComps.length - 1).join('.') || '(root)';
    var className = urlComps[urlComps.length - 1];

    this.url = this.build.url + 'testReport/' + packageName + '/' + className + "/" + testCaseUrlName(this.execution.name);
    this.passing = (this.execution.status === 'PASSED' || this.execution.status === 'FIXED');
    this.skipped = this.execution.status === 'SKIPPED';
  }

  function TestCase(testCase, build, job) {
    this.job = job;
    this.name = testCase.name;
    this.className = testCase.className;
    this.urlName = testCaseUrlName(this.name);

    var urlComps = testCase.className.split('.');
    var packageName = urlComps.splice(0, urlComps.length - 1).join('.') || '(root)';
    var className = urlComps[urlComps.length - 1];

    this.url = build.url + "testReport/" + packageName + "/" + className + "/" + this.urlName + "/history/";
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
    };
  }

  function TestReport(buildsWithTestReports) {
    var self = this;
    this.cases = [];
    buildsWithTestReports = buildsWithTestReports || [];

    var testCaseMapping = {};

    buildsWithTestReports.forEach(function (build) {
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
    this.skippedTests = 0;

    this.cases.forEach(function (testCase) {
      testCase.passing = testCase.executions.every(function (e) {
        return e.passing;
      });

      // Only check latest executions
      testCase.skipped = testCase.executions[0].skipped;
      testCase.failing = testCase.executions.every(function (e) {
        return !e.passing && !e.skipped;
      });
      testCase.unstable = !testCase.passing && !testCase.failing && !testCase.skipped;

      if (testCase.passing) {
        testCase.status = 'Passed';
        self.passingTests += 1;
      }
      if (testCase.skipped) {
        testCase.status = 'Skipped';
        self.skippedTests += 1;
      }
      if (testCase.failing) {
        testCase.status = 'Failed';
        self.failingTests += 1;
      }
      if (testCase.unstable) {
        testCase.status = 'Unstable';
        self.unstableTests += 1;
      }
    });

    this.passRate = this.passingTests / this.cases.length || 0;
    this.failRate = this.failingTests / this.cases.length || 0;
    this.unstableRate = this.unstableTests / this.cases.length || 0;
    this.skippedRate = this.skippedTests / this.cases.length || 0;
  }

  TestReport.prototype.numberPassingTimes = function (n) {
    var testsPassing = 0;
    this.cases.forEach(function (testCase) {
      var numberPassing = testCase.executions.filter(function (execution) {
        return execution.passing;
      }).length;

      if (numberPassing === testCase.executions.length || numberPassing > n - 1) {
        testsPassing += 1;
      }
    });
    return testsPassing;
  };

  TestReport.prototype.passRatePassingTimes = function (n) {
    return this.numberPassingTimes(n) / this.cases.length || 0;
  };

  var sanitiseBuild = function (build) {
    build.aborted = build.result === 'ABORTED';
    build.passing = !build.aborted && build.result !== 'FAILURE' && build.result !== 'UNSTABLE';

    return build;
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
                var tokenMatch = response.data.match('name=._\.apiToken..*?value=["\']?([^"\']+)["\']?');
                if (tokenMatch) {
                  jenkinsConfiguration.token = tokenMatch[1];
                  jenkinsConfiguration.username = user;
                }

                var userMatch = response.data.match('name=._\.fullName..*?value="(.*?)"');
                if (userMatch) {
                  jenkinsConfiguration.name = userMatch[1];
                }

                var emailMatch = response.data.match('name=.email.address..*?value="(.*?)"');
                if (emailMatch) {
                  jenkinsConfiguration.email = emailMatch[1];
                }

                configuration.set('jenkins', jenkinsConfiguration);
                return jenkinsConfiguration;
              });
          };

          var getAllJobsRecursive = function (view, parentPath) {
            var jobs = [];
            view.jobs = view.jobs || [];

            view.jobs.forEach(function (j) {
              jobs.push(sanitiseJob(j, parentPath));
            });

            if (view.views) {
              // TODO Fix recursion
              view.views.forEach(function (v) {
                getAllJobsRecursive(v, parentPath + '/view/' + v.name).forEach(function (sj) {
                  jobs.push(sj);
                });
              });
            }

            view.allJobs = view.allJobs || jobs;
            return jobs;
          };

          /**
           * Flattens the view structure associating each
           * job with it's view path
           * @param view
           * @param viewPath
           * @returns {*}
           */
          var sanitiseView = function (view, viewPath) {
            var sanitisedView = {};

            sanitisedView.name = viewPath;
            sanitisedView.passRate = null;
            sanitisedView.allJobs = getAllJobsRecursive(view, viewPath);

            if (sanitisedView.allJobs && sanitisedView.allJobs.length > 0) {
              var sumPassRate = sanitisedView.allJobs
                .filter(function (j) {
                  return j.passRate !== null;
                })
                .map(function (a) {
                  return a.passRate;
                }).reduce(function (a, b) {
                  return a + b;
                }, 0);

              sanitisedView.passRate = sumPassRate / sanitisedView.allJobs.filter(function (j) {
                return j.passRate !== null;
              }).length || null;
            }

            return sanitisedView;
          };

          var generateFullViewName = function (v) {
            var n = v.name;
            var p = v.parent;
            while (p !== null && p.name !== undefined) {
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
            sanitiseView(jenkinsView, jenkinsView.name || "");

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
                  http.get(build.url + '/testReport/api/json?tree=failCount,passCount,skipCount,suites[cases[className,duration,name,skipped,status,stderr,stdout,errorDetails,errorStackTrace]]')
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
                    .catch(function () {
                      build.report = {
                        numberOfTests: 0,
                        passRate: null,
                        suites: []
                      };

                      return build;
                    })
                    .finally(function (build) {
                      processedBuilds++;
                      var progress = Math.ceil(processedBuilds / allBuilds * 100);
                      if(progress % 10 === 0) {
                        $rootScope.$broadcast('jenkins-report', {
                          progress: progress,
                          processed: processedBuilds,
                          total: allBuilds
                        });
                      }
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

          var getAllViews = function () {
            return http.get(getConf().url + '/api/json?tree=' + recursiveTreeCall(5, ['name', 'url', 'jobs[name]']))
              .then(function (response) {
                return flattenViews(response.data);
              });
          };

          var getView = function (view) {
            var treeCallParameters = recursiveTreeCall(10, ['name,jobs[name,displayName,builds[name,result,number,url]' + getNumberOfBuilds() + ']']);
            return http.get(getConf().url + '/' + view + '/api/json?depth=3&tree=' + treeCallParameters)
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
            getAllViews: getAllViews,
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
