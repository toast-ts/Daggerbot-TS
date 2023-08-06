FROM node:current-alpine3.18
WORKDIR /bot
CMD ["yarn", "node", "dist/index.js"]