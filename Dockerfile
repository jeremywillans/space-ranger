FROM node:alpine

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production

# Bundle app source
COPY . /app

# Install app dependencies
RUN npm install --production

# Expose Token ENV
ENV TOKEN bot-token-from-developer-dot-webex-dot-com

EXPOSE 3000
CMD [ "node", "app.js" ]