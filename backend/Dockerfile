# Illustrio Backend
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY api ./api/
COPY prisma/seed.js ./

RUN npm run db:push || true

EXPOSE 3001

CMD ["npm", "start"]
