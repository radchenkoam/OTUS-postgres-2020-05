FROM node:14

# создание каталога приложения
WORKDIR /usr/src/app

# установка зависимостей
# package.json и package-lock.json
COPY package*.json ./

RUN npm install

# Сборка для продакшн
# RUN npm ci --only=production

# копируем исходный код
COPY . .

EXPOSE 5000
CMD [ "node", "index.js" ]