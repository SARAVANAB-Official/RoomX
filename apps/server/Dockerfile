FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm --filter @roomx/shared build
RUN pnpm --filter @roomx/server build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/package.json .
COPY --from=builder /app/pnpm-lock.yaml* .
COPY --from=builder /app/pnpm-workspace.yaml .
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist/
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules/
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist/
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules/
WORKDIR /app/apps/server
EXPOSE 3001
CMD ["node", "dist/index.js"]
