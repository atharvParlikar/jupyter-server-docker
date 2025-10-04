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
/home/venv/bin/python -m jupyter lab --no-browser --NotebookApp.token='' --ServerApp.disable_check_xsrf=True --allow-root &

# wait until port 8888 responds
echo "Waiting for Jupyter to be ready..."
while ! nc -z localhost 8888; do
  sleep 0.5
done

cd /home/server
bun install
bun run start
