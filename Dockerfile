FROM node:4.2.1

ENV NODE_ENV production
ENV JENKINS_SERVERS http://localhost:8080/jenkins

WORKDIR /app

ADD . /app

RUN npm install -g grunt-cli bower && npm install && ls -la node_modules && grunt --version && bower install --allow-root && grunt build

EXPOSE 9000

CMD grunt serve:dist
