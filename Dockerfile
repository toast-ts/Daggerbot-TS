FROM node:22.7-alpine3.20
ENV YARN_VERSION="4.5.0"
ENV TZ="Australia/Sydney"
ENV NODE_COMPILE_CACHE="/Daggerbot/build_cache"
RUN yarn policies set-version $YARN_VERSION
RUN apk update && apk upgrade && apk add --no-cache git fontconfig ttf-dejavu
WORKDIR /Daggerbot
RUN npm install -g typescript
RUN git config --global --add safe.directory /Daggerbot
COPY .yarn/patches .yarn/patches
COPY tsconfig.json package.json yarn.lock .yarnrc.yml ./
RUN yarn

CMD [ "yarn", "node", "." ]
