FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 HF_HOME=/models TORCH_HOME=/models/torch \
    DATA_DIR=/data WEB_DIR=/web TORCH_THREADS=8
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libsndfile1 git \
    && rm -rf /var/lib/apt/lists/*

# CPU build of PyTorch (swap the index URL for cu128 on an NVIDIA host)
ARG TORCH_INDEX=https://download.pytorch.org/whl/cpu
RUN pip install torch==2.8.0 torchaudio==2.8.0 --index-url ${TORCH_INDEX}

# espeak-ng: phoneme fallback for Kokoro's non-English voices
RUN apt-get update && apt-get install -y --no-install-recommends espeak-ng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv
COPY requirements.txt .
RUN pip install -r requirements.txt && pip install --no-deps demucs==4.0.1 && pip check

COPY app ./app
COPY tests ./tests
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/v1/health', timeout=4)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
