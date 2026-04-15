FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js upload.js image.js github.js ./
USER node
EXPOSE 3100
CMD ["node", "server.js"]
