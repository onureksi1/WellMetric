'use client';

import { useParams } from 'next/navigation';
import ReportEditor from '@/components/consultant/ReportEditor';

export default function EditReportPage() {
  const params = useParams();
  const id = params.id as string;
  
  return <ReportEditor reportId={id} />;
}
