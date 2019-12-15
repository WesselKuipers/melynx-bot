/**
 * A response for a login token request
 */
export interface TokenResponse {
  /**
   * The bearer access token to use for authenticating requests.
   */
  // eslint-disable-next-line camelcase
  access_token: string;

  /**
   * A refresh token for getting a new access token.
   */
  // eslint-disable-next-line camelcase
  refresh_token: string;
}

export interface User {
  token: string,
  refreshToken: string,
  date: Date,
  id: number,
  name: string,
  discriminator: number,
  avatar: string,
}