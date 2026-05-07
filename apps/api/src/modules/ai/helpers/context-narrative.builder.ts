export interface IntelligenceReportData {
  companyId: string;
  scores: any;
  prevScores: any;
  departments: any[];
  segments: {
    seniority: any[];
    location: any[];
  };
  benchmark: any;
  openTextKeywords: string[];
}

export function buildContextNarrative(
  data: IntelligenceReportData,
  language: 'tr' | 'en'
): string[] {
  const narratives: string[] = [];

  // 1. Significant Drops
  const dimensions = ['overall', 'mental', 'physical', 'social', 'financial', 'work'];
  dimensions.forEach(dim => {
    const curr = data.scores[dim];
    const prev = data.prevScores[dim];
    if (curr && prev && prev - curr > 5) {
      const delta = (prev - curr).toFixed(1);
      if (language === 'tr') {
        narratives.push(`Genel ${dim} skoru geçen döneme göre ${delta} puan düştü (${prev} -> ${curr}).`);
      } else {
        narratives.push(`Overall ${dim} score dropped by ${delta} points compared to previous period (${prev} -> ${curr}).`);
      }
    }
  });

  // Departmental Drops
  data.departments.forEach(dept => {
    if (dept.overall_prev && dept.overall && dept.overall_prev - dept.overall > 10) {
      const delta = (dept.overall_prev - dept.overall).toFixed(1);
      if (language === 'tr') {
        narratives.push(`${dept.department_name} departmanında genel skor ${delta} puan geriledi.`);
      } else {
        narratives.push(`Overall score in ${dept.department_name} department declined by ${delta} points.`);
      }
    }
  });

  // 3. Paradox Detection (Senior vs Junior)
  if (data.segments.seniority) {
    const senior = data.segments.seniority.find(s => s.segment_value === 'senior');
    const junior = data.segments.seniority.find(s => s.segment_value === 'junior');
    if (senior && junior && senior.overall < junior.overall) {
      if (language === 'tr') {
        narratives.push(`Senior çalışanların skoru (${senior.overall}), Junior çalışanların (${junior.overall}) gerisinde kaldı — bu durum beklenen wellbeing eğiliminin tersidir.`);
      } else {
        narratives.push(`Senior employees score (${senior.overall}) is lower than Junior employees (${junior.overall}) — this is contrary to expected wellbeing trends.`);
      }
    }
  }

  // 4. Remote vs Office
  if (data.segments.location) {
    const remote = data.segments.location.find(l => l.segment_value === 'Remote')?.overall;
    const office = data.segments.location.find(l => l.segment_value === 'İstanbul' || l.segment_value === 'Ofis')?.overall;
    if (remote && office && Math.abs(remote - office) > 10) {
      const diff = Math.abs(remote - office).toFixed(1);
      if (language === 'tr') {
        narratives.push(`Remote çalışanlar (${remote}) ile Ofis çalışanları (${office}) arasında ${diff} puanlık ciddi bir fark tespit edildi.`);
      } else {
        narratives.push(`A significant difference of ${diff} points was detected between Remote employees (${remote}) and Office employees (${office}).`);
      }
    }
  }

  // 6. Open Text Keywords
  if (data.openTextKeywords?.length > 0) {
    if (language === 'tr') {
      narratives.push(`Çalışanların açık uçlu yanıtlarında en çok vurgulanan konular: ${data.openTextKeywords.join(', ')}.`);
    } else {
      narratives.push(`Most emphasized topics in employee open-text responses: ${data.openTextKeywords.join(', ')}.`);
    }
  }

  // 7. Sector Anomaly
  if (data.benchmark?.available) {
    const diff = data.scores.overall - data.benchmark.overall;
    if (Math.abs(diff) > 10) {
      const status = diff > 0 ? (language === 'tr' ? 'yukarısında' : 'above') : (language === 'tr' ? 'aşağısında' : 'below');
      if (language === 'tr') {
        narratives.push(`Şirket wellbeing ortalaması, sektör benchmark'ının ${Math.abs(diff).toFixed(1)} puan ${status}.`);
      } else {
        narratives.push(`Company wellbeing average is ${Math.abs(diff).toFixed(1)} points ${status} the sector benchmark.`);
      }
    }
  }

  // 8. Best vs Worst Dept
  if (data.departments.length > 1) {
    const sorted = [...data.departments].sort((a, b) => b.overall - a.overall);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (language === 'tr') {
      narratives.push(`En yüksek performans gösteren departman: ${best.department_name} (${best.overall}), En düşük: ${worst.department_name} (${worst.overall}).`);
    } else {
      narratives.push(`Highest performing department: ${best.department_name} (${best.overall}), Lowest: ${worst.department_name} (${worst.overall}).`);
    }
  }

  return narratives;
}
