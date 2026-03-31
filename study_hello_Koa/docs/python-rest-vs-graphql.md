# Python 유저 입장에서 REST vs GraphQL 선택 가이드

---

## 결론부터

**REST API가 보편적으로 합리적인 선택이다.**

단, "항상 REST"는 아니다. 아래를 읽으면 언제 예외가 되는지 알 수 있다.

---

## 왜 Python 유저에게 REST가 더 자연스러운가

### 1. 생태계가 REST 중심으로 성숙해 있다

Python 웹 프레임워크들은 REST를 기본으로 설계되어 있다.

| 프레임워크 | REST 지원 | GraphQL 지원 |
|-----------|----------|-------------|
| FastAPI | 네이티브 (핵심 기능) | 별도 라이브러리 필요 (strawberry 등) |
| Django | DRF(Django REST Framework)로 성숙 | graphene-django로 추가 가능 |
| Flask | flask-restful / 직접 구현 | flask-graphql로 추가 가능 |

FastAPI를 예로 들면:

```python
# REST — 이게 FastAPI의 기본 방식
@app.get("/api/hello")
def get_hello():
    return {"message": "Hello!"}
```

```python
# GraphQL — 별도 라이브러리(strawberry)를 설치해야 한다
import strawberry

@strawberry.type
class Query:
    @strawberry.field
    def hello(self) -> str:
        return "Hello!"

schema = strawberry.Schema(query=Query)
```

REST는 FastAPI 튜토리얼 1페이지에 나오는 내용이다.
GraphQL은 추가 개념(스키마, 리졸버, 타입 시스템)을 별도로 배워야 한다.

---

### 2. Python 데이터 과학 / ML 생태계와 자연스럽게 연결된다

Python 유저 중에는 데이터 분석, ML 모델 서빙에 관심 있는 경우가 많다.
이 영역에서는 REST가 표준이다.

```
ML 모델 배포 흐름 (REST 기반):

pandas / sklearn / pytorch로 모델 학습
        │
        ▼
FastAPI로 모델을 REST API로 감쌈
        │
        ▼
POST /predict  →  { "result": 0.87 }
        │
        ▼
프론트엔드 / 앱 / 다른 서비스가 호출
```

Hugging Face, OpenAI, Anthropic 등 대부분의 AI API가 REST 방식이다.
이미 REST로 외부 API를 소비하고 있다면, 내가 만드는 API도 REST로 일관하는 게 자연스럽다.

---

### 3. 디버깅과 테스트가 훨씬 쉽다

REST는 브라우저 주소창, curl, httpie 어디서든 바로 테스트할 수 있다.

```bash
# REST: curl 한 줄로 테스트
curl http://localhost:8000/api/users/1

# GraphQL: 쿼리 본문을 JSON으로 만들어서 POST해야 한다
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ user(id: 1) { name email } }"}'
```

Python에서 requests로 테스트할 때도 마찬가지다.

```python
import requests

# REST — 직관적
response = requests.get("http://localhost:8000/api/users/1")

# GraphQL — 쿼리 문자열을 별도로 관리해야 한다
query = """
  query {
    user(id: 1) {
      name
      email
    }
  }
"""
response = requests.post(
    "http://localhost:8000/graphql",
    json={"query": query}
)
```

---

## 그렇다면 GraphQL은 언제 선택하는가

GraphQL이 REST보다 유리한 상황은 명확하다.

### 상황 1: 프론트엔드가 요청하는 데이터 형태가 매우 다양할 때

```
예: 같은 "게시글" 데이터인데

모바일 앱    → 제목 + 썸네일만 필요
웹 목록 페이지 → 제목 + 작성자 + 날짜
웹 상세 페이지 → 전체 내용 + 댓글 + 태그 전부
```

REST라면 엔드포인트를 3개 만들거나, 항상 전체 데이터를 내려줘야 한다.
GraphQL이라면 클라이언트가 필요한 필드만 골라서 요청한다.

### 상황 2: 관련된 데이터를 한 번에 묶어서 요청해야 할 때

```
"게시글 + 작성자 정보 + 댓글 목록"을 한 번에 가져오고 싶을 때

REST:
  GET /posts/1        → 게시글
  GET /users/42       → 작성자
  GET /posts/1/comments → 댓글
  (요청 3번)

GraphQL:
  query {
    post(id: 1) {
      title
      author { name }
      comments { content }
    }
  }
  (요청 1번)
```

### 상황 3: 프론트엔드 팀이 GraphQL을 원할 때

React + Apollo 조합을 쓰는 프론트엔드 팀이라면 GraphQL 서버를 요구할 수 있다.
이 경우에는 Python 서버도 GraphQL로 맞춰줘야 한다.

---

## 정리: 선택 기준표

| 내 상황 | 선택 |
|--------|------|
| FastAPI / Django로 백엔드 처음 만든다 | **REST** |
| ML 모델을 API로 배포한다 | **REST** |
| 외부 서비스 / 앱이 내 API를 쓴다 | **REST** |
| 모바일 + 웹이 같은 서버를 쓰고 데이터 형태가 다르다 | **GraphQL 검토** |
| 프론트엔드 팀이 Apollo를 쓴다 | **GraphQL** |
| 연관 데이터를 한 번에 요청해야 하는 경우가 많다 | **GraphQL 검토** |

---

## 한 줄 요약

> Python으로 서버를 처음 만든다면 **REST(FastAPI)로 시작**하고,
> 프론트엔드의 데이터 요구가 복잡해지는 시점에 GraphQL을 검토하면 된다.

GraphQL은 "더 좋은" 방식이 아니라 **특정 문제를 해결하기 위한** 방식이다.
그 문제가 없다면 REST가 더 단순하고, 생태계가 넓고, 배우기 쉽다.
