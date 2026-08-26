FROM node:20-alpine

WORKDIR /app

ARG VITE_API_URL=/api
ARG VITE_API_PROXY_TARGET=http://backend:5000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_PROXY_TARGET=$VITE_API_PROXY_TARGET

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

# Use dev server so the Vite proxy forwards /api → backend
CMD ["npm", "run", "dev", "--", "--port", "3001"]
