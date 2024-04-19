FROM node:18-alpine

WORKDIR /usr/app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json

COPY packages/contract/package.json packages/contract/package.json
COPY apps/front/package.json apps/front/package.json

RUN npm run ci-all

COPY packages/ packages/
COPY apps/front/ apps/front/



