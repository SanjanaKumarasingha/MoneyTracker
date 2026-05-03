FROM node:20-alpine AS client-builder
WORKDIR /app/Client
COPY Client/package*.json ./
RUN npm ci
COPY Client/ ./
ARG REACT_APP_BASE_URL=/api
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL
RUN npm run build

FROM node:20-alpine AS server-builder
WORKDIR /app/Server
COPY Server/package*.json ./
RUN npm ci
COPY Server/ ./
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app/Server
ENV NODE_ENV=production
COPY Server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server-builder /app/Server/dist ./dist
COPY --from=client-builder /app/Client/build /app/Client/build
EXPOSE 5000
CMD ["node", "dist/main"]
