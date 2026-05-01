export const WELLBEING_DIMENSIONS = [
  { id: 'overall', icon: '✨', color: 'primary' },
  { id: 'physical', icon: '💪', color: 'blue' },
  { id: 'mental', icon: '🧠', color: 'purple' },
  { id: 'social', icon: '🤝', color: 'orange' },
  { id: 'financial', icon: '💰', color: 'green' },
  { id: 'work', icon: '💼', color: 'indigo' },
];

export const SCORE_LEVELS = {
  GOOD: { min: 70, color: 'text-primary', bg: 'bg-primary/10', label: 'good' },
  WARNING: { min: 50, color: 'text-warning', bg: 'bg-warning/10', label: 'warning' },
  CRITICAL: { min: 0, color: 'text-danger', bg: 'bg-danger/10', label: 'critical' },
};
