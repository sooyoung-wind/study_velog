# study_velog

React + Apollo Client + Apollo Server + GraphQL 조합의 Hello World 학습 프로젝트.

## 스택

| 역할 | 기술 |
|------|------|
| 서버 | Apollo Server 5 (standalone) |
| 클라이언트 | React 18 + Vite 5 |
| GraphQL 클라이언트 | Apollo Client 3 |
| GraphQL 런타임 | graphql 16 |

## 디렉토리 구조

```
study_velog/
├── Makefile
├── server/
│   ├── package.json
│   └── src/
│       └── index.js       # GraphQL 스키마 + Apollo Server
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx       # ApolloClient 초기화 + ApolloProvider
        └── App.jsx        # useQuery로 hello 쿼리 실행
```

## 실행

```bash
# 최초 1회: 의존성 설치
make install

# 서버 + 클라이언트 동시 실행
make run
```

| 주소 | 설명 |
|------|------|
| http://localhost:5173 | React 클라이언트 |
| http://localhost:4000 | Apollo Server (GraphQL Sandbox 포함) |

Ctrl+C 로 두 프로세스 함께 종료.

## GraphQL 스키마

```graphql
type Query {
  hello: String
}
```

## curl 테스트

```bash
curl -X POST http://localhost:4000/ \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ hello }"}'
# {"data":{"hello":"Hello from Apollo Server 5!"}}
```
