FROM node:10
RUN mkdir /melynxbot
ADD . /melynxbot
WORKDIR /melynxbot
RUN yarn
EXPOSE 80

