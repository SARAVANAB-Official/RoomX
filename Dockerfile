FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm --filter @roomx/shared build
RUN pnpm --filter @roomx/server build
WORKDIR /app/apps/server
EXPOSE 3001
CMD ["node", "dist/index.js"]
