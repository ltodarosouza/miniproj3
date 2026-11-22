import os
import unicodedata

import httpx

PROVIDERS = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "default_model": "gpt-4o-mini",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "default_model": "llama-3.1-8b-instant",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "default_model": "gemini-1.5-flash",
    },
}


def _sem_acento(texto: str) -> str:
    decomposto = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in decomposto if not unicodedata.combining(c)).casefold()


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
    return _sem_acento(resposta) in {_sem_acento(nome) for nome in catalogo}


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
    url = f"{base_url}/models/{model}:generateContent?key={api_key}"
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
        r = client.post(url, json=payload)
        r.raise_for_status()
        data = r.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def mapear(texto: str, catalogo: list[str]) -> str | None:
    """Tenta mapear o texto para uma habilidade do catálogo usando IA.

    Se a chave não estiver configurada ou a chamada falhar, retorna None.
    A resposta da IA só é aceita se for um nome EXATO do catálogo.
    """
    provider = os.getenv("IA_PROVIDER", "groq").lower().strip()
    api_key = os.getenv("IA_API_KEY", "").strip()

    if not api_key:
        return None

    config = PROVIDERS.get(provider)
    if config is None:
        return None

    model = os.getenv("IA_MODEL", config["default_model"]).strip()
    if not model:
        model = config["default_model"]

    try:
        if provider == "gemini":
            resposta = _chamar_gemini(api_key, config["base_url"], model, catalogo, texto)
        else:
            resposta = _chamar_openai_compativel(
                api_key, config["base_url"], model, catalogo, texto
            )
    except Exception:
        return None

    if resposta is None:
        return None

    resposta = resposta.strip().strip('"').strip("'")
    if resposta.upper() == "NENHUMA":
        return None

    if not _resposta_esta_no_catalogo(resposta, set(catalogo)):
        return None

    return resposta
