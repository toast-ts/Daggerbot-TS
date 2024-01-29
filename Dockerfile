FROM node:21.1.0-bookworm-slim
ENV YARN_VERSION 4.0.2
RUN yarn policies set-version $YARN_VERSION
RUN apt update -y && apt upgrade -y && apt install -y git fontconfig
RUN npm install -g typescript
WORKDIR /Daggerbot
RUN git config --global --add safe.directory /Daggerbot
COPY tsconfig.json package.json yarn.lock .yarnrc.yml ./
RUN yarn workspaces focus

CMD [ "yarn", "node", "." ]
