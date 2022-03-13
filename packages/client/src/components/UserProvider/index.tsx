import axios from 'axios';

import { UserContext } from '../../hooks/useUser';
import { User } from '../../types';
import useQuery from '../../hooks/useQuery';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function UserProvider({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const [user, setUser] = useState<User>(null);
  const query = useQuery();

  useEffect(() => {
    if (localStorage.user) {
      const { token } = JSON.parse(localStorage.user);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      refreshUser();
    }
  }, []);

  useEffect(() => {
    axios.defaults.baseURL = String(import.meta.env.API_URL || '');
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const token = query.get('token');
      const refreshToken = query.get('refreshToken');
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const { data: discordUser } = await axios.get('https://discordapp.com/api/users/@me');
      const u = {
        token,
        refreshToken,
        date: new Date(),
        id: discordUser.id,
        name: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar,
      };
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);

      window.history.pushState(
        {},
        document.title,
        `/${
          window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split('?')[0]
        }`
      );
    };

    if (query.has('token')) {
      getUser();
    }
  }, [query]);

  const refreshUser = useCallback(async () => {
    const { data: discordUser } = await axios.get('https://discordapp.com/api/users/@me');
    setUser({
      ...user,
      id: discordUser.id,
      name: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
    });
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    delete axios.defaults.headers.common.Authorization;
    delete localStorage.user;
  }, []);

  const value = useMemo(
    () => ({
      logout,
      user,
      refreshUser,
    }),
    [logout, user, refreshUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
