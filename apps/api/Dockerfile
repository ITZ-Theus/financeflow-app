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

RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY package*.json ./

ENV NODE_ENV=production
ENV PORT=3333
EXPOSE 3333

CMD ["npm", "start"]
