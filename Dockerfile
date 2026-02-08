FROM node:22-alpine

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
# Install all dependencies
RUN pnpm i --frozen-lockfile
# COPY Rest of the files
COPY . .

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=development
ENV PORT=4001

# Expose the port
EXPOSE ${PORT}

# Run with tsx watch mode for auto-reload
CMD ["pnpm", "dev"]
