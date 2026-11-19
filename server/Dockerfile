FROM node:22-alpine
WORKDIR /app

COPY package.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm install

COPY server ./server
COPY client ./client
RUN npm run db:generate -w server && npm run build -w server

EXPOSE 4000
CMD ["sh", "-c", "npm run db:migrate:deploy -w server && npm run start -w server"]
