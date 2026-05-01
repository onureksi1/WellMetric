import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import client from '../api/client';

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  return async () => {
    try {
      // 1. DELETE /api/v1/auth/logout
      await client.delete('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 2. Cookie temizle (handled by backend usually with Set-Cookie: max-age=0, but client-side we clear store)
      // 3. Zustand store temizle
      clearAuth();
      // 4. /login'e redirect
      router.push('/login');
    }
  };
}
