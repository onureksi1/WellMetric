'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import client from '@/lib/api/client';
import { Layers, Calendar, BarChart3, Clock } from 'lucide-react';
import { AssignSurveyModal } from '@/components/surveys/AssignSurveyModal';
import { toast } from 'react-hot-toast';

interface SurveysTabProps {
  companyId: string;
}

export const SurveysTab: React.FC<SurveysTabProps> = ({ companyId }) => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/admin/companies/${companyId}/surveys`);
      setSurveys(res.data.data || res.data || []);
    } catch (err) {
      toast.error('Atanan anketler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [companyId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-navy">Atanan Anketler</h3>
        <Button onClick={() => setIsAssignModalOpen(true)} className="gap-2">
          <Layers size={18} /> Anket Ata
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl" />)}
        </div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          Bu firmaya henüz anket atanmamış.
        </div>
      ) : (
        <div className="space-y-4">
          {surveys.map((assignment) => (
            <Card key={assignment.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy">{assignment.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {assignment.period}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {assignment.due_at ? new Date(assignment.due_at).toLocaleDateString('tr-TR') : 'Süresiz'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-gray-400">Kampanya</p>
                    <p className="text-sm font-bold text-navy">{assignment.campaign_count} Gönderim</p>
                  </div>
                  <Badge variant={assignment.status === 'active' ? 'green' : 'gray'}>
                    {assignment.status === 'active' ? 'AKTİF' : 'TAMAMLANDI'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AssignSurveyModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        initialCompanyId={companyId}
        onSuccess={fetchSurveys}
      />
    </div>
  );
};
