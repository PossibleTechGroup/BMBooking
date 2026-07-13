FROM node:20-alpine

WORKDIR /app

COPY package.json* ./
RUN npm install --omit=dev

COPY app.js ./
COPY service ./service
COPY utils ./utils
COPY *.html ./

EXPOSE 8080

CMD ["node", "app.js"]
