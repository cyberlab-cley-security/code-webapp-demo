FROM node:18.5

RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
