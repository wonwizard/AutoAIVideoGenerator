import json
import os
import anthropic


def _log_llm(label: str, data) -> None:
    if isinstance(data, str):
        print(f"[LLM {label}] {data}", flush=True)
    else:
        print(f"[LLM {label}] {json.dumps(data, ensure_ascii=False)}", flush=True)


async def run(topic: str, duration: int, llm: str = "claude") -> dict:
    if llm == "claude":
        return await _generate_with_claude(topic, duration)
    else:
        return await _generate_with_gemini(topic, duration)


async def _generate_with_claude(topic: str, duration: int) -> dict:
    client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    prompt = (
        f"주제: {topic}\n"
        f"총 영상 길이: {duration}초\n\n"
        f"위 주제로 {duration}초 영상의 스토리를 만들어줘.\n"
        f"전체를 자연스럽게 여러 씬으로 나눠서 '0초-3초: 장면 설명' 형식으로 작성해.\n"
        f"각 장면 설명은 시각적으로 구체적이고 영상으로 표현하기 좋게 써줘.\n"
        f"스토리 텍스트만 출력하고 다른 부연 설명은 생략해."
    )

    _log_llm("REQ (claude)", {"model": "claude-sonnet-4-6", "prompt": prompt})

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    story_text = response.content[0].text.strip()
    _log_llm("RES (claude)", story_text)
    return {"story_text": story_text, "duration": duration}


async def _generate_with_gemini(topic: str, duration: int) -> dict:
    import httpx

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    model = "gemini-3.1-flash-lite"
    prompt = (
        f"주제: {topic}\n"
        f"총 영상 길이: {duration}초\n\n"
        f"위 주제로 {duration}초 영상의 스토리를 만들어줘.\n"
        f"전체를 자연스럽게 여러 씬으로 나눠서 '0초-3초: 장면 설명' 형식으로 작성해.\n"
        f"각 장면 설명은 시각적으로 구체적이고 영상으로 표현하기 좋게 써줘.\n"
        f"스토리 텍스트만 출력하고 다른 부연 설명은 생략해."
    )

    _log_llm("REQ (gemini)", {"model": model, "prompt": prompt})

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
            json={"contents": [{"parts": [{"text": prompt}]}]}
        )
        resp.raise_for_status()
        story_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        _log_llm("RES (gemini)", story_text)
        return {"story_text": story_text, "duration": duration}
