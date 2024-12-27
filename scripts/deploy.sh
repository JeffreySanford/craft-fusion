#!/bin/bash

# Constants
FRONTEND_BUILD_PATH="dist/apps/craft-web/browser"
NGINX_PATH="/usr/share/nginx/html"
BACKEND_NEST_PATH="dist/apps/craft-nest/main.js"
BACKEND_GO_PATH="dist/apps/craft-go/main"
PM2_APP_NAME_NEST="craft-nest"
PM2_APP_NAME_GO="craft-go"

# Step 1: Clean and install dependencies
./scripts/clean.sh
./scripts/install.sh

# Step 2: Build frontend
echo "Building Angular frontend..."
npx nx run craft-web:build:production
cp -r "$FRONTEND_BUILD_PATH/" "$NGINX_PATH/"
systemctl restart nginx
echo "Frontend build deployed to $NGINX_PATH"

# Step 3: Build backend (NestJS)
echo "Building NestJS backend..."
npx nx run craft-nest:build:production

# Step 4: Build backend (Go)
echo "Building Go backend..."
go mod tidy
go build -o "$BACKEND_GO_PATH"

# Step 5: Start services with PM2
echo "Restarting PM2 services..."
pm2 restart $PM2_APP_NAME_NEST --update-env || pm2 start "$BACKEND_NEST_PATH" --name "$PM2_APP_NAME_NEST"
pm2 restart $PM2_APP_NAME_GO --update-env || pm2 start "$BACKEND_GO_PATH" --name "$PM2_APP_NAME_GO"
pm2 save

echo "Deployment completed."
