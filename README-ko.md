# Auto AI Video Generator

텍스트 주제 하나만 입력하면 스토리 생성 → 스토리보드 이미지 → 최종 영상까지 자동으로 만들어주는 AI 기반 웹앱입니다. 중간 단계 없이 파이프라인이 자동으로 처리합니다.

주제, 길이, 종횡비만 입력하면 4단계 파이프라인(스토리 → 스토리보드 이미지 → 영상 클립 → 최종 MP4)이 자동으로 실행됩니다. (fal.ai 및 Claude 또는 Gemini API 키 필요)

- **Agent-first CLI 기반** — fal.ai genmedia(에이전트 우선 CLI)를 기반으로 이미지 및 영상 생성의 모든 AI 모델 호출을 자동 처리
- **자동 스토리 생성** — LLM이 타임코드 포함 씬별 스토리 스크립트를 자동 생성; 사용자가 내용을 확인하고 수정 후 진행 가능. Claude 및 Gemini 선택 지원
- **자동 스토리보드 생성** — 스토리 스크립트를 genmedia(GPT-Image-2)에 전달해 전체 영상 흐름을 시각화한 스토리보드 이미지 1장 생성
- **자동 영상 생성** — 스토리보드 이미지를 fal.ai에 업로드하고 genmedia(Seedance 2.0)으로 영상 클립으로 변환; 비동기 폴링으로 생성 완료까지 자동 대기

## 결과물

![결과물](result.png)

## 동작 방식

```
[입력: 주제 + 영상 길이]
        ↓
Step 1  LLM (Claude / Gemini) — 타임코드 포함 씬별 스토리 텍스트 생성
        ↓
Step 2  이미지 생성 (fal.ai GPT-Image-2) — 스토리보드 이미지 1장 생성
        ↓
Step 3  영상 생성 (fal.ai SeedanCe 2.0) — 스토리보드를 영상 클립으로 변환
        ↓
Step 4  최종 MP4 다운로드 가능
```

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 프론트엔드 | React 19 + TypeScript + Vite |
| 백엔드 | Python FastAPI + uvicorn |
| LLM | Claude (claude-sonnet-4-6) 또는 Gemini (gemini-3.1-flash-lite) |
| 이미지 생성 | fal.ai `openai/gpt-image-2` via genmedia-cli |
| 영상 생성 | fal.ai `bytedance/seedance-2.0/reference-to-video` via genmedia-cli |

## 사전 요구 사항

- Python 3.11 이상
- Node.js 18 이상
- [ffmpeg](https://ffmpeg.org/download.html) — PATH에 등록되어 있어야 함
- [genmedia-cli](https://genmedia.sh) — fal.ai CLI 도구

## 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/wonwizard/AutoAIVideoGenerator.git
cd AutoAIVideoGenerator
```

### 2. genmedia-cli 설치

```bash
# macOS / Linux
curl https://genmedia.sh/install -fsS | bash

# Windows (PowerShell)
irm https://genmedia.sh/install.ps1 | iex
```

fal.ai API 키로 설정:

```bash
genmedia setup --non-interactive --api-key "YOUR_FAL_KEY"
```

### 3. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 API 키를 입력합니다:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
FAL_KEY=your_fal_api_key
GEMINI_API_KEY=your_gemini_api_key   # Gemini 사용 시에만 필요
```

API 키 발급:
- **Anthropic API 키** — [console.anthropic.com](https://console.anthropic.com)
- **fal.ai API 키** — [fal.ai/dashboard](https://fal.ai/dashboard)
- **Gemini API 키** — [aistudio.google.com](https://aistudio.google.com)

### 4. 의존성 설치

```bash
# Python 패키지
pip install -r requirements.txt

# 프론트엔드 패키지
cd frontend && npm install
```

## 실행 방법

### 한 번에 실행 (bash)

```bash
bash start.sh
```

### 수동 실행

```bash
# 터미널 1 — 백엔드
uvicorn backend.main:app --reload --port 8000

# 터미널 2 — 프론트엔드
cd frontend && npm run dev
```

브라우저에서 **http://localhost:5173** 을 엽니다.

## 사용 방법

1. 주제를 입력하고 영상 길이(3~30초), LLM, 종횡비를 선택합니다
2. **영상 생성 시작** 버튼 클릭 — 스토리가 생성되어 표시됩니다
3. 스토리 텍스트를 필요에 따라 수정한 후 **이미지 생성** 클릭
4. 스토리보드 이미지를 확인하고 **영상 생성** 클릭
5. 완료되면 최종 MP4를 다운로드합니다

## 라이선스

MIT
