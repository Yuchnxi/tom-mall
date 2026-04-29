import axios from 'axios';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001/api/v1',
  timeout: 10000,
});

export default request;
