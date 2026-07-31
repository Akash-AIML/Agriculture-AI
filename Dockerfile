FROM python:3.10-slim

WORKDIR /app

# Install system deps (libgomp for PyTorch OpenMP, libssl/libgcc for primp/ddgs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libssl-dev \
    libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir \
        torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy backend source + model files
COPY backend/ /app/backend/

# Cloud Run injects $PORT (default 8080), HF Spaces uses 7860
# uvicorn reads it dynamically
ENV PORT=8080

EXPOSE 8080

# Use shell form so $PORT is expanded at runtime
CMD uvicorn backend.main:app --host 0.0.0.0 --port $PORT
