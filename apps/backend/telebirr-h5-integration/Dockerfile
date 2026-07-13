FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY app.js ./
COPY service ./service
COPY utils ./utils
COPY *.html ./

EXPOSE 8080

CMD ["node", "app.js"]
