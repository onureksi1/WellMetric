export const ReportColors = {
  GREEN: '#2E865A',
  YELLOW: '#E07B1A',
  RED: '#C0392B',
  NAVY: '#1A1A2E',
  GRAY: '#BDC3C7',
  WHITE: '#FFFFFF',
  MINT: '#EAF7F2',
};

export class PdfTemplateHelper {
  static getScoreColor(score: number | null): string {
    if (score === null) return ReportColors.GRAY;
    if (score >= 70) return ReportColors.GREEN;
    if (score >= 50) return ReportColors.YELLOW;
    return ReportColors.RED;
  }

  static drawScoreBar(doc: any, x: number, y: number, score: number | null, maxWidth: number) {
    const height = 15;
    const color = this.getScoreColor(score);
    
    // Background
    doc.rect(x, y, maxWidth, height).fill('#F0F0F0');
    
    // Fill
    if (score !== null) {
      const fillWidth = (score / 100) * maxWidth;
      doc.rect(x, y, fillWidth, height).fill(color);
    }
    
    // Text
    doc.fillColor('#000000').fontSize(10).text(
      score !== null ? `${score.toFixed(1)}%` : 'Yetersiz veri',
      x + maxWidth + 10,
      y + 2
    );
  }

  static formatPeriod(period: string, language: string): string {
    const [year, month] = period.split('-');
    const monthNamesTr = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthIndex = parseInt(month) - 1;
    const monthName = language === 'tr' ? monthNamesTr[monthIndex] : monthNamesEn[monthIndex];
    
    return `${monthName} ${year}`;
  }

  static getTranslations(language: string) {
    return language === 'tr' ? {
      title: 'Wellbeing Analiz Raporu',
      preparedBy: 'Wellbeing Platformu tarafından hazırlanmıştır',
      executiveSummary: 'Yönetici Özeti',
      overallScore: 'Genel Wellbeing Skoru',
      participationRate: 'Katılım Oranı',
      criticalFindings: 'Kritik Bulgular',
      positiveFindings: 'Olumlu Bulgular',
      dimensionDetails: 'Boyut Detayları',
      departmentComparison: 'Departman Karşılaştırması',
      employeeVoice: 'Çalışan Sesi',
      anonymousWarning: 'Bu bölüm çalışan yorumlarının anonim özetidir.',
      actionPlan: 'Aksiyon Planı',
      plannedActions: 'Planlanan Aksiyonlar',
      completedActions: 'Tamamlanan Aksiyonlar',
      contactTitle: 'Dernek İletişim',
    } : {
      title: 'Wellbeing Analysis Report',
      preparedBy: 'Prepared by Wellbeing Platform',
      executiveSummary: 'Executive Summary',
      overallScore: 'Overall Wellbeing Score',
      participationRate: 'Participation Rate',
      criticalFindings: 'Critical Findings',
      positiveFindings: 'Positive Findings',
      dimensionDetails: 'Dimension Details',
      departmentComparison: 'Department Comparison',
      employeeVoice: 'Employee Voice',
      anonymousWarning: 'This section is an anonymous summary of employee comments.',
      actionPlan: 'Action Plan',
      plannedActions: 'Planned Actions',
      completedActions: 'Completed Actions',
      contactTitle: 'Contact Us',
    };
  }
}
