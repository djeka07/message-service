import { v4 as uuidv4 } from 'uuid';

type HeadersInput = {
  requestId?: string;
  accessToken?: string;
  xForwardedFor?: string;
};

const createHeaders = ({
  accessToken,
  xForwardedFor,
  requestId,
}: HeadersInput = {}): Headers => {
  const headers: Headers = new Headers({
    'x-request-id': requestId || uuidv4(),
  });

  if (accessToken) {
    headers.append('authorization', accessToken);
  }

  if (xForwardedFor) {
    headers.append('x-forwarded-for', xForwardedFor);
  }

  return headers;
};

export default createHeaders;
