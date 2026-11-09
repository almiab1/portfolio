# Vista previa del asistente

El escritorio usa el chat simulado por defecto. La vista previa conecta el mismo chat a Pydantic AI y recibe el texto y los destinos del portfolio a través del protocolo de Vercel AI SDK.

Cada destino validado se muestra en el chat con una tarjeta del catálogo de json-render. Las rutas y etiquetas se resuelven en la web según el idioma activo.

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

El modo `fixture` usa un modelo de prueba local con las mismas respuestas bilingües que la demo del navegador. Ambas las leen de `src/i18n/assistant-replies.json`, integrado en el diccionario `src/i18n/ui.ts`. Para probar Nemotron, guarda `NVIDIA_API_KEY` en el archivo local `.env.local`, excluido de Git. Usa el mismo servidor de Astro y cambia el comando de Python por el siguiente.

```sh
PORTFOLIO_ASSISTANT_MODE=live uv run --env-file .env.local --with-requirements requirements.txt --with uvicorn \
  uvicorn api.chat:app --host 127.0.0.1 --port 8092
```

Si cambias la URL del servidor local de Astro, define esa URL exacta en
`PORTFOLIO_ASSISTANT_LOCAL_ORIGIN` al arrancar Python.

## Vista previa de Vercel

Comprueba que Vercel Authentication protege los despliegues de Preview y configura `NVIDIA_API_KEY` como secreto de ese entorno. Para habilitar el asistente en un único despliegue, ejecuta desde el proyecto enlazado:

```sh
vercel deploy --environment preview \
  --build-env PUBLIC_PORTFOLIO_ASSISTANT_PREVIEW=1 \
  --env PORTFOLIO_ASSISTANT_MODE=live
```

La función llama directamente a NVIDIA NIM y usa `nvidia/nemotron-3.5-lightning-30b-a3b`. El acceso gratuito de NVIDIA se reserva para pruebas. El endpoint queda deshabilitado en Production.

Pregunta «¿Qué aportó Alex al proyecto de IA médica?» en español y «What did Alex contribute to the medical AI project?» en inglés. Comprueba que la respuesta describe su trabajo en GLIO-IA y que el enlace abre la ficha en el idioma activo. Mide desde el envío hasta el primer texto visible y hasta el final de la respuesta.

## Límites y seguridad

- El servidor valida el formato, el origen y el tamaño de la petición. El historial se pasa como datos sin privilegios y solo se usa contenido público revisado del portfolio.
- Evita incluir datos privados al escribir. Se bloquean patrones de extracción de instrucciones y credenciales reconocibles antes de enviar la consulta a NVIDIA. Las reglas de texto reducen el riesgo y se combinan con herramientas de solo lectura.
- El servidor revisa la respuesta completa antes de mostrarla. El navegador recibe texto, una tarjeta opcional de una lista cerrada y un aviso genérico ante errores. Las trazas, el razonamiento y los parámetros internos del proveedor se descartan.
- Vercel Authentication debe proteger el entorno Preview. El límite local de 15 peticiones por cliente y 75 por instancia cada minuto reduce el abuso dentro de cada proceso. Para una futura publicación, configura límites compartidos en el perímetro y verifica los permisos de despliegue.

## Pruebas

```sh
uv run --with-requirements requirements.txt --with pytest --with httpx python -m pytest -q tests/test_chat.py tests/test_assistant_security.py
```
