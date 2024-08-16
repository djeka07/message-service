// @ts-nocheck
import { AxiosResponse, AxiosRequestConfig } from 'axios'; // ignore
class ClientBase {
  protected transformOptions(incomingOptions: AxiosRequestConfig) {
    const instanceOptionHeaders = this['instance']?.defaults?.headers || {};

    let options = <AxiosRequestConfig>{
      ...(incomingOptions || {}),
      baseUrl: incomingOptions.baseURL || '',
      headers: {
        ...instanceOptionHeaders,
        'Cache-Control': 'max-age=0, no-cache',
        accept: 'application/json',
        'Content-Type': 'application/json',
        ...(incomingOptions.headers || {}),
      },
      transformResponse: (data: any) => data,
    };

    if (instanceOptionHeaders?.accessToken) {
      options = {
        ...options,
        headers: {
          ...options.headers,
          'Ocp-Apim-Subscription-Key': `${instanceOptionHeaders?.accessToken}`,
        },
      };
    }

    if (instanceOptionHeaders?.authorization) {
      options = {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `${instanceOptionHeaders?.authorization}`,
        },
      };
    }

    return Promise.resolve(options);
  }

  protected transformResult(
    url: string,
    response: AxiosResponse,
    processor: (response: AxiosResponse) => any,
  ) {
    const { config } = response;
    try {
      return processor(response);
    } catch (error) {
      throw error;
    }
  }
}
