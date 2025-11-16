FROM node:20

# Створення робочої директорії всередині контейнера
WORKDIR /app

# Копіюємо package.json та package-lock.json (якщо є)
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо решту коду
COPY . .

# Створюємо папку для завантажень (multer)
RUN mkdir -p uploads

# Експонуємо порт (порт у docker-compose)
EXPOSE 50

# Запуск
CMD ["node", "index.js", "--host", "0.0.0.0", "--port", "50", "--cache", "./cache"]
