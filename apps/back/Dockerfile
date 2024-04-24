FROM node:18-alpine

WORKDIR /usr/app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json

COPY packages/contract/package.json packages/contract/package.json
COPY apps/back/package.json apps/back/package.json


RUN npm run ci-all

COPY packages/ packages/
COPY apps/back/ apps/back/



