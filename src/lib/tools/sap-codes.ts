export interface LangCode {
  sap: string;
  iso2: string;
  name: string;
}

/** SAP 1-character language keys (T002) ↔ ISO 639-1. Note SAP's non-obvious ones. */
export const LANGUAGES: LangCode[] = [
  { sap: "E", iso2: "EN", name: "English" },
  { sap: "D", iso2: "DE", name: "German" },
  { sap: "F", iso2: "FR", name: "French" },
  { sap: "S", iso2: "ES", name: "Spanish" },
  { sap: "P", iso2: "PT", name: "Portuguese" },
  { sap: "I", iso2: "IT", name: "Italian" },
  { sap: "N", iso2: "NL", name: "Dutch" },
  { sap: "J", iso2: "JA", name: "Japanese" },
  { sap: "1", iso2: "ZH", name: "Chinese (simplified)" },
  { sap: "M", iso2: "ZF", name: "Chinese (traditional)" },
  { sap: "3", iso2: "RU", name: "Russian" },
  { sap: "R", iso2: "RU", name: "Russian (legacy key)" },
  { sap: "L", iso2: "PL", name: "Polish" },
  { sap: "K", iso2: "KO", name: "Korean" },
  { sap: "T", iso2: "TR", name: "Turkish" },
  { sap: "V", iso2: "SV", name: "Swedish" },
  { sap: "O", iso2: "NO", name: "Norwegian" },
  { sap: "Q", iso2: "DA", name: "Danish" },
  { sap: "U", iso2: "FI", name: "Finnish" },
  { sap: "C", iso2: "CS", name: "Czech" },
  { sap: "H", iso2: "HU", name: "Hungarian" },
  { sap: "B", iso2: "TH", name: "Thai" },
  { sap: "i", iso2: "ID", name: "Indonesian (Bahasa Indonesia)" },
  { sap: "4", iso2: "AR", name: "Arabic" },
  { sap: "8", iso2: "HE", name: "Hebrew" },
  { sap: "5", iso2: "EL", name: "Greek" },
  { sap: "2", iso2: "SH", name: "Serbian" },
  { sap: "Z", iso2: "ZC", name: "Customer reserve" },
];

export interface CountryCode {
  iso2: string;
  iso3: string;
  num: string;
  name: string;
}

export const COUNTRIES: CountryCode[] = [
  { iso2: "ID", iso3: "IDN", num: "360", name: "Indonesia" },
  { iso2: "SG", iso3: "SGP", num: "702", name: "Singapore" },
  { iso2: "MY", iso3: "MYS", num: "458", name: "Malaysia" },
  { iso2: "DE", iso3: "DEU", num: "276", name: "Germany" },
  { iso2: "US", iso3: "USA", num: "840", name: "United States" },
  { iso2: "GB", iso3: "GBR", num: "826", name: "United Kingdom" },
  { iso2: "IN", iso3: "IND", num: "356", name: "India" },
  { iso2: "JP", iso3: "JPN", num: "392", name: "Japan" },
  { iso2: "CN", iso3: "CHN", num: "156", name: "China" },
  { iso2: "AU", iso3: "AUS", num: "036", name: "Australia" },
  { iso2: "FR", iso3: "FRA", num: "250", name: "France" },
  { iso2: "NL", iso3: "NLD", num: "528", name: "Netherlands" },
  { iso2: "BR", iso3: "BRA", num: "076", name: "Brazil" },
  { iso2: "CA", iso3: "CAN", num: "124", name: "Canada" },
  { iso2: "CH", iso3: "CHE", num: "756", name: "Switzerland" },
  { iso2: "AE", iso3: "ARE", num: "784", name: "United Arab Emirates" },
  { iso2: "SA", iso3: "SAU", num: "682", name: "Saudi Arabia" },
  { iso2: "KR", iso3: "KOR", num: "410", name: "South Korea" },
  { iso2: "TH", iso3: "THA", num: "764", name: "Thailand" },
  { iso2: "VN", iso3: "VNM", num: "704", name: "Vietnam" },
  { iso2: "PH", iso3: "PHL", num: "608", name: "Philippines" },
  { iso2: "ZA", iso3: "ZAF", num: "710", name: "South Africa" },
];

export interface CurrencyCode {
  code: string;
  num: string;
  decimals: number;
  name: string;
}

/** ISO 4217. `decimals` ≠ 2 is where SAP needs a TCURX entry. */
export const CURRENCIES: CurrencyCode[] = [
  { code: "IDR", num: "360", decimals: 2, name: "Indonesian rupiah" },
  { code: "USD", num: "840", decimals: 2, name: "US dollar" },
  { code: "EUR", num: "978", decimals: 2, name: "Euro" },
  { code: "GBP", num: "826", decimals: 2, name: "Pound sterling" },
  { code: "SGD", num: "702", decimals: 2, name: "Singapore dollar" },
  { code: "MYR", num: "458", decimals: 2, name: "Malaysian ringgit" },
  { code: "JPY", num: "392", decimals: 0, name: "Japanese yen — TCURX: 0 decimals" },
  { code: "KRW", num: "410", decimals: 0, name: "South Korean won — TCURX: 0 decimals" },
  { code: "VND", num: "704", decimals: 0, name: "Vietnamese dong — TCURX: 0 decimals" },
  { code: "KWD", num: "414", decimals: 3, name: "Kuwaiti dinar — TCURX: 3 decimals" },
  { code: "BHD", num: "048", decimals: 3, name: "Bahraini dinar — TCURX: 3 decimals" },
  { code: "OMR", num: "512", decimals: 3, name: "Omani rial — TCURX: 3 decimals" },
  { code: "CLF", num: "990", decimals: 4, name: "Chilean unit of account — TCURX: 4 decimals" },
  { code: "INR", num: "356", decimals: 2, name: "Indian rupee" },
  { code: "CNY", num: "156", decimals: 2, name: "Chinese yuan renminbi" },
  { code: "AUD", num: "036", decimals: 2, name: "Australian dollar" },
  { code: "CHF", num: "756", decimals: 2, name: "Swiss franc" },
  { code: "AED", num: "784", decimals: 2, name: "UAE dirham" },
  { code: "SAR", num: "682", decimals: 2, name: "Saudi riyal" },
  { code: "THB", num: "764", decimals: 2, name: "Thai baht" },
];
