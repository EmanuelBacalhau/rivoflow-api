interface CookieOptions {
  isProduction: boolean;
  maxAge?: number;
}

function buildCookie(name: string, value: string, options: CookieOptions): string {
  const sameSite = options.isProduction ? 'none' : 'lax';
  const secure = options.isProduction;
  const maxAge = options.maxAge !== undefined ? `Max-Age=${options.maxAge}; ` : '';
  return `${name}=${value}; HttpOnly; Path=/; ${maxAge}SameSite=${sameSite}; Secure=${secure}`;
}

const ACCESS_TOKEN_MAX_AGE = 7 * 60 * 60; // 7 hours
const REFRESH_TOKEN_MAX_AGE = undefined; // session cookie

export function buildAuthCookies(
  tokens: { accessToken: string; refreshToken: string },
  isProduction: boolean,
): string[] {
  return [
    buildCookie('accessToken', tokens.accessToken, { isProduction, maxAge: ACCESS_TOKEN_MAX_AGE }),
    buildCookie('refreshToken', tokens.refreshToken, { isProduction, maxAge: REFRESH_TOKEN_MAX_AGE }),
  ];
}

export function buildSignOutCookies(isProduction: boolean): string[] {
  return [
    buildCookie('accessToken', '', { isProduction, maxAge: 0 }),
    buildCookie('refreshToken', '', { isProduction, maxAge: 0 }),
  ];
}
