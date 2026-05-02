# ─────────────────────────────────────────────────────────
# Stage 1: build the Vite SPA
# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# VITE_* env vars are baked into the bundle at build time.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Install deps with reproducible lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Build
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────
# Stage 2: serve static files via nginx
# ─────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Railway provides $PORT at runtime — substitute it into the nginx config.
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=builder /app/dist /usr/share/nginx/html

# nginx:alpine entrypoint runs envsubst on /etc/nginx/templates/*.template
# producing /etc/nginx/conf.d/<name>.conf with $PORT expanded.
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
