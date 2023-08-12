# main; node:19.9.0-alpine3.18
# backup; node:current-bookworm
FROM node:19.9.0-alpine3.18
WORKDIR /bot
RUN yarn
CMD ["yarn", "node", "dist/index.js"]