#!/usr/bin/env bash
# 백엔드와 프론트엔드를 동시에 시작
set -e

echo "=== Auto AI Video Generator ==="

# .env 확인
if [ ! -f .env ]; then
  echo "ERROR: .env 파일이 없습니다. .env.example을 복사하고 API 키를 입력하세요."
  exit 1
fi

# Python 의존성 설치
echo "[1/3] Python 패키지 설치..."
pip install -r requirements.txt -q

# npm 의존성 설치
echo "[2/3] npm 패키지 설치..."
(cd frontend && npm install --silent)

echo "[3/3] 서버 시작..."
echo "  Backend: http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo ""

# 백엔드 백그라운드 실행
uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

# 프론트엔드 포그라운드 실행
(cd frontend && npm run dev)

# 프론트엔드 종료 시 백엔드도 종료
kill $BACKEND_PID 2>/dev/null || true
