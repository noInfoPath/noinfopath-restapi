FROM node:boron

RUN mkdir -p /usr/src/noinfopath/noinfopath-restapi
WORKDIR /usr/src/noinfopath/noinfopath-restapi

COPY package.json /usr/src/noinfopath/noinfopath-restapi
RUN npm install
RUN npm install grunt -g
CMD ["grunt", "noinfopath_config:dev"]

COPY . /usr/src/noinfopath/noinfopath-restapi

EXPOSE 4000
CMD ["npm", "start"]
