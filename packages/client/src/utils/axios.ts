export const apiUrl = import.meta.env.VITE_API_URL;
import axios from 'axios';

console.log(apiUrl);
const instance = axios.create({ baseURL: apiUrl || '' });
export default instance;
