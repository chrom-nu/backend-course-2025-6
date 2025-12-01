FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p uploads

EXPOSE 50

CMD ["node", "index.js", "--host", "0.0.0.0", "--port", "50", "--cache", "./cache"]
