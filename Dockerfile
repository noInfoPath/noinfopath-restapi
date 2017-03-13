FROM node:boron

RUN mkdir -p /usr/src/noinfopath/noinfopath-restapi
WORKDIR /usr/src/noinfopath/noinfopath-restapi

COPY package.json /usr/src/noinfopath/noinfopath-restapi
RUN npm install
RUN npm install grunt -g

COPY . /usr/src/noinfopath/noinfopath-restapi

RUN grunt noinfopath_config:prod

EXPOSE 443
CMD ["npm", "start"]
