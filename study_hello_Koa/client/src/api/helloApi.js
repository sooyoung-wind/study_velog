import axios from 'axios';

const BASE_URL = 'http://localhost:4001';

export const fetchHello = () => axios.get(`${BASE_URL}/api/hello`);
