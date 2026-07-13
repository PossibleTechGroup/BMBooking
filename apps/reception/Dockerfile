FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

# Serve built assets with Vite preview in production-safe mode.
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3001"]
