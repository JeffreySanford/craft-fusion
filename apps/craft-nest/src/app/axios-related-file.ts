import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export async function axiosGet<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return axios.get<T>(url, config);
}


// ...existing code...