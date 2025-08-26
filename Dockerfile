# Use Node.js 22.12.0 specifically to meet Angular CLI requirements
FROM node:22.12.0-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the Angular application for production
RUN npm run build

# Install a simple HTTP server to serve the built files
RUN npm install -g http-server

# Expose port 8080 (http-server default)
EXPOSE 8080

# Start the application by serving the built files
CMD ["http-server", "dist/angular-auth-app", "-p", "8080", "-c-1"]
