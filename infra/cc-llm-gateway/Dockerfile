# LiteLLM gateway for Claude Code Analytics per-session virtual keys.
# Wraps the official LiteLLM image with our config baked in.
FROM ghcr.io/berriai/litellm:main-stable

COPY config.yaml /app/config.yaml

# LiteLLM listens on 4000 by default; Cloud Run sets $PORT, so bind to it.
# --config points at our model_list + budget enforcement settings.
CMD ["--config", "/app/config.yaml", "--port", "4000"]
