import logging
import os

import httpx
from app.core.catalogo import normalizar

logger = logging.getLogger(__name__)

PROVIDERS = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o-mini",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "default_model": "qwen/qwen3.8-27b",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "default_model": "gemini-1.5-flash",
    },
}


def _prompt(catalogo: list[str], texto: str) -> str:
    return (
        "Você recebe um catálogo de habilidades e um texto digitado por um usuário. "
        "Responda APENAS com o nome EXATO da habilidade do catálogo que melhor corresponde ao texto. "
        "Se nenhuma corresponder, responda apenas NENHUMA.\n\n"
        f"Catálogo: {', '.join(catalogo)}\n"
        f"Texto: {texto}\n"
        "Resposta:"
    )


def _resposta_esta_no_catalogo(resposta: str, catalogo: set[str]) -> bool:
    return normalizar(resposta) in {normalizar(nome) for nome in catalogo}


def _chamar_openai_compativel(
    api_key: str,
    base_url: str,
    model: str,
    catalogo: list[str],
    texto: str,
) -> str | None:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": _prompt(catalogo, texto),
            }
        ],
        "temperature": 0.0,
        "max_tokens": 60,
    }

    with httpx.Client(timeout=10.0) as client:
        r = client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"].strip()


def _chamar_gemini(
    api_key: str,
    base_url: str,
    model: str,
    catalogo: list[str],
    texto: str,
) -> str | None:
    url = f"{base_url}/models/{model}:generateContent"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": _prompt(catalogo, texto)}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.0,
            "maxOutputTokens": 60,
        },
    }

    with httpx.Client(timeout=10.0) as client:
        r = client.post(url, headers={"x-goog-api-key": api_key}, json=payload)
        r.raise_for_status()
        data = r.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def mapear(texto: str, catalogo: list[str]) -> str | None:
    provider = os.getenv("IA_PROVIDER", "groq").lower().strip()
    api_key = os.getenv("IA_API_KEY", "").strip()

    if not api_key:
        logger.info("IA desativada: IA_API_KEY vazia. Usando fallback difflib.")
        return None

    config = PROVIDERS.get(provider)
    if config is None:
        logger.warning("IA desativada: provedor '%s' não suportado.", provider)
        return None

    model = os.getenv("IA_MODEL", config["default_model"]).strip()
    if not model:
        model = config["default_model"]

    logger.debug("Chamando IA: provider=%s model=%s texto=%r", provider, model, texto)
    try:
        if provider == "gemini":
            resposta = _chamar_gemini(api_key, config["base_url"], model, catalogo, texto)
        else:
            resposta = _chamar_openai_compativel(
                api_key, config["base_url"], model, catalogo, texto
            )
    except Exception as exc:
        status_code = exc.response.status_code if isinstance(exc, httpx.HTTPStatusError) else None
        logger.warning(
            "Falha na chamada da IA: provider=%s tipo=%s status=%s",
            provider,
            type(exc).__name__,
            status_code,
        )
        return None

    if resposta is None:
        return None

    resposta = resposta.strip().strip('"').strip("'")
    logger.info("Resposta da IA: %r", resposta)
    if resposta.upper() == "NENHUMA":
        return None

    if not _resposta_esta_no_catalogo(resposta, set(catalogo)):
        logger.warning("IA respondeu %r, mas não está no catálogo.", resposta)
        return None

    logger.debug("IA mapeou %r -> %r", texto, resposta)
    return next(nome for nome in catalogo if normalizar(nome) == normalizar(resposta))
