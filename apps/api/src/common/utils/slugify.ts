/**
 * Converts a string to a URL-friendly slug.
 * Specifically handles Turkish characters as per requirements.
 */
export function slugify(text: string): string {
  const trMap: Record<string, string> = {
    'ğ': 'g', 'Ğ': 'g',
    'ş': 's', 'Ş': 's',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ü': 'u', 'Ü': 'u',
    'ç': 'c', 'Ç': 'c',
  };

  let slug = text;
  
  // Replace Turkish characters
  for (const [key, value] of Object.entries(trMap)) {
    slug = slug.replace(new RegExp(key, 'g'), value);
  }

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-')   // Replace spaces/underscores with -
    .replace(/^-+|-+$/g, '');   // Remove leading/trailing -
}
