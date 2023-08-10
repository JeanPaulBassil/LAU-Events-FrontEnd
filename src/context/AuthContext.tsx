import * as SecureStore from 'expo-secure-store';
import jwt_decode from 'jwt-decode';
import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthApi, LoginResponse, SignUpResposne } from '../utils/api/auth/auth.api';
import { User, UserRole } from '../models/user';

const SECURE_STORE_USER_KEY = 'user';

export interface AuthState {
  user: User | null;
  authenticated: boolean | null;
  isVerified: boolean | null;
}

interface AuthContextProps {
  signIn: (opts: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
  signUp: (opts: { email: string; password: string; major: string }) => Promise<void>;
  verify: (code: string) => Promise<void>;
  authState: AuthState;
}

export const AuthContext = createContext<AuthContextProps | null>(null);

export function useAuth(): AuthContextProps {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      signIn: async () => {},
      signOut: () => {},
      signUp: async () => {},
      verify: async () => {},
      authState: {
        user: null,
        authenticated: null,
        isVerified: null,
      },
    };
  }
  return context;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    authenticated: null,
    isVerified: null,
  });

  const credentialsSignIn = useMemo(
    () =>
      async ({ email, password }: { email: string; password: string }) => {
        try {
          const res = await new AuthApi().login(email, password);

          const {
            accessToken,
            refreshToken,
            id,
            email: userEmail,
            major,
            createdAt,
          } = res as LoginResponse;
          // decode the jwt to get the isAdmin flag
          const role: UserRole = (jwt_decode(accessToken) as { role: UserRole }).role;

          await SecureStore.setItemAsync(
            SECURE_STORE_USER_KEY,
            JSON.stringify({
              accessToken,
              refreshToken,
              id,
              email: userEmail,
              role,
              major,
              createdAt,
            })
          );
          setAuthState({
            user: { accessToken, refreshToken, id, email: userEmail, role, major, createdAt },
            authenticated: true,
            isVerified: true,
          });
        } catch (e) {
          throw e;
        }
      },
    []
  );

  const signUp = useMemo(
    () =>
      async ({ email, password, major }: { email: string; password: string; major: string }) => {
        try {
          const res = await new AuthApi().signup(email, password, major);
          const { message, userId } = res;
          await SecureStore.setItemAsync(
            SECURE_STORE_USER_KEY,
            JSON.stringify({ accessToken: null, refreshToken: null, id: userId, email: email })
          );
          setAuthState({
            user: {
              accessToken: undefined,
              refreshToken: undefined,
              id: userId.toString(),
              email: email,
              major: '',
              createdAt: '',
            },
            authenticated: false,
            isVerified: false,
          });
        } catch (e) {
          throw e;
        }
        return;
      },
    []
  );

  const refresh = useMemo(
    () => async (state: AuthState) => {
      if (!state.user || !state.user.accessToken || !state.user.refreshToken) return;

      try {
        const { accessToken } = await new AuthApi().refresh(state.user.refreshToken);

        const role: UserRole = (jwt_decode(accessToken) as { role: UserRole }).role;

        await SecureStore.setItemAsync(
          SECURE_STORE_USER_KEY,
          JSON.stringify({
            accessToken,
            refreshToken: state.user.refreshToken,
            id: state.user.id,
            email: state.user.email,
            role: role,
            major: state.user.major,
            createdAt: state.user.createdAt,
          })
        );
        setAuthState({
          user: {
            accessToken,
            refreshToken: state.user.refreshToken,
            id: state.user.id,
            email: state.user.email,
            role: state.user.role,
            major: state.user.major,
            createdAt: state.user.createdAt,
          },
          authenticated: true,
          isVerified: true,
        });
      } catch (e) {
        console.log(e);
        setAuthState({
          user: null,
          authenticated: false,
          isVerified: null,
        });
      }
    },
    []
  );

  const verify = useMemo(
    () => async (code: string) => {
      // this should exists because we need the userId to send the verification request
      console.log(authState);
      if (!authState.user || !authState.user.id) return;

      try {
        const { accessToken, email, refreshToken, id, createdAt, major } =
          await new AuthApi().verify(code, authState.user.id.toString());

        const role: UserRole = (jwt_decode(accessToken) as { role: UserRole }).role;

        await SecureStore.setItemAsync(
          SECURE_STORE_USER_KEY,
          JSON.stringify({
            accessToken,
            refreshToken: refreshToken,
            id: id,
            email: email,
            role: role,
            major: major,
            createdAt: createdAt,
          })
        );
        setAuthState({
          user: {
            accessToken,
            refreshToken: refreshToken,
            id: id,
            email: email,
            role: role,
            major,
            createdAt,
          },
          authenticated: true,
          isVerified: true,
        });
      } catch (e) {
        console.log(e);
      }
    },
    []
  );

  useEffect(() => {
    // Load user
    SecureStore.getItemAsync(SECURE_STORE_USER_KEY)
      .then((r) => {
        if (!r) {
          setAuthState({
            user: null,
            authenticated: false,
            isVerified: null,
          });

          return;
        }
        const u = JSON.parse(r) as User;
        if (!u || !u.accessToken || !u.refreshToken) {
          setAuthState({
            user: {
              accessToken: u?.accessToken ?? undefined,
              refreshToken: u?.refreshToken ?? undefined,
              id: u?.id ?? null,
              email: u?.email ?? null,
              role: u?.role ?? undefined,
              major: u?.major ?? null,
              createdAt: u?.createdAt ?? null,
            },
            authenticated: false,
            isVerified: authState.isVerified ?? null,
          });
          return;
        }

        setAuthState({
          user: u,
          authenticated: true,
          isVerified: true,
        });
      })
      .catch((e) => {
        console.log(e);
        setAuthState({
          user: null,
          authenticated: false,
          isVerified: null,
        });
      });
  }, []);

  useEffect(() => {
    // handle jwt expiry
    if (!authState.user || !authState.user.accessToken) return;

    let handle: NodeJS.Timeout | null = null;
    const { exp } = jwt_decode(authState.user.accessToken) as { exp: number };

    if (+new Date() - exp * 1000 > 0) {
      refresh(authState);
    } else {
      handle = setTimeout(
        () => {
          refresh(authState);
        },
        exp * 1000 - +new Date() + 1
      );
    }

    return () => {
      if (handle) clearTimeout(handle);
    };
  }, [refresh, authState]);

  return (
    <AuthContext.Provider
      value={{
        signIn: credentialsSignIn,
        signUp,
        signOut: async () => {
          await SecureStore.deleteItemAsync(SECURE_STORE_USER_KEY);
          setAuthState({
            user: null,
            authenticated: false,
            isVerified: null,
          });
        },
        verify: verify,
        authState,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
