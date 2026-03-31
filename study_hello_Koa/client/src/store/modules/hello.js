import { createAction, handleActions } from 'redux-actions';
import { pender } from 'redux-pender';
import { fetchHello } from '../../api/helloApi';

// Action type
const FETCH_HELLO = 'hello/FETCH_HELLO';

// Action creator — payload must be the raw Promise
export const fetchHelloAction = createAction(FETCH_HELLO, () => fetchHello());

// Initial state
const initialState = {
  message: null,
  loading: false,
  error: null,
};

// Reducer
export default handleActions(
  {
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
  },
  initialState
);
