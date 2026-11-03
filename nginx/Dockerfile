# build react app
FROM node:22-slim AS build

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./

ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# serve our react app using nginx
FROM nginx:alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html