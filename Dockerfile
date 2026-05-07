### Dockerfile for PulseDocs (Next.js)
# Multi-stage build: install, build, prune devDeps, produce small runtime image

FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (including devDeps needed for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Remove dev dependencies to shrink final image
RUN npm prune --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000

# Start the Next.js production server
CMD ["npm", "run", "start"]
