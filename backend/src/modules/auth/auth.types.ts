import { UserDTO } from '@modules/user/user.types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: UserDTO;
  tokens: TokenPair;
}
