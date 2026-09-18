FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma

COPY . .

EXPOSE 5000

CMD npx prisma migrate deploy && npx prisma generate && node prisma/seed-if-empty.js && npm run dev