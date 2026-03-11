FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm install --omit=dev || npm install

COPY src ./src

EXPOSE 3000

ENV API_PORT=3000 \
    MONGO_URI=mongodb://mongo:27017/cloud_monitoring

CMD ["npm", "start"]

