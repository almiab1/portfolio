# ABOUTME: Selects the assistant's server-configured model and pins its inference endpoint.
# ABOUTME: Applies the shared budget immediately before each outbound inference POST.
import os
import re
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass, field

import httpx2
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI, Omit
from pydantic_ai.models import Model
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.profiles.openai import OpenAIModelProfile
from pydantic_ai.providers.anthropic import AnthropicProvider
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.providers.openai_compatible import OpenAICompatibleProvider
from pydantic_ai.providers.openrouter import OpenRouterProvider

MAX_INFERENCE_ATTEMPTS = 2
API_KEY_PATTERN = re.compile(r"[!-~]+")
NVIDIA_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b"
# (credential variable, base URL, inference path)
PROVIDERS = {
    "nvidia": ("NVIDIA_API_KEY", "https://integrate.api.nvidia.com/v1", "/v1/chat/completions"),
    "openai": ("OPENAI_API_KEY", "https://api.openai.com/v1", "/v1/chat/completions"),
    "anthropic": ("ANTHROPIC_API_KEY", "https://api.anthropic.com", "/v1/messages"),
    "openrouter": ("OPENROUTER_API_KEY", "https://openrouter.ai/api/v1", "/api/v1/chat/completions"),
}

Reserve = Callable[[], Awaitable[bool | None]]


class InferenceConfigurationError(ValueError):
    pass


class InferenceBudgetDenied(RuntimeError):
    status_code = 429


@dataclass(frozen=True)
class ProviderSettings:
    provider: str
    model: str
    api_key: str = field(repr=False)


def provider_settings() -> ProviderSettings:
    provider = os.environ.get("PORTFOLIO_ASSISTANT_PROVIDER", "nvidia")
    if provider not in PROVIDERS:
        raise InferenceConfigurationError("Assistant provider is unavailable")
    model = os.environ.get("PORTFOLIO_ASSISTANT_MODEL", NVIDIA_MODEL if provider == "nvidia" else "")
    api_key = os.environ.get(PROVIDERS[provider][0], "")
    # Model IDs include Anthropic version suffixes and OpenRouter's provider/model:variant form.
    if (
        re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}", model) is None
        or "://" in model
        or (provider == "openrouter" and re.fullmatch(r"[\w.-]+/[\w.:-]+", model) is None)
        or API_KEY_PATTERN.fullmatch(api_key) is None
    ):
        raise InferenceConfigurationError("Assistant provider is unavailable")
    return ProviderSettings(provider, model, api_key)


def provider_secrets() -> tuple[str, ...]:
    return tuple(
        secret
        for variable, _, _ in PROVIDERS.values()
        if API_KEY_PATTERN.fullmatch(secret := os.environ.get(variable, ""))
    )


class BudgetedTransport(httpx2.AsyncBaseTransport):
    def __init__(self, endpoint: httpx2.URL, reserve: Reserve) -> None:
        self._endpoint = endpoint
        self._reserve = reserve
        self._transport = httpx2.AsyncHTTPTransport(retries=0, trust_env=False)
        self._attempts = 0
        self.denial: Exception | None = None

    async def handle_async_request(self, request: httpx2.Request) -> httpx2.Response:
        # Anthropic's Messages SDK can append a beta query parameter.
        if request.method != "POST" or request.url.copy_with(query=None) != self._endpoint:
            raise InferenceConfigurationError("Unexpected assistant inference endpoint")
        if self.denial is not None:
            raise self.denial
        try:
            if self._attempts >= MAX_INFERENCE_ATTEMPTS:
                raise InferenceBudgetDenied("Assistant request limit reached")
            self._attempts += 1
            if await self._reserve() is False:
                raise InferenceBudgetDenied("Assistant request limit reached")
        except Exception as error:
            self.denial = error
            raise
        return await self._transport.handle_async_request(request)

    async def aclose(self) -> None:
        await self._transport.aclose()


@asynccontextmanager
async def open_model(reserve: Reserve, *, settings: ProviderSettings | None = None) -> AsyncIterator[Model]:
    if settings is None:
        settings = provider_settings()
    _, base_url, path = PROVIDERS[settings.provider]
    endpoint = httpx2.URL(base_url).copy_with(path=path)
    transport = BudgetedTransport(endpoint, reserve)
    async with httpx2.AsyncClient(transport=transport, follow_redirects=False, trust_env=False) as client:
        if settings.provider == "anthropic":
            anthropic = AsyncAnthropic(
                api_key=settings.api_key, base_url=base_url, http_client=client, max_retries=0
            )
            model = AnthropicModel(settings.model, provider=AnthropicProvider(anthropic_client=anthropic))
        else:
            openai = AsyncOpenAI(
                api_key=settings.api_key,
                base_url=base_url,
                http_client=client,
                max_retries=0,
                default_headers={} if settings.provider == "openai" else {
                    "OpenAI-Organization": Omit(),
                    "OpenAI-Project": Omit(),
                },
            )
            if settings.provider == "nvidia":
                model = OpenAIChatModel(
                    settings.model,
                    provider=OpenAICompatibleProvider("nvidia-nim", openai_client=openai),
                    profile=OpenAIModelProfile(openai_chat_supports_max_completion_tokens=False),
                    settings={"extra_body": {"chat_template_kwargs": {"enable_thinking": False}}},
                )
            elif settings.provider == "openrouter":
                model = OpenRouterModel(
                    settings.model,
                    provider=OpenRouterProvider(openai_client=openai),
                    settings={"openrouter_provider": {"allow_fallbacks": False}},
                )
            else:
                model = OpenAIChatModel(settings.model, provider=OpenAIProvider(openai_client=openai))

        try:
            yield model
        finally:
            # SDKs can wrap transport exceptions and the UI adapter can consume them.
            if transport.denial is not None:
                raise transport.denial from None
