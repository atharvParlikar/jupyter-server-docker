# Use Debian slim
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /home

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl git python3 python3-venv build-essential unzip \
    && rm -rf /var/lib/apt/lists/*

# Python virtual environment + packages
RUN python3 -m venv /home/venv
RUN /home/venv/bin/pip install --upgrade pip
RUN /home/venv/bin/pip install jupyterlab numpy pandas scikit-learn matplotlib seaborn

# Install Bun runtime
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Create directories
RUN mkdir -p /home/server /home/jup /home/keys

# Clone your Bun server
RUN git clone http://github.com/atharvparlikar/jupyter-server-docker /home/server

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose ports
EXPOSE 8000 8888

ENTRYPOINT ["/entrypoint.sh"]
