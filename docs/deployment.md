# Deployment

This repository contains three apps:

- `Client`: React web app
- `Server`: NestJS API and static web host
- `app`: Flutter app

The web deployment path is:

1. Build `Client`
2. Build `Server`
3. Run the NestJS server
4. Let NestJS serve the built React app and the API from the same domain

## Production environment variables

Server:

```env
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_PORT=3306
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=your-db-name
JWT_SECRET=replace-this
JWT_EXPIRATION_TIME=3600s
```

Client:

```env
REACT_APP_BASE_URL=/api
```

If the frontend is deployed separately from the API, set `REACT_APP_BASE_URL` to the full API origin, for example:

```env
REACT_APP_BASE_URL=https://api.example.com/api
```

## Option 1: Deploy as one web service

Build commands:

```bash
cd Client && npm ci && npm run build
cd ../Server && npm ci && npm run build
```

Start command:

```bash
cd Server && npm run start:prod
```

This works when the deployment platform checks out the whole repository and the server runs from the repo root structure.

## Option 2: Deploy with Docker

Build:

```bash
docker build -t money-tracker .
```

Run:

```bash
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DB_HOST=your-db-host \
  -e DB_PORT=3306 \
  -e DB_USERNAME=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e DB_DATABASE=your-db-name \
  -e JWT_SECRET=replace-this \
  -e JWT_EXPIRATION_TIME=3600s \
  money-tracker
```

## Notes

- The current TypeORM config uses `synchronize: true`. That is convenient for development but risky in production.
- The Flutter app has its own deployment flow and is not included in the web deployment above.
