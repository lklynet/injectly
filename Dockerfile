FROM node:18-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN if [ -d "/app/.git" ]; then echo ".git directory copied successfully"; else echo "Error: .git directory not found"; fi
RUN npm install
EXPOSE 3000
CMD ["node", "app.js"]