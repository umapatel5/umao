FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    docker.io \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /runner
COPY runner-service/package.json ./package.json
COPY runner-service/server.mjs ./server.mjs
COPY runner-service/process-runner.mjs ./process-runner.mjs

ENV NODE_ENV=production
ENV RUNNER_PORT=8080
EXPOSE 8080

USER node
CMD ["node", "server.mjs"]
