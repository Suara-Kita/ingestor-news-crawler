FROM mcr.microsoft.com/playwright/node:20-jammy AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM mcr.microsoft.com/playwright/node:20-jammy AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
RUN npx playwright install --with-deps chromium
CMD ["node", "dist/index.js"]
