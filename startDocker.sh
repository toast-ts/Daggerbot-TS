#!/bin/bash

docker compose -f docker-compose.bot.yml build && \
docker compose -f docker-compose.bot.yml up -d

exit 0
