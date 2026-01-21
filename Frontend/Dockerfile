# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files desde Frontend/
COPY Frontend/package*.json ./

# Install dependencies
RUN npm install

# Copiar source code desde Frontend/
COPY Frontend/ .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config desde Frontend/
COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Puerto (Railway usa variable PORT, nginx usa 8080 por defecto)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
