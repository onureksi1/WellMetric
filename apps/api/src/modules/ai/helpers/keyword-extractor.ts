export function extractKeywords(openTextContent: string): string[] {
  if (!openTextContent) return [];

  // Turkish stop words
  const stopWords = new Set([
    've', 'bir', 'bu', 'ile', 'da', 'de', 'için', 'çok', 'daha', 'en', 'kadar', 'ise', 'ki', 'mi', 'miyim', 'mıyız',
    'fakat', 'ancak', 'lakin', 'ancak', 'veya', 'yahut', 'ki', 'ise', 'ya', 'şayet', 'eğer', 'mı', 'mu', 'mü',
    'ben', 'sen', 'o', 'biz', 'siz', 'onlar', 'beni', 'seni', 'onu', 'bizi', 'sizi', 'onları',
    'bana', 'sana', 'ona', 'bize', 'size', 'onlara', 'bende', 'sende', 'onda', 'bizde', 'sizde', 'onlarda',
    'benden', 'senden', 'ondan', 'bizden', 'sizden', 'onlardan', 'benim', 'senin', 'onun', 'bizim', 'sizin', 'onların',
    'the', 'and', 'for', 'with', 'this', 'that', 'from', 'but'
  ]);

  // Clean and split
  const words = openTextContent
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count frequencies
  const freq: Record<string, number> = {};
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });

  // Sort and get top 5
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0]);
}
