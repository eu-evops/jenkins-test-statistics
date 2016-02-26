FROM node:4.2.1

ENV NODE_ENV production
ENV JENKINS_SERVERS http://localhost:8080/jenkins

WORKDIR /app

ADD . /app

RUN npm install -g gulp bower && npm install && bower install --allow-root && gulp build

EXPOSE 9000

CMD npm start
