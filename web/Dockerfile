FROM node:20-alpine
WORKDIR /app
COPY ./package.json /app
RUN npm install --omit=dev
COPY server.js /app
EXPOSE 3000
CMD ["node", "server.js"]