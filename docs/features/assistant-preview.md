# Vista previa del asistente

El escritorio usa el chat simulado por defecto. La vista previa conecta el mismo chat a Pydantic AI y recibe el texto y los destinos del portfolio a través del protocolo de Vercel AI SDK.

## Arranque local

En dos terminales, con Python 3.12 y Node 22:

```sh
PORTFOLIO_ASSISTANT_MODE=fixture uv run --with-requirements requirements.txt --with uvicorn \
  uvicorn api.chat:app --host 127.0.0.1 --port 8092
```

```sh
PUBLIC_PORTFOLIO_ASSISTANT_PREVIEW=1 PORTFOLIO_ASSISTANT_LOCAL_URL=http://127.0.0.1:8092 \
  pnpm dev --host 127.0.0.1 --port 4328
```

El modo `fixture` usa un modelo de prueba local para verificar las respuestas y las acciones de navegación. Para probar Gemini, usa `PORTFOLIO_ASSISTANT_MODE=live` y configura `GEMINI_API_KEY` como secreto del proceso de Python. Pregunta por IA médica y sigue el enlace de GLIO-IA. En inglés, pregunta por las habilidades y abre Skills.

## Vista previa de Vercel

Habilita la protección del despliegue de vista previa. Configura `PUBLIC_PORTFOLIO_ASSISTANT_PREVIEW=1` y `PORTFOLIO_ASSISTANT_MODE=live` solo en Preview, junto con el secreto `GEMINI_API_KEY`. El endpoint queda deshabilitado en Production. La evaluación del modelo usa las preguntas de prueba en ambos idiomas y mide precisión, latencia y consumo.

## Pruebas

```sh
uv run --with-requirements requirements.txt --with pytest --with httpx python -m pytest -q tests/test_chat.py
```
