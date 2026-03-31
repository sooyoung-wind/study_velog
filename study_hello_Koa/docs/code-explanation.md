# study_hello_Koa 코드 한 줄씩 이해하기

전체 파일 구조부터 보자.

```
study_hello_Koa/
├── server/
│   └── src/index.js        ← 서버 코드 (Koa)
└── client/
    ├── vite.config.js       ← 개발 도구 설정
    └── src/
        ├── main.jsx         ← 앱의 진입점
        ├── App.jsx          ← 화면에 보이는 컴포넌트
        ├── api/
        │   └── helloApi.js  ← 서버에 요청 보내는 코드
        └── store/
            ├── index.js     ← Redux 저장소 만들기
            └── modules/
                └── hello.js ← 상태 관리 로직
```

읽는 순서: 서버 → api → store/modules → store/index → main → App

---

## 1. server/src/index.js — Koa 서버

```js
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
```

Python으로 치면 `from flask import Flask` 같은 것이다.
필요한 도구들을 불러온다.

- `Koa` : 서버 자체. Python의 Flask/FastAPI 같은 것
- `Router` : URL 경로(라우트)를 등록하는 도구
- `bodyParser` : 클라이언트가 보낸 POST 요청의 본문을 읽을 수 있게 해주는 도구
- `cors` : 다른 포트에서 오는 요청을 허용해주는 도구 (아래에서 자세히 설명)

---

```js
const app = new Koa();
const router = new Router();
```

Python 비교:
```python
# FastAPI라면
app = FastAPI()
```

`app`은 서버 인스턴스다. 이후 모든 설정은 이 `app`에 붙인다.
`router`는 URL 경로들을 모아두는 묶음이다.

---

```js
app.use(cors());
app.use(bodyParser());
```

`app.use()`는 "모든 요청이 들어올 때 이걸 실행해라"는 뜻이다.
Python의 미들웨어(middleware)와 같은 개념이다.

**cors()가 필요한 이유:**

브라우저는 기본적으로 **다른 포트로 요청을 보내는 것을 막는다.**

```
클라이언트: http://localhost:5173  (포트 5173)
서버:       http://localhost:4001  (포트 4001)
```

포트가 다르면 브라우저가 "위험할 수 있으니 막겠다"고 판단한다.
`cors()`는 서버가 "나는 다른 포트에서 오는 요청도 받겠다"고 선언하는 것이다.

---

```js
router.get('/api/hello', (ctx) => {
  ctx.body = { message: 'Hello from Koa!' };
});
```

Python 비교:
```python
# FastAPI라면
@app.get("/api/hello")
def get_hello():
    return {"message": "Hello from Koa!"}
```

- `router.get(...)` : GET 방식으로 `/api/hello` URL에 접근하면 실행
- `ctx` : context의 약자. "이 요청에 대한 모든 정보"가 담긴 객체
- `ctx.body = {...}` : 응답으로 보낼 데이터. Python의 `return {...}` 과 같다

---

```js
app.use(router.routes());
app.use(router.allowedMethods());
```

`router`에 등록한 경로들을 `app`에 실제로 붙이는 코드다.
이 두 줄이 없으면 router에 아무리 경로를 등록해도 동작하지 않는다.

`allowedMethods()`는 허용되지 않은 HTTP 메서드로 요청이 오면
자동으로 적절한 에러(405 Method Not Allowed)를 돌려준다.

---

```js
const PORT = 4001;
app.listen(PORT, () => {
  console.log(`Koa server running on http://localhost:${PORT}`);
});
```

Python 비교:
```python
# uvicorn으로 실행하는 것과 같다
# uvicorn main:app --port 4001
```

4001번 포트로 서버를 시작한다.
서버가 준비되면 콘솔에 메시지를 출력한다.

---

## 2. client/src/api/helloApi.js — 서버에 요청 보내기

```js
import axios from 'axios';

const BASE_URL = 'http://localhost:4001';

export const fetchHello = () => axios.get(`${BASE_URL}/api/hello`);
```

Python 비교:
```python
import requests

BASE_URL = "http://localhost:4001"

def fetch_hello():
    return requests.get(f"{BASE_URL}/api/hello")
```

`axios`는 Python의 `requests` 라이브러리와 같다.
HTTP 요청을 보내는 도구다.

- `axios.get(url)` : GET 요청을 보내고, **Promise를 반환**한다
- Promise는 "아직 결과가 없지만 곧 올 것"을 나타내는 객체다
  - Python의 `asyncio` / `Future` 와 비슷한 개념
  - 요청을 보내고 → 기다리는 동안 다른 일을 할 수 있다 → 응답이 오면 처리

`export`는 이 함수를 다른 파일에서 `import`해서 쓸 수 있게 내보낸다는 뜻이다.

---

## 3. client/src/store/modules/hello.js — 상태 관리 로직

이 파일이 가장 복잡하다. 차근차근 보자.

### Redux가 뭔가

Redux는 **앱 전체의 데이터를 한 곳에서 관리**하는 도구다.

```
Redux가 없으면:
  컴포넌트A → 컴포넌트B → 컴포넌트C 로 데이터를 일일이 전달해야 함

Redux가 있으면:
  모든 컴포넌트가 중앙 저장소(store)에서 직접 데이터를 꺼냄
```

중앙 저장소에는 세 가지 상태가 있다:

```js
const initialState = {
  message: null,   // 서버에서 받은 메시지. 처음엔 없음
  loading: false,  // 요청 중인가? 처음엔 아님
  error: null,     // 에러가 있는가? 처음엔 없음
};
```

---

### Action — 저장소에 변화를 요청하는 신호

```js
const FETCH_HELLO = 'hello/FETCH_HELLO';

export const fetchHelloAction = createAction(FETCH_HELLO, () => fetchHello());
```

Redux에서 상태를 바꾸려면 반드시 **Action**을 통해야 한다.
직접 상태를 건드리지 않고, "이런 일이 일어났다"는 신호를 보내는 것이다.

Python으로 비유하면:
```python
# 직접 바꾸는 것 (Redux에서는 이렇게 하면 안 됨)
state["loading"] = True

# Action을 통해 바꾸는 것 (Redux 방식)
dispatch({ "type": "FETCH_HELLO", "payload": 요청Promise })
```

- `FETCH_HELLO` : 액션의 이름(타입). 문자열로 정의한다
- `createAction(타입, payload생성함수)` : 액션 객체를 만드는 함수를 생성
- `() => fetchHello()` : 액션이 실행될 때 `fetchHello()`(axios 요청)를 실행하고 Promise를 payload로 담는다

---

### redux-pender — 비동기 처리 자동화

```js
...pender({
  type: FETCH_HELLO,
  onPending: (state) => ({
    ...state,
    loading: true,
    error: null,
  }),
  onSuccess: (state, action) => ({
    ...state,
    loading: false,
    message: action.payload.data.message,
  }),
  onFailure: (state, action) => ({
    ...state,
    loading: false,
    error: action.payload,
  }),
}),
```

`pender`는 axios 요청(Promise)의 세 단계를 자동으로 감지해서
각 단계에 맞는 상태 변화를 처리한다.

```
fetchHello() 실행
    │
    ├─ [요청 보내는 중] → onPending 실행 → loading: true
    │
    ├─ [서버가 응답함] → onSuccess 실행 → loading: false, message: "Hello from Koa!"
    │
    └─ [네트워크 오류] → onFailure 실행 → loading: false, error: "에러 내용"
```

**`...state`가 뭔가:**

`...`은 스프레드(spread) 연산자다. "기존 상태를 그대로 복사하고, 그 다음에 오는 것만 바꿔라"는 뜻이다.

```js
// 예시: message만 바꾸고 싶을 때
const state = { message: null, loading: false, error: null };

// ...state 없이 쓰면
{ loading: false, message: "Hello!" }
// → message와 loading만 있고 error가 사라짐 (위험)

// ...state 쓰면
{ ...state, loading: false, message: "Hello!" }
// → { message: "Hello!", loading: false, error: null }
// 기존 상태를 복사한 뒤 loading과 message만 덮어씀 (안전)
```

Python으로 치면:
```python
new_state = {**state, "loading": False, "message": "Hello!"}
```

**`action.payload.data.message`가 뭔가:**

axios가 응답을 받으면 이런 구조로 데이터를 감싼다:

```
action = {
  type: "hello/FETCH_HELLO_SUCCESS",
  payload: {            ← axios 응답 객체
    data: {             ← 서버가 실제로 보낸 JSON
      message: "Hello from Koa!"   ← 우리가 원하는 값
    },
    status: 200,
    headers: { ... },
    ...
  }
}
```

그래서 `action.payload.data.message`로 접근한다.

---

### Reducer — 상태를 실제로 바꾸는 함수

```js
export default handleActions(
  { ...pender({ ... }) },
  initialState
);
```

`handleActions`는 "어떤 액션이 오면 어떻게 상태를 바꿀지"를 정의한다.

Python으로 치면:
```python
def reducer(state=initial_state, action=None):
    if action["type"] == "FETCH_HELLO_PENDING":
        return {**state, "loading": True}
    elif action["type"] == "FETCH_HELLO_SUCCESS":
        return {**state, "loading": False, "message": action["payload"]["data"]["message"]}
    elif action["type"] == "FETCH_HELLO_FAILURE":
        return {**state, "loading": False, "error": action["payload"]}
    return state
```

`pender`가 이 세 가지 case를 자동으로 만들어주는 것이다.

---

## 4. client/src/store/index.js — Redux 저장소 만들기

```js
import { createStore, combineReducers, applyMiddleware } from 'redux';
import penderMiddleware from 'redux-pender';
import hello from './modules/hello';

const rootReducer = combineReducers({ hello });

const store = createStore(rootReducer, applyMiddleware(penderMiddleware()));

export default store;
```

**`combineReducers`가 왜 필요한가:**

앱이 커지면 기능별로 reducer를 나눈다.
예: `hello`, `user`, `posts` 각각 따로 관리.
`combineReducers`는 이것들을 하나로 합친다.

```js
combineReducers({ hello })
// 결과적으로 저장소 구조가 이렇게 됨:
// {
//   hello: { message: null, loading: false, error: null }
// }
```

지금은 `hello` 하나만 있지만, 나중에 추가하기 쉬운 구조다.

**`applyMiddleware(penderMiddleware())`가 뭔가:**

미들웨어는 "액션이 dispatch되고 reducer에 도달하기 전에 중간에서 처리하는 것"이다.

```
dispatch(fetchHelloAction())
         │
         ▼
  [penderMiddleware]  ← 여기서 Promise를 감지해서
         │              PENDING / SUCCESS / FAILURE로 나눔
         ▼
     reducer 실행
         │
         ▼
     store 상태 업데이트
```

`penderMiddleware`가 없으면 Redux는 Promise를 그냥 액션 payload로 저장해버린다.
미들웨어가 있어야 "아, 이건 비동기 요청이구나"하고 세 단계로 나눠준다.

---

## 5. client/src/main.jsx — 앱의 진입점

```js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store/index';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

`index.html`에 `<div id="root"></div>`가 있다.
`ReactDOM.createRoot(...).render(...)`는 그 빈 div 안에 React 앱을 집어넣는다.

**`<Provider store={store}>`가 뭔가:**

Redux store를 앱 전체에 공급하는 컨테이너다.
이 안에 있는 모든 컴포넌트는 store에 접근할 수 있다.

Python으로 비유하면 전역 변수처럼 어디서든 접근 가능하게 해주는 것인데,
전역 변수보다 훨씬 안전하게 관리된다.

**`<React.StrictMode>`가 뭔가:**

개발할 때만 작동하는 검사 도구다.
잠재적인 문제를 미리 경고해준다. 실제 서비스(production)에서는 영향 없다.

---

## 6. client/src/App.jsx — 화면에 보이는 컴포넌트

```js
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHelloAction } from './store/modules/hello';

function App() {
  const dispatch = useDispatch();
  const { message, loading, error } = useSelector((state) => state.hello);
```

- `useDispatch()` : 액션을 store에 보내는 함수를 가져온다
- `useSelector(state => state.hello)` : store에서 `hello` 상태를 꺼낸다

`useSelector`에서 `state.hello`인 이유:
store/index.js에서 `combineReducers({ hello })`로 만들었기 때문에
저장소 구조가 `{ hello: { message, loading, error } }`이기 때문이다.

---

```js
const handleClick = () => {
  dispatch(fetchHelloAction());
};
```

버튼이 클릭되면 실행되는 함수다.
`dispatch(fetchHelloAction())`는 액션을 store로 보낸다.
→ penderMiddleware가 받아서 axios 요청 실행
→ 응답에 따라 PENDING / SUCCESS / FAILURE 처리

---

```jsx
return (
  <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
    <h1>Study Hello Koa</h1>
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Loading...' : 'Fetch Hello'}
    </button>
    {message && <p>Response: <strong>{message}</strong></p>}
    {error && <p style={{ color: 'red' }}>Error: {String(error)}</p>}
  </div>
);
```

JSX는 JavaScript 안에 HTML처럼 생긴 코드를 쓸 수 있게 해주는 문법이다.

- `disabled={loading}` : loading이 true면 버튼을 비활성화 (중복 요청 방지)
- `{loading ? 'Loading...' : 'Fetch Hello'}` : loading이면 'Loading...', 아니면 'Fetch Hello' 표시
- `{message && <p>...</p>}` : message가 있을 때만 `<p>` 태그를 보여줌
  - Python으로 치면 `message and print(message)` 와 같은 단축 평가(short-circuit)

Python 비교:
```python
# {message && <p>{message}</p>} 는 Python에서
if message:
    print(f"Response: {message}")
```

---

## 7. client/vite.config.js — 개발 도구 설정

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  optimizeDeps: {
    include: ['redux-actions', 'redux-pender'],
  },
});
```

Vite는 React 개발 서버를 실행하고 파일을 빌드하는 도구다.
Python으로 치면 `uvicorn`이나 `gunicorn` 같은 역할이다.

- `plugins: [react()]` : JSX 문법을 브라우저가 이해하는 JS로 변환해준다
- `server: { port: 5173 }` : 개발 서버를 5173번 포트에서 실행
- `define: { 'process.env.NODE_ENV': ... }` : 기술적인 호환성 설정. `redux-actions` 라이브러리가 오래된 방식으로 만들어져서 이 설정이 없으면 에러가 남
- `optimizeDeps: { include: [...] }` : 오래된 방식(CommonJS)으로 만들어진 라이브러리를 Vite가 미리 처리해두라는 설정

---

## 전체 흐름 한눈에 보기

```
[브라우저] http://localhost:5173
    │
    │  1. 페이지 로드
    ▼
[App.jsx]
  초기 상태: message=null, loading=false
  → 버튼 "Fetch Hello" 표시
    │
    │  2. 버튼 클릭 → dispatch(fetchHelloAction())
    ▼
[penderMiddleware]
  payload가 Promise임을 감지
  → FETCH_HELLO_PENDING dispatch
    │
    ▼
[hello.js reducer - onPending]
  loading: true 로 상태 변경
    │
    ▼
[App.jsx 리렌더링]
  버튼 → "Loading..." (비활성화)
    │
    │  3. axios가 서버에 GET 요청
    ▼
[Koa 서버] http://localhost:4001/api/hello
  → { message: "Hello from Koa!" } 응답
    │
    ▼
[penderMiddleware]
  응답 받음 → FETCH_HELLO_SUCCESS dispatch
    │
    ▼
[hello.js reducer - onSuccess]
  loading: false, message: "Hello from Koa!" 로 상태 변경
    │
    ▼
[App.jsx 리렌더링]
  버튼 → "Fetch Hello" (다시 활성화)
  → "Response: Hello from Koa!" 표시
```
