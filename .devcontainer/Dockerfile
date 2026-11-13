FROM oven/bun:1.3.14

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    python3 \
    build-essential \
    lcov \
    && rm -rf /var/lib/apt/lists/*

USER bun
