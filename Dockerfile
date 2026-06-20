# Build stage
FROM node:18-alpine AS builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Final stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built node_modules from builder
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy backend code
COPY backend/ ./backend/

# Copy frontend
COPY frontend/ ./frontend/

WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('https://agri-full.onrender.com/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]

