#!/bin/bash
set -e
cp ./managed-schema /opt/solr/server/solr/stats/conf/managed-schema
cp ./solrconfig.xml /opt/solr/server/solr/stats/conf/solrconfig.xml
