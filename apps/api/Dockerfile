FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS development

RUN npm install

COPY . .

ENV PORT=3333
EXPOSE 3333

CMD ["npm", "run", "dev"]

FROM development AS build

RUN npm run build

FROM base AS production

ARG APP_VERSION=1.0.0
ARG GIT_SHA=
ARG BUILD_TIME=

RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY package*.json ./

ENV NODE_ENV=production
ENV PORT=3333
ENV APP_VERSION=$APP_VERSION
ENV GIT_SHA=$GIT_SHA
ENV BUILD_TIME=$BUILD_TIME
EXPOSE 3333

CMD ["npm", "start"]
