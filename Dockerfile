FROM node:alpine

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production

# Bundle package dependencies
COPY package*.json /app/

# Install app dependencies
RUN npm install --production

# Bundle app source
COPY . /app

EXPOSE 3000
CMD [ "node", "app.js" ]