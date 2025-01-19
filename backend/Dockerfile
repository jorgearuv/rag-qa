FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Make start script executable
RUN chmod +x start.sh && \
    sed -i 's/\r$//' start.sh

# Add the current directory to PYTHONPATH
ENV PYTHONPATH=/app
ENV DJANGO_SETTINGS_MODULE=ragqa.settings

CMD ["./start.sh"]
