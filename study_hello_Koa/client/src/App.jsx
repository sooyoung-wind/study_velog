import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHelloAction } from './store/modules/hello';

function App() {
  const dispatch = useDispatch();
  const { message, loading, error } = useSelector((state) => state.hello);

  const handleClick = () => {
    dispatch(fetchHelloAction());
  };

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
}

export default App;
