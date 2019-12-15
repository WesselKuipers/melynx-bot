import { createContext, useContext } from 'react';

import { User } from '../types';

interface UserContext {
  logout(): void;
  user: User;
  refreshUser(): Promise<void>;
}

export const UserContext = createContext<UserContext>(null);

export default function useUser(): UserContext {
  return useContext(UserContext);
}
