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
import { Modal } from '@/components/ui/Modal';
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
  const { t, i18n } = useTranslation(['auth', 'common']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedKvkk, setAgreedKvkk] = useState(false);
  
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean, type: string | null }>({ isOpen: false, type: null });
  const [legalTexts, setLegalTexts] = useState<any>(null);
  
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

    // Fetch legal texts
    client.get('/public-settings/legal')
      .then(res => setLegalTexts(res.data))
      .catch(err => console.error('Legal texts fetch error', err));
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

    if (!agreedTerms || !agreedPrivacy || !agreedKvkk) {
      toast.error(t('invite.error_legal'));
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
            <div className="space-y-3 pt-2">
              <LegalCheckbox 
                id="terms" 
                checked={agreedTerms} 
                onChange={setAgreedTerms} 
                label={t('invite.checkbox_terms')} 
                viewLabel={t('invite.view')}
                onView={() => setLegalModal({ isOpen: true, type: 'terms' })}
              />
              <LegalCheckbox 
                id="privacy" 
                checked={agreedPrivacy} 
                onChange={setAgreedPrivacy} 
                label={t('invite.checkbox_privacy')} 
                viewLabel={t('invite.view')}
                onView={() => setLegalModal({ isOpen: true, type: 'privacy' })}
              />
              <LegalCheckbox 
                id="kvkk" 
                checked={agreedKvkk} 
                onChange={setAgreedKvkk} 
                label={t('invite.checkbox_kvkk')} 
                viewLabel={t('invite.view')}
                onView={() => setLegalModal({ isOpen: true, type: 'kvkk' })}
              />
            </div>

            <div>
              <Button type="submit" className="w-full" loading={loading || tokenValid === null}>
                {t('invite.submit')}
              </Button>
            </div>

          </form>
        </Card>
      </div>

      <Modal 
        isOpen={legalModal.isOpen} 
        onClose={() => setLegalModal({ isOpen: false, type: null })}
        title={t(`settings.legal.${legalModal.type === 'kvkk' ? 'kvkk_tr' : legalModal.type === 'privacy' ? 'privacy_policy_tr' : 'terms_of_use_tr'}`)}
        size="lg"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-4 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
          {getLegalText(legalModal.type, legalTexts, i18n.language)}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setLegalModal({ isOpen: false, type: null })}>{t('common.close', 'Kapat')}</Button>
        </div>
      </Modal>
    </div>
  );
}

function LegalCheckbox({ id, checked, onChange, label, viewLabel, onView }: any) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
      />
      <div className="flex flex-col">
        <label htmlFor={id} className="text-xs text-gray-600 cursor-pointer select-none">
          {label}
        </label>
        <button 
          type="button" 
          onClick={onView}
          className="text-[10px] text-primary hover:underline font-bold text-left mt-0.5"
        >
          {viewLabel}
        </button>
      </div>
    </div>
  );
}

function getLegalText(type: string | null, texts: any, lang: string) {
  if (!texts) return '...';
  const l = lang === 'tr' ? 'tr' : 'en';
  
  if (type === 'terms') return texts[`terms_of_use_${l}`] || '...';
  if (type === 'privacy') return texts[`privacy_policy_${l}`] || '...';
  if (type === 'kvkk') return l === 'tr' ? texts.kvkk_text_tr : texts.gdpr_text_en;
  
  return '...';
}
