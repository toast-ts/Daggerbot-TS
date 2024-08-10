#!/bin/bash

docker compose -f docker-compose.bot.yml build && \
docker compose -f docker-compose.bot.yml up -d --force-recreate

exit 0
