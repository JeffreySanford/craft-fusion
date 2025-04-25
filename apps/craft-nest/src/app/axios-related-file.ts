import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

// Use HTTP in development to avoid SSL errors
if (process.env.NODE_ENV !== 'production') {
  axios.defaults.baseURL = 'http://localhost:3000';
}

export async function axiosGet<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return axios.get<T>(url, config);
}