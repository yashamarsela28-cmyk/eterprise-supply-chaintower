# Multi-stage production Dockerfile for Control Tower Frontend (Vite + React + Nginx)

# 1. Build Stage
FROM node:20-alpine AS build-stage

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY . .

# Compile optimized production bundle
RUN npm run build

# 2. Production Web Server Stage (Nginx Alpine)
FROM nginx:alpine AS production-stage

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled assets from build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
