function buildCookie(name: string, value: string, maxAge?: number): string {
  const maxAgePart = maxAge !== undefined ? `Max-Age=${maxAge}; ` : '';
  return `${name}=${value}; HttpOnly; Path=/; ${maxAgePart}SameSite=None; Secure`;
}

const ACCESS_TOKEN_MAX_AGE = 7 * 60 * 60; // 7 hours

export function buildAuthCookies(tokens: { accessToken: string; refreshToken: string }): string[] {
  return [
    buildCookie('accessToken', tokens.accessToken, ACCESS_TOKEN_MAX_AGE),
    buildCookie('refreshToken', tokens.refreshToken),
  ];
}

export function buildSignOutCookies(): string[] {
  return [
    buildCookie('accessToken', '', 0),
    buildCookie('refreshToken', '', 0),
  ];
}
