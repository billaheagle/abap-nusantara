export interface AnnotationDoc {
  name: string;
  group: string;
  purpose: string;
  example: string;
}

export const ANNOTATION_GROUPS = ["Ekspos service", "List Report / tabel", "Object Page", "Value help & teks", "Semantik", "Search & analitik"];

export const ANNOTATIONS: AnnotationDoc[] = [
  {
    name: "@OData.publish: true",
    group: "Ekspos service",
    purpose: "Membuat dan mendaftarkan service OData V2 otomatis dari CDS view ini (skenario klasik, bukan RAP).",
    example: "@OData.publish: true\ndefine view entity ZC_Product as select from zproduct { ... }",
  },
  {
    name: "@AccessControl.authorizationCheck: #NOT_REQUIRED",
    group: "Ekspos service",
    purpose: "Mematikan pengecekan DCL untuk view. Di production pakai #CHECK (default).",
    example: "@AccessControl.authorizationCheck: #CHECK",
  },
  {
    name: "@UI.headerInfo",
    group: "Object Page",
    purpose: "Nama tipe objek serta judul dan deskripsi yang tampil di header Object Page.",
    example: "@UI.headerInfo: {\n  typeName: 'Product',\n  typeNamePlural: 'Products',\n  title: { value: 'ProductName' },\n  description: { value: 'ProductID' }\n}",
  },
  {
    name: "@UI.lineItem",
    group: "List Report / tabel",
    purpose: "Menambahkan field sebagai kolom di tabel List Report. `position` mengatur urutan kolom.",
    example: "@UI.lineItem: [{ position: 10, label: 'Product' }]\nProductName;",
  },
  {
    name: "@UI.selectionField",
    group: "List Report / tabel",
    purpose: "Menambahkan field ke filter bar List Report.",
    example: "@UI.selectionField: [{ position: 10 }]\nCategory;",
  },
  {
    name: "@UI.identification",
    group: "Object Page",
    purpose: "Field yang tampil di bagian utama 'General Information' pada Object Page.",
    example: "@UI.identification: [{ position: 10 }]\nProductName;",
  },
  {
    name: "@UI.fieldGroup",
    group: "Object Page",
    purpose: "Mengelompokkan field ke dalam section atau form bernama di Object Page.",
    example: "@UI.fieldGroup: [{ qualifier: 'Pricing', position: 10, label: 'Price' }]\nPrice;",
  },
  {
    name: "@UI.facet",
    group: "Object Page",
    purpose: "Mendefinisikan section atau tab di Object Page (merujuk ke fieldGroup, identification, atau lineItem milik child).",
    example: "@UI.facet: [{ id: 'Pricing', type: #FIELDGROUP_REFERENCE, targetQualifier: 'Pricing', label: 'Pricing', position: 20 }]",
  },
  {
    name: "@UI.dataPoint",
    group: "List Report / tabel",
    purpose: "Menampilkan nilai sebagai KPI, rating, atau progress, sering bersama criticality.",
    example: "@UI.dataPoint: { title: 'Stock', criticality: 'StockCriticality' }\nQuantity;",
  },
  {
    name: "@UI.hidden",
    group: "List Report / tabel",
    purpose: "Field tetap ada di service tapi tidak tampil di UI (nilai bool statis atau path ke field bool).",
    example: "@UI.hidden: true",
  },
  {
    name: "@Consumption.valueHelpDefinition",
    group: "Value help & teks",
    purpose: "Memasang view value help F4 ke field.",
    example: "@Consumption.valueHelpDefinition: [{ entity: { name: 'ZI_Category', element: 'Category' } }]\nCategory;",
  },
  {
    name: "@ObjectModel.text.element / @Semantics.text",
    group: "Value help & teks",
    purpose: "Menandai teks deskripsi untuk field kode atau ID, sehingga UI menampilkan 'ID (Teks)'.",
    example: "@ObjectModel.text.element: ['CategoryName']\nCategory;\n\n@Semantics.text: true\nCategoryName;",
  },
  {
    name: "@Semantics.amount.currencyCode / @Semantics.quantity.unitOfMeasure",
    group: "Semantik",
    purpose: "Menghubungkan amount ke field mata uangnya, atau quantity ke field satuannya, supaya formatnya benar.",
    example: "@Semantics.amount.currencyCode: 'CurrencyCode'\nPrice;\n\n@Semantics.currencyCode: true\nCurrencyCode;",
  },
  {
    name: "@Semantics.businessDate.from / .to / .at",
    group: "Semantik",
    purpose: "Menandai tanggal berlaku atau tanggal posting supaya penanganan tanggal dan time-dependency berjalan.",
    example: "@Semantics.businessDate.at: true\nPostingDate;",
  },
  {
    name: "@Search.searchable / @Search.defaultSearchElement",
    group: "Search & analitik",
    purpose: "Mengaktifkan pencarian teks bebas ($search) di entity dan memilih field mana yang ikut dicari.",
    example: "@Search.searchable: true\ndefine view entity ... {\n  @Search.defaultSearchElement: true\n  @Search.fuzzinessThreshold: 0.8\n  ProductName;\n}",
  },
  {
    name: "@Analytics.dataCategory: #CUBE / #DIMENSION",
    group: "Search & analitik",
    purpose: "Menyatakan view sebagai cube atau dimension analitik untuk dipakai di query analitik.",
    example: "@Analytics.dataCategory: #CUBE\n@Analytics.dataExtraction.enabled: true",
  },
  {
    name: "@ObjectModel.semanticKey",
    group: "Object Page",
    purpose: "Key yang mudah dibaca manusia (misalnya ProductID), ditampilkan sebagai pengganti key UUID teknis.",
    example: "@ObjectModel.semanticKey: ['ProductID']",
  },
];

// ---- List Report @UI generator -----------------------------------------

export interface UiField {
  name: string;
  label: string;
  lineItem: boolean;
  selectionField: boolean;
  identification: boolean;
}

export function generateUiAnnotations(entityName: string, fields: UiField[]): string {
  const li = fields.filter((f) => f.lineItem);
  const sf = fields.filter((f) => f.selectionField);
  const id = fields.filter((f) => f.identification);

  const lines: string[] = [];
  lines.push(`@UI: {`);
  lines.push(`  headerInfo: {`);
  lines.push(`    typeName: '${entityName || "Item"}',`);
  lines.push(`    typeNamePlural: '${entityName || "Item"}s',`);
  lines.push(`    title: { value: '${id[0]?.name ?? fields[0]?.name ?? "Field"}' }`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push(`define view entity ZC_${entityName || "Entity"} as select from ${entityName || "source"}`);
  lines.push(`{`);
  fields.forEach((f, i) => {
    const anns: string[] = [];
    if (f.lineItem) anns.push(`@UI.lineItem: [{ position: ${(li.indexOf(f) + 1) * 10}, label: '${f.label || f.name}' }]`);
    if (f.selectionField) anns.push(`@UI.selectionField: [{ position: ${(sf.indexOf(f) + 1) * 10} }]`);
    if (f.identification) anns.push(`@UI.identification: [{ position: ${(id.indexOf(f) + 1) * 10}, label: '${f.label || f.name}' }]`);
    anns.forEach((a) => lines.push(`  ${a}`));
    lines.push(`  ${f.name}${i === fields.length - 1 ? "" : ","}`);
  });
  lines.push(`}`);
  return lines.join("\n");
}
