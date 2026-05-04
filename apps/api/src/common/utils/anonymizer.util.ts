export class Anonymizer {
  // Türkçe ve İngilizce isim pattern'ları
  private static readonly NAME_PATTERNS = [
    /\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\s[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\b/g, // Ad Soyad
  ];

  private static readonly EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  private static readonly PHONE_PATTERN = /(\+90|0)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}/g;

  static anonymize(text: string): string {
    if (!text) return text;
    return text
      .replace(this.EMAIL_PATTERN, '[E-POSTA]')
      .replace(this.PHONE_PATTERN, '[TELEFON]')
      .replace(this.NAME_PATTERNS[0], '[KİŞİ]');
  }

  static anonymizeArray(texts: string[]): string[] {
    return texts.map(t => this.anonymize(t));
  }
}
