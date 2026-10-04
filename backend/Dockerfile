# Multi-stage production Dockerfile for Control Tower Backend API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy backend source
COPY . .

# Final runtime image
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy application artifacts from builder
COPY --from=builder /app /app

# Security: Run as unprivileged non-root node user
USER node

# Expose backend REST API port
EXPOSE 5000

# Container healthcheck against real Express health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]
