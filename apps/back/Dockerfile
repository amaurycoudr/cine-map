###################
# DEV
###################
FROM node:18-alpine As development

WORKDIR /usr/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node tsconfig.json tsconfig.json

COPY --chown=node:node packages/contract/package.json packages/contract/package.json
COPY --chown=node:node apps/back/package.json apps/back/package.json
# Install app dependencies using the `npm ci` command instead of `npm install`
RUN npm run ci-all

# Bundle app source
COPY --chown=node:node packages/ packages/
COPY --chown=node:node apps/back/ apps/back/

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD
###################
FROM node:18-alpine As build

WORKDIR /usr/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node tsconfig.json tsconfig.json

# In order to run `npm run build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `npm ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/app/node_modules ./node_modules

COPY --chown=node:node  packages/ packages/
COPY --chown=node:node apps/back/ apps/back/

# Run the build command which creates the production bundle
RUN npm run build-all

ENV NODE_ENV production

# Running `npm ci` removes the existing node_modules directory and passing in --only=production ensures that only the production dependencies are installed. This ensures that the node_modules directory is as optimized as possible
RUN npm ci --only=production && npm cache clean --force

USER node
###################
# PRODUCTION
###################

FROM node:18-alpine As production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/app/node_modules ./node_modules
RUN rm -rf node_modules/@cine-map/
RUN mkdir node_modules/@cine-map/
COPY --chown=node:node --from=build /usr/app/packages/contract/dist ./node_modules/@cine-map/contract/dist
COPY --chown=node:node --from=build /usr/app/packages/contract/package.json ./node_modules/@cine-map/contract/package.json
COPY --chown=node:node --from=build /usr/app/apps/back/dist ./apps/back/dist

# Start the server using the production build
CMD [ "node", "apps/back/dist/main.js" ]