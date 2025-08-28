FROM node:18-slim AS builder

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
FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port for HTTP server
EXPOSE 3000

# Start the HTTP MCP server
CMD ["node", "dist/mcp-http-server.js"]