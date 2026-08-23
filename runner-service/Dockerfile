FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    g++ \
    openjdk-17-jdk-headless \
    python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /runner
COPY runner-service/package.json ./package.json
COPY runner-service/server.mjs ./server.mjs

ENV NODE_ENV=production
ENV RUNNER_PORT=8080
EXPOSE 8080

USER node
CMD ["node", "server.mjs"]
