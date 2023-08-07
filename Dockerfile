# main; node:current-alpine3.18
# backup; node:current-bookworm
FROM node:current-alpine3.18
WORKDIR /bot
RUN yarn
CMD ["yarn", "node", "dist/index.js"]