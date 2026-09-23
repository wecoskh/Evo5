FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
ENV API_HOST=0.0.0.0

EXPOSE 4000

CMD ["node", "src/index.js"]