FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Dependências Python da API
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código da aplicação
COPY app ./app

EXPOSE 8000

# Arranque padrão da API
CMD ["uvicorn", "app.core.main:app", "--host", "0.0.0.0", "--port", "8000"]
