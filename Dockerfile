FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY public ./public
COPY src ./src

ENV NODE_ENV=production
EXPOSE 4174

CMD ["sh", "-c", "npm run db:migrate && npm start"]
