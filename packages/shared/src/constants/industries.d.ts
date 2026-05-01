export declare const INDUSTRIES: readonly [{
    readonly value: "technology";
    readonly label_tr: "Teknoloji";
    readonly label_en: "Technology";
}, {
    readonly value: "finance";
    readonly label_tr: "Finans & Bankacılık";
    readonly label_en: "Finance & Banking";
}, {
    readonly value: "healthcare";
    readonly label_tr: "Sağlık";
    readonly label_en: "Healthcare";
}, {
    readonly value: "retail";
    readonly label_tr: "Perakende";
    readonly label_en: "Retail";
}, {
    readonly value: "manufacturing";
    readonly label_tr: "Üretim & Sanayi";
    readonly label_en: "Manufacturing";
}, {
    readonly value: "education";
    readonly label_tr: "Eğitim";
    readonly label_en: "Education";
}, {
    readonly value: "logistics";
    readonly label_tr: "Lojistik & Taşımacılık";
    readonly label_en: "Logistics & Transportation";
}, {
    readonly value: "energy";
    readonly label_tr: "Enerji";
    readonly label_en: "Energy";
}, {
    readonly value: "construction";
    readonly label_tr: "İnşaat & Gayrimenkul";
    readonly label_en: "Construction & Real Estate";
}, {
    readonly value: "media";
    readonly label_tr: "Medya & İletişim";
    readonly label_en: "Media & Communications";
}, {
    readonly value: "tourism";
    readonly label_tr: "Turizm & Otelcilik";
    readonly label_en: "Tourism & Hospitality";
}, {
    readonly value: "food_beverage";
    readonly label_tr: "Gıda & İçecek";
    readonly label_en: "Food & Beverage";
}, {
    readonly value: "automotive";
    readonly label_tr: "Otomotiv";
    readonly label_en: "Automotive";
}, {
    readonly value: "telecom";
    readonly label_tr: "Telekomünikasyon";
    readonly label_en: "Telecommunications";
}, {
    readonly value: "insurance";
    readonly label_tr: "Sigorta";
    readonly label_en: "Insurance";
}, {
    readonly value: "consulting";
    readonly label_tr: "Danışmanlık";
    readonly label_en: "Consulting";
}, {
    readonly value: "public_sector";
    readonly label_tr: "Kamu Sektörü";
    readonly label_en: "Public Sector";
}, {
    readonly value: "ngo";
    readonly label_tr: "STK & Sivil Toplum";
    readonly label_en: "NGO & Civil Society";
}, {
    readonly value: "other";
    readonly label_tr: "Diğer";
    readonly label_en: "Other";
}];
export type IndustryValue = typeof INDUSTRIES[number]['value'];
export declare function getIndustryLabel(value: string, lang?: 'tr' | 'en'): string;
