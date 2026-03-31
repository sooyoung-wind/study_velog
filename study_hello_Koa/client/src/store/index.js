import { createStore, combineReducers, applyMiddleware } from 'redux';
import penderMiddleware from 'redux-pender';
import hello from './modules/hello';

const rootReducer = combineReducers({ hello });

const store = createStore(rootReducer, applyMiddleware(penderMiddleware()));

export default store;
