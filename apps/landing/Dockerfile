FROM node:20-slim AS builder
WORKDIR /app
COPY . .
RUN ls -la && (ls -la node_modules || true) && (ls -la node_modules/.bin || true)
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3002
CMD ["node", "server.js"]
