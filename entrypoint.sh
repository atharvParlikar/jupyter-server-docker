#!/bin/bash
set -e

# ---- 1. Write GCP key if PRIVATE_KEY env is set ----
if [ -n "$PRIVATE_KEY" ]; then
  echo "$PRIVATE_KEY" >/home/keys/gcp-service-account.json
  chmod 600 /home/keys/gcp-service-account.json
fi

# ---- 2. Write .env file in server ----
cat <<EOF >/home/server/.env
OPENAI_API_KEY="${OPENAI_API_KEY}"
GOOGLE_APPLICATION_CREDENTIALS=../keys/gcp-service-account.json
GCP_BUCKET_NAME=assets
EOF

# ---- 3. Start Jupyter in /home/jup in background ----
mkdir -p /home/jup
/home/venv/bin/python -m jupyter lab --ip=0.0.0.0 --port=8888 --allow-root --no-browser --notebook-dir=/home/jup &

# ---- 4. Start Bun server ----
cd /home/server
bun install
bun run start
