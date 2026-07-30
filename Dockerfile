FROM python:3.10-slim

# HF Spaces runs as non-root user 1000
RUN useradd -m -u 1000 user
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps from backend requirements
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy backend source + models
COPY backend/ /app/backend/
COPY app.py /app/app.py

# Fix permissions
RUN chown -R user:user /app
USER user

EXPOSE 7860

# Run the FastAPI backend directly with uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
