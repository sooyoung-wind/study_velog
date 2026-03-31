# 서버에 어떤 요청이 가능한지 어떻게 알 수 있나?

## 1. 코드를 직접 보는 방법 (개발자 입장)

서버의 `typeDefs`(스키마 = 메뉴판)를 보면 된다.

```js
const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;
```

지금은 `hello: String` 하나뿐이니까, 클라이언트가 요청할 수 있는 건 `hello` 딱 하나뿐이다.

## 2. GraphQL Sandbox로 확인하는 방법 (실행 중일 때)

서버를 실행한 뒤 브라우저에서 `http://localhost:4000`을 열면 **Apollo Sandbox**라는 도구가 나온다. 이건 GraphQL이 기본 제공하는 "메뉴판 조회 기능(**Introspection**)"을 이용한 것이다.

여기서:
- 왼쪽에 사용 가능한 쿼리 목록이 자동으로 표시되고
- 직접 쿼리를 타이핑해서 테스트할 수 있다

## 다른 요청을 추가하고 싶다면?

서버의 스키마와 리졸버에 추가하면 된다. 예를 들어 `goodbye`를 추가한다면:

```js
// 메뉴판에 항목 추가
const typeDefs = `#graphql
  type Query {
    hello: String
    goodbye: String
  }
`;

// 요리법도 추가
const resolvers = {
  Query: {
    hello: () => 'Hello from Apollo Server 5!',
    goodbye: () => 'Goodbye! See you later!',
  },
};
```

그러면 클라이언트에서 이렇게 요청할 수 있게 된다:

```js
// hello만 요청
{ hello }

// goodbye만 요청
{ goodbye }

// 둘 다 한번에 요청 (이게 GraphQL의 장점!)
{ hello, goodbye }
```

## 핵심 정리

| 질문 | 답 |
|------|-----|
| 서버에 뭐가 있는지 어떻게 아나? | `typeDefs`(스키마)를 보면 된다 |
| 실행 중일 때는? | `http://localhost:4000` Sandbox에서 자동으로 보인다 |
| 다른 요청을 추가하려면? | `typeDefs`에 항목 추가 + `resolvers`에 함수 추가 |

GraphQL의 큰 장점이 바로 이것이다 — **서버가 "나는 이런 데이터를 줄 수 있어"라고 스키마로 명확히 선언**하기 때문에, 클라이언트 개발자가 문서 없이도 무엇을 요청할 수 있는지 바로 알 수 있다.
