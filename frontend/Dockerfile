FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN npm install react-use-websocket@4.6.0 --legacy-peer-deps

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]