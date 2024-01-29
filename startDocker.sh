#!/bin/bash

docker compose -f docker-compose.bot.yml build bot && \
docker compose -f docker-compose.bot.yml up -d bot

exit 0
