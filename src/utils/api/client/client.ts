import * as AxiosLogger from 'axios-logger';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Session } from '../../../../types/auth';
import { API_URL } from '../../../constants';

AxiosLogger.setGlobalConfig({
  data: false,
});

export function createClient(session?: Session): AxiosInstance {
  let config: AxiosRequestConfig = {
    baseURL: API_URL,
  };
  if (session) {
    config = {
      ...config,
      headers: {
        Authorization: `Bearer ${<string>session.accessToken}`,
      },
    };
  }

  const instance = axios.create(config);
  return instance;
}
