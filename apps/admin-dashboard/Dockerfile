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

EXPOSE 3000

# Serve built assets with Vite preview in production-safe mode.
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
