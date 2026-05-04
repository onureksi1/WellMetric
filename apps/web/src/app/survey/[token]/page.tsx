import { notFound } from 'next/navigation';
import { SurveyForm } from '@/components/survey/PublicSurveyForm';

export default async function SurveyPage({ params }: { params: { token: string } }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/public-survey/${params.token}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    if (res.status === 404) notFound();
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-md">
          <div className="text-red-500 text-5xl mb-6">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sistem Hatası</h1>
          <p className="text-gray-600">Şu an ankete erişilemiyor. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      </div>
    );
  }

  const { data } = await res.json();

  if (data.is_used) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-md">
          <div className="text-primary text-5xl mb-6">✓</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Anket Tamamlanmış</h1>
          <p className="text-gray-600">Bu anket daha önce doldurulmuş. Katılımınız için teşekkürler!</p>
        </div>
      </div>
    );
  }

  if (new Date(data.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-md">
          <div className="text-amber-500 text-5xl mb-6">⌛</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Anket Süresi Dolmuş</h1>
          <p className="text-gray-600">Üzgünüz, bu anketin katılım süresi sona erdi.</p>
        </div>
      </div>
    );
  }

  return <SurveyForm token={params.token} survey={data.survey} employee={data.employee} />;
}
