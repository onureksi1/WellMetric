'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsNewPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/consultant/reports');
  }, []);
  return null;
}
