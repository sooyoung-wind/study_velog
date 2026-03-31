# study_hello vs study_hello_Koa 비교

> 두 프로젝트는 모두 "서버에서 Hello 메시지를 받아 화면에 보여주는" 같은 기능을 한다.
> 하지만 **서버-클라이언트가 대화하는 방식**이 완전히 다르다.

---

## 한 줄 요약

| | study_hello | study_hello_Koa |
|---|---|---|
| 서버 | Apollo Server (GraphQL) | Koa (REST API) |
| 클라이언트 통신 방식 | GraphQL 쿼리 | axios HTTP 요청 |
| 상태 관리 | 없음 (Apollo가 자동 처리) | Redux + redux-pender |
| 포트 | 4000 | 4001 |

---

## 1. 서버 통신 방식의 차이: REST vs GraphQL

### study_hello — GraphQL

GraphQL은 클라이언트가 **원하는 데이터를 직접 골라서 요청**하는 방식이다.

```
클라이언트가 보내는 요청:
POST http://localhost:4000/

{
  query HelloQuery {
    hello
  }
}
```

- 엔드포인트가 **딱 하나** (`/`)
- 요청 본문에 "어떤 데이터를 원하는지" 쿼리 언어로 명시
- 서버는 GraphQL 스키마(타입 정의)에 맞게만 응답

```js
// study_hello/server/src/index.js
const typeDefs = `#graphql
  type Query {
    hello: String   // "hello라는 이름으로 문자열을 줄 수 있다" 는 약속
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello from Apollo Server 5!',  // 실제로 데이터를 돌려주는 함수
  },
};
```

---

### study_hello_Koa — REST API

REST API는 **URL 주소로 어떤 데이터인지 구분**하는 방식이다.

```
클라이언트가 보내는 요청:
GET http://localhost:4001/api/hello
```

- 기능마다 **URL이 다르다** (`/api/hello`, `/api/users`, `/api/posts` 등)
- 요청 방식(GET/POST/PUT/DELETE)으로 동작을 구분
- 서버는 JSON 데이터를 바로 돌려줌

```js
// study_hello_Koa/server/src/index.js
router.get('/api/hello', (ctx) => {
  ctx.body = { message: 'Hello from Koa!' };  // URL에 접근하면 JSON 반환
});
```

---

## 2. 클라이언트 코드의 차이

### study_hello — Apollo Client (자동 상태 관리)

Apollo Client는 GraphQL 쿼리를 보내면서 **로딩/에러/데이터 상태를 자동으로 관리**해준다.

```jsx
// study_hello/client/src/App.jsx
import { useQuery, gql } from '@apollo/client';

const HELLO_QUERY = gql`
  query HelloQuery {
    hello        // 서버에 "hello 데이터 줘" 라고 요청
  }
`;

function App() {
  const { loading, error, data } = useQuery(HELLO_QUERY);
  //       ↑ 로딩중?   ↑ 에러?   ↑ 받은 데이터
  //       이 세 가지를 Apollo가 자동으로 채워준다

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return <p>{data.hello}</p>;  // "Hello from Apollo Server 5!"
}
```

- 페이지가 **처음 렌더링될 때 자동으로** 서버에 요청을 보냄
- 별도의 상태 관리 코드 없이 `useQuery` 하나로 끝

---

### study_hello_Koa — axios + Redux + redux-pender (수동 상태 관리)

axios로 HTTP 요청을 보내고, Redux로 상태를 직접 관리한다.

```jsx
// study_hello_Koa/client/src/App.jsx
import { useDispatch, useSelector } from 'react-redux';
import { fetchHelloAction } from './store/modules/hello';

function App() {
  const dispatch = useDispatch();
  // Redux 저장소에서 상태를 꺼낸다
  const { message, loading, error } = useSelector((state) => state.hello);

  const handleClick = () => {
    dispatch(fetchHelloAction());  // 버튼을 눌러야 요청이 시작된다
  };

  return (
    <div>
      <button onClick={handleClick}>Fetch Hello</button>
      {loading && <p>Loading...</p>}
      {message && <p>{message}</p>}   // "Hello from Koa!"
      {error && <p>Error!</p>}
    </div>
  );
}
```

- **버튼을 눌러야** 요청이 시작됨 (자동 아님)
- 상태(`loading`, `message`, `error`)를 Redux 저장소에서 직접 관리

---

## 3. redux-pender가 하는 일

`study_hello_Koa`의 핵심 개념이다. axios 요청은 **시간이 걸리는 비동기 작업**이다.
redux-pender는 이 비동기 과정을 3단계로 자동으로 나눠준다.

```
버튼 클릭
  │
  ▼
dispatch(fetchHelloAction())
  │   payload = axios가 반환하는 Promise (아직 응답 안 옴)
  │
  ▼
redux-pender 미들웨어가 Promise를 감지
  │
  ├─[요청 시작]──► FETCH_HELLO_PENDING  → loading: true
  │
  ├─[성공]────────► FETCH_HELLO_SUCCESS → loading: false, message: "Hello from Koa!"
  │
  └─[실패]────────► FETCH_HELLO_FAILURE → loading: false, error: "에러 내용"
```

코드로 보면:

```js
// study_hello_Koa/client/src/store/modules/hello.js

...pender({
  type: FETCH_HELLO,
  onPending: (state) => ({ ...state, loading: true }),        // 요청 중
  onSuccess: (state, action) => ({
    ...state,
    loading: false,
    message: action.payload.data.message,                      // 성공
  }),
  onFailure: (state, action) => ({ ...state, loading: false, error: action.payload }), // 실패
}),
```

직접 `PENDING`/`SUCCESS`/`FAILURE` 액션을 작성하지 않아도, `pender` 함수가 세 가지 경우를 한 번에 처리해준다.

---

## 4. 전체 데이터 흐름 비교

### study_hello (GraphQL)

```
[App.jsx]
  useQuery 실행 (자동)
      │
      ▼
[Apollo Client]
  POST http://localhost:4000/
  body: { query: "{ hello }" }
      │
      ▼
[Apollo Server]
  resolver 실행: hello() → "Hello from Apollo Server 5!"
      │
      ▼
[Apollo Client]
  data.hello = "Hello from Apollo Server 5!"
      │
      ▼
[App.jsx]
  화면에 data.hello 렌더링
```

---

### study_hello_Koa (REST + Redux)

```
[App.jsx]
  버튼 클릭 → dispatch(fetchHelloAction())
      │
      ▼
[redux-pender 미들웨어]
  FETCH_HELLO_PENDING dispatch → loading: true → 버튼 비활성화
      │
      ▼
[helloApi.js]
  GET http://localhost:4001/api/hello (axios)
      │
      ▼
[Koa 서버]
  router.get('/api/hello') → { message: "Hello from Koa!" }
      │
      ▼
[redux-pender 미들웨어]
  FETCH_HELLO_SUCCESS dispatch
      │
      ▼
[Redux store]
  hello.message = "Hello from Koa!", loading: false
      │
      ▼
[App.jsx]
  useSelector로 message 읽어서 화면에 렌더링
```

---

## 5. 언제 어떤 방식을 쓸까?

| 상황 | 추천 방식 |
|------|----------|
| 여러 종류의 데이터를 한 번에 요청하고 싶을 때 | GraphQL |
| 필요한 필드만 골라서 받고 싶을 때 | GraphQL |
| 단순한 CRUD 작업 (생성/조회/수정/삭제) | REST API |
| 이미 REST API가 있는 서버에 연결할 때 | REST + axios |
| 상태 변화가 복잡하고 여러 컴포넌트가 공유할 때 | Redux |
| 간단한 데이터 조회만 필요할 때 | Apollo useQuery |

실무에서는 두 방식 모두 많이 쓰인다.
`study_hello`는 GraphQL의 편리함을, `study_hello_Koa`는 REST + Redux의 명시적인 흐름을 배울 수 있다.
