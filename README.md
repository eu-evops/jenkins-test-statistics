# Jenkins Test Statistics

This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.15.1.

## Build & development

Run `gulp` for building and `gulp serve` for preview.

## Configuration

JENKINS_SERVERS - Environment variable that contains comma separated list of servers (full server with servlet name i.e. http://my.jenkins.com:8080/jenkins. This will be available as a list of servers to choose from when launching the application

## Docker

This repository is automatically built on docker hub. You can run latest deployment by running following docker commands:

```
docker run -d --name stats_solr -p 8983:8983 evops/jenkins-test-statistics:solr-feature_add-view-job-facet-to-error-report
docker exec -it stats_solr bin/solr create -c stats -d /tmp/stats
docker run -d --name stats -p 9000:9000 --link stats_solr:solr -e SOLR_ADDRESS=http://solr:8983 evops/jenkins-test-statistics:feature_add-view-job-facet-to-error-report
open http://localhost:9000/
```
