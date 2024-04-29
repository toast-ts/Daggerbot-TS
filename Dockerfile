FROM node:22.0.0-alpine3.19
ENV YARN_VERSION 4.1.1
ENV TZ Australia/Sydney
RUN yarn policies set-version $YARN_VERSION
RUN apk update && apk upgrade && apk add --no-cache git fontconfig ttf-dejavu
WORKDIR /Daggerbot
RUN npm install -g typescript
RUN git config --global --add safe.directory /Daggerbot
COPY tsconfig.json package.json yarn.lock .yarnrc.yml ./
RUN yarn

CMD yarn node .
