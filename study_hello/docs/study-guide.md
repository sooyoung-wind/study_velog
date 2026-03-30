# React + Apollo + GraphQL Hello World 학습 가이드

## Step 1: 4가지 기술이 각각 뭔지

식당에 비유해서 설명합니다.

### GraphQL = "메뉴판 + 주문서 양식"

식당에 가면 메뉴판이 있고, 주문서에 원하는 메뉴를 적는다. GraphQL은 **클라이언트(손님)와 서버(주방) 사이의 대화 규칙**이다.

- 서버가 "나는 이런 데이터를 줄 수 있어"라고 **메뉴판(스키마)**을 정의하고
- 클라이언트가 "이 데이터 주세요"라고 **주문서(쿼리)**를 보낸다

이 프로젝트의 메뉴판은 딱 하나: `hello`라는 항목뿐이다.

### Apollo Server = "주방"

메뉴판을 가지고 실제로 요리를 만들어주는 곳이다. 손님이 `hello`를 주문하면, `"Hello from Apollo Server 5!"`라는 응답을 만들어서 돌려준다.

### React = "식당 인테리어 + 테이블 배치"

손님(사용자)이 보는 **화면을 만드는 도구**이다. HTML을 직접 쓰는 대신, **컴포넌트**라는 레고 블록처럼 화면을 조립한다. 이 프로젝트에서는 `App`이라는 컴포넌트 하나가 화면 전체이다.

### Apollo Client = "웨이터"

손님(React 화면)과 주방(Apollo Server) 사이를 오가며 **주문을 전달하고 음식을 가져다주는 웨이터**이다. React가 "hello 데이터 필요해"라고 하면, Apollo Client가 서버에 요청을 보내고 결과를 가져온다.

---

## Step 2: 전체 동작 흐름

사용자가 브라우저에서 `http://localhost:5173`을 열면 이런 일이 벌어진다:

```
[사용자 브라우저]
    │
    ▼
[index.html]  ← 빈 HTML 껍데기, "root"라는 빈 공간만 있음
    │
    ▼
[main.jsx]  ← Apollo Client(웨이터) 생성 + React 앱 시작
    │
    ▼
[App.jsx]  ← "hello 데이터 주세요" 라고 요청
    │
    ▼  (HTTP 요청: POST http://localhost:4000/)
    │
[server/index.js]  ← 요청 받음 → "Hello from Apollo Server 5!" 응답
    │
    ▼  (HTTP 응답)
    │
[App.jsx]  ← 받은 데이터를 화면에 표시
    │
    ▼
[사용자 브라우저]  ← "GraphQL response: Hello from Apollo Server 5!" 가 보임
```

핵심은 **클라이언트와 서버가 별도 프로세스**라는 것이다:
- 서버: 포트 4000에서 실행 (데이터를 제공)
- 클라이언트: 포트 5173에서 실행 (화면을 보여줌)

---

## Step 3: 서버 코드 해설

서버는 파일 하나뿐이다: `server/src/index.js`

```js
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello from Apollo Server 5!',
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`Server ready at ${url}`);
```

이 파일은 **3가지 역할**을 한다:

### 1-2줄: 도구 가져오기

```js
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
```

`@apollo/server` 패키지에서 필요한 기능을 가져온다. `import`는 "이 도구를 쓸게요"라는 뜻이다.

### 4-8줄: 메뉴판 정의 (스키마)

```js
const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;
```

- `typeDefs` = "타입 정의" = 메뉴판
- `type Query` = "손님이 요청할 수 있는 것들"
- `hello: String` = "`hello`를 요청하면 문자열(String)을 돌려줄게요"
- 즉, **이 서버는 `hello`라는 질문 하나만 받을 수 있다**

### 10-14줄: 요리법 정의 (리졸버)

```js
const resolvers = {
  Query: {
    hello: () => 'Hello from Apollo Server 5!',
  },
};
```

- `resolvers` = "실제로 데이터를 만드는 함수들"
- 누군가 `hello`를 요청하면 → `'Hello from Apollo Server 5!'` 문자열을 돌려준다
- `() =>` 는 "함수"를 의미한다. 입력 없이 항상 같은 결과를 리턴하는 함수이다

### 16-22줄: 서버 시작

```js
const server = new ApolloServer({ typeDefs, resolvers });
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });
console.log(`Server ready at ${url}`);
```

- 메뉴판(`typeDefs`)과 요리법(`resolvers`)을 합쳐서 서버를 만들고
- 포트 4000에서 실행한다
- 콘솔에 "Server ready at http://localhost:4000/" 을 출력한다

---

## Step 4: 클라이언트 코드 해설

클라이언트 핵심 파일은 2개이다.

### 4-1. main.jsx — 앱의 시작점

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import App from './App';

const client = new ApolloClient({
  uri: 'http://localhost:4000/',
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
```

**1-4줄: 도구 가져오기**

- `React`, `ReactDOM` — 화면을 만드는 도구
- `ApolloClient`, `InMemoryCache`, `ApolloProvider` — 서버와 대화하는 도구
- `App` — 우리가 만든 화면 컴포넌트 (App.jsx에서 가져옴)

**6-9줄: 웨이터(Apollo Client) 고용**

```js
const client = new ApolloClient({
  uri: 'http://localhost:4000/',
  cache: new InMemoryCache(),
});
```

- `uri` = "주방 주소". 서버가 포트 4000에서 돌고 있으니까 그 주소를 알려준다
- `cache` = "메모장". 한번 받은 데이터를 기억해두어서 같은 요청을 반복하지 않는다

**11-17줄: 화면 조립 & 시작**

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
```

- `document.getElementById('root')` — index.html에 있는 `<div id="root">`를 찾는다
- 그 안에 `<App />`을 그린다
- `<ApolloProvider client={client}>` — App을 감싸서 "이 안에 있는 모든 컴포넌트는 이 웨이터(client)를 쓸 수 있어"라고 설정한다
- `<React.StrictMode>` — 개발 중 실수를 잡아주는 안전장치 (없어도 동작함)

### 4-2. App.jsx — 실제 화면

```jsx
import React from 'react';
import { useQuery, gql } from '@apollo/client';

const HELLO_QUERY = gql`
  query HelloQuery {
    hello
  }
`;

function App() {
  const { loading, error, data } = useQuery(HELLO_QUERY);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Study Velog</h1>
      <p>GraphQL response: <strong>{data.hello}</strong></p>
    </div>
  );
}

export default App;
```

이 파일이 가장 핵심이다!

**4-8줄: 주문서 작성**

```js
const HELLO_QUERY = gql`
  query HelloQuery {
    hello
  }
`;
```

- `gql` — "이건 GraphQL 쿼리야"라고 알려주는 태그
- `query HelloQuery { hello }` — "hello 데이터를 주세요"라는 주문서
- 서버의 스키마에 `hello: String`이 있었다. 그걸 요청하는 것이다

**10-11줄: 주문하기**

```js
function App() {
  const { loading, error, data } = useQuery(HELLO_QUERY);
```

- `function App()` — `App`이라는 화면 컴포넌트를 정의
- `useQuery(HELLO_QUERY)` — 이 주문서를 서버에 보낸다 (Apollo Client가 알아서 처리)
- 결과를 3가지로 나눠 받는다:
  - `loading` — 아직 응답이 안 왔으면 `true`
  - `error` — 에러가 났으면 에러 정보
  - `data` — 성공하면 실제 데이터 (`{ hello: "Hello from Apollo Server 5!" }`)

**13-14줄: 로딩/에러 처리**

```js
if (loading) return <p>Loading...</p>;
if (error) return <p>Error: {error.message}</p>;
```

- 데이터가 아직 안 왔으면 "Loading..." 표시
- 에러가 나면 에러 메시지 표시

**16-21줄: 데이터 표시**

```jsx
return (
  <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
    <h1>Study Velog</h1>
    <p>GraphQL response: <strong>{data.hello}</strong></p>
  </div>
);
```

- `{data.hello}` — 서버에서 받은 `hello` 값을 화면에 표시
- 결과: **"GraphQL response: Hello from Apollo Server 5!"**

**24줄: 내보내기**

```js
export default App;
```

- 이 컴포넌트를 다른 파일(main.jsx)에서 쓸 수 있게 내보낸다

---

## Step 5: 보조 파일들

나머지 파일들은 "설정"에 해당한다.

- **`client/index.html`** — `<div id="root"></div>`만 있는 빈 HTML. React가 이 안을 채운다.
- **`client/vite.config.js`** — Vite(빌드 도구)에게 "React 플러그인 써, 포트는 5173"이라고 알려준다.
- **`package.json`** 파일들 — 이 프로젝트가 어떤 라이브러리를 쓰는지 목록이다. `npm install`하면 이 목록을 보고 설치한다.
- **`Makefile`** — `make run`하면 서버와 클라이언트를 동시에 실행하는 편의 명령어이다.

---

## Step 6: 정리

### 한 문장 요약

> 서버가 "hello를 물어보면 인사말을 알려줄게"라고 정의하고, 클라이언트가 "hello 알려줘"라고 물어본 뒤 받은 답을 화면에 보여주는 프로그램.

### 핵심 파일 3개만 기억하자

| 파일 | 역할 |
|------|------|
| `server/src/index.js` | 메뉴판 + 요리법 + 서버 시작 |
| `client/src/main.jsx` | 웨이터 고용 + 앱 시작 |
| `client/src/App.jsx` | 주문 + 화면 표시 |

### 직접 실행하려면

```bash
make install   # 최초 1회: 필요한 패키지 설치
make run       # 서버 + 클라이언트 동시 실행
```

그 다음 브라우저에서 `http://localhost:5173` 을 열면 결과를 볼 수 있다.
