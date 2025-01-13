FROM node:18-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache git
COPY package*.json ./
RUN npm install --loglevel verbose
COPY . .
RUN if [ -d "/usr/src/app/.git" ]; then echo ".git directory copied successfully"; else echo "Error: .git directory not found"; fi
EXPOSE 3000
CMD ["node", "server/app.js"]