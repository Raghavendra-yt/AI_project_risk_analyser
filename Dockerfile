# ========================================================
# Stage 1: Build static assets for React Frontend
# ========================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

# Install dependencies (including devDependencies required for Vite build)
COPY client/package*.json ./
RUN npm install

# Copy source and build static compiled files to client/dist
COPY client/ ./
RUN npm run build

# ========================================================
# Stage 2: Create execution environment for Express Backend
# ========================================================
FROM node:20-alpine
WORKDIR /app

# Install production dependencies for Node Express server
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Copy Express server sources
COPY server/ ./server/

# Copy compiled static web UI assets from Stage 1 builder
COPY --from=frontend-builder /app/client/dist ./client/dist

# Define environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Cloud Run forwards public traffic on port 8080
EXPOSE 8080

# Start server
CMD ["node", "server/server.js"]
