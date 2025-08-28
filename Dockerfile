FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) for build
RUN npm ci

# Copy source files
COPY . .

# Build the TypeScript
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port for HTTP server
EXPOSE 3000

# Start the minimal MCP server with full 6-prompt analysis
CMD ["node", "dist/minimal-server.js"]