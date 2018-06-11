FROM solr:7.3.1-alpine
COPY web.xml /opt/solr/server/solr-webapp/webapp/WEB-INF/web.xml
COPY . /tmp/solrconfig
#RUN solr start && wait && solr create -c stats -d /tmp/solrconfig


