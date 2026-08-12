import {
  createAuthRequest,
  findAuthRequestByToken,
} from "../repositories/auth-request.repository.js";
import { generateAuthToken } from "../utils/token.js";

const AUTH_REQUEST_EXPIRES_IN_MS = 10 * 60 * 1000;

export async function createAuthenticationRequest(discordId: string) {
  const token = generateAuthToken();

  const expiresAt = new Date(Date.now() + AUTH_REQUEST_EXPIRES_IN_MS);

  const authRequest = await createAuthRequest(discordId, token, expiresAt);

  return authRequest;
}

export async function getAuthenticationRequest(token: string) {
  return findAuthRequestByToken(token);
}
