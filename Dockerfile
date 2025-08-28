FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

# Start the MCP server
CMD ["node", "dist/index.js"]