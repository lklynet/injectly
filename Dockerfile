# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker's caching
COPY package*.json ./

# Install dependencies (show logs during this step)
RUN npm install --loglevel verbose

# Copy the rest of the application files
COPY . .

# Expose the app port
EXPOSE 3000

# Define the command to run your app
CMD ["node", "server/app.js"]