# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Run the crawler - CRAWL_SCHEDULER_ENABLED=true runs the periodic scheduler instead of a single pass
CMD ["node", "entrypoint.js"]
