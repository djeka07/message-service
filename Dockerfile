###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:18-alpine As development

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node yarn.lock ./

RUN yarn install --frozen-lockfile

COPY --chown=node:node . .

USER node

#######x############
# BUILD FOR PRODUCTION
###################

FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN npm run build

ENV NODE_ENV production

RUN yarn install --frozen-lockfile  --production && yarn cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:18-alpine As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

ENV NODE_ENV production

CMD [ "node", "dist/main.js" ]