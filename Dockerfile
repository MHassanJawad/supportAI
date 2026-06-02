FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm build

FROM node:20-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S supportai && adduser -S supportai -G supportai
COPY --from=build /app /app
USER supportai
CMD ["corepack", "pnpm", "--filter", "@supportai/api", "start"]
