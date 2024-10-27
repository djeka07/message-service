###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:22-alpine AS development

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node yarn.lock ./
COPY --chown=node:node .yarnrc.yml ./
COPY --chown=node:node .yarn ./.yarn

RUN corepack enable

RUN yarn install --immutable

COPY --chown=node:node . .

USER node

#######x############
# BUILD FOR PRODUCTION
###################

FROM node:22-alpine AS build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY --chown=node:node yarn.lock ./
COPY --chown=node:node .yarnrc.yml ./
COPY --chown=node:node .yarn ./.yarn

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN corepack enable

RUN yarn build

ENV NODE_ENV=production

RUN yarn workspaces focus && yarn cache clean --all

USER node

###################
# PRODUCTION
###################

FROM node:22-alpine AS production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

ENV NODE_ENV=production

CMD [ "node", "dist/main.js" ]