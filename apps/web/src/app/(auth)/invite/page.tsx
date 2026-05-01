'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/lib/store/auth.store';
import client from '@/lib/api/client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import '@/lib/i18n';

export default function InvitePage() {
  const { t } = useTranslation('auth');
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-navy">{t('common.loading', 'Yükleniyor...')}</div>}>
      <InviteContent />
    </Suspense>
  );
}


function InviteContent() {
  const { t } = useTranslation(['auth', 'common']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const setAuth = useAuthStore((state) => state.setAuth);


  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    // Verify token validity
    client.get(`/auth/invite/verify?token=${token}`)
      .then(() => setTokenValid(true))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('reset_password.error_match', 'Şifreler eşleşmiyor'));
      return;
    }
    if (password.length < 8) {
      toast.error(t('reset_password.requirements', 'Şifre en az 8 karakter olmalıdır'));
      return;
    }


    setLoading(true);
    try {
      const { data } = await client.post('/auth/invite/accept', { token, password });
      setAuth(data.user, data.access_token);
      toast.success(t('invite.success', 'Hesabınız oluşturuldu'));
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('invite.error_generic', 'Hesap oluşturulamadı'));
    } finally {

      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-danger">{t('invite.error_expired_title', 'Geçersiz Davet')}</h1>
          <p className="text-gray-600 mt-2">{t('invite.error_expired', 'Bu davet linki geçersiz veya süresi dolmuş.')}</p>
          <Button className="mt-4" variant="ghost" onClick={() => router.push('/login')}>{t('demo.back_to_login', 'Giriş Ekranına Dön')}</Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-navy">
          {t('invite.title', 'Hesabınızı Oluşturun')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('invite.subtitle', 'Wellbeing Platformuna Hoş Geldiniz')}
        </p>
      </div>


      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('invite.new_password', 'Yeni Şifre')}
              </label>

              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('invite.confirm_password', 'Şifre Tekrar')}
              </label>

              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" loading={loading || tokenValid === null}>
                {t('invite.submit', 'Hesap Oluştur')}
              </Button>
            </div>

          </form>
        </Card>
      </div>
    </div>
  );
}
