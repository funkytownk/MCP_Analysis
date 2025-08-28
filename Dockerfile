FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

# Expose port for HTTP server
EXPOSE 3000

# Start the HTTP MCP server
CMD ["node", "dist/http-server.js"]