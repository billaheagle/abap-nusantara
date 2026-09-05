export interface AnnotationDoc {
  name: string;
  group: string;
  purpose: string;
  example: string;
}

export const ANNOTATION_GROUPS = ["Service exposure", "List Report / table", "Object Page", "Value help & text", "Semantics", "Search & analytics"];

export const ANNOTATIONS: AnnotationDoc[] = [
  {
    name: "@OData.publish: true",
    group: "Service exposure",
    purpose: "Auto-generates and registers an OData V2 service from this CDS view (classic scenario, not RAP).",
    example: "@OData.publish: true\ndefine view entity ZC_Product as select from zproduct { ... }",
  },
  {
    name: "@AccessControl.authorizationCheck: #NOT_REQUIRED",
    group: "Service exposure",
    purpose: "Disables the DCL check for a view. Use #CHECK (default) in production.",
    example: "@AccessControl.authorizationCheck: #CHECK",
  },
  {
    name: "@UI.headerInfo",
    group: "Object Page",
    purpose: "Object type name and the title/description shown in the Object Page header.",
    example: "@UI.headerInfo: {\n  typeName: 'Product',\n  typeNamePlural: 'Products',\n  title: { value: 'ProductName' },\n  description: { value: 'ProductID' }\n}",
  },
  {
    name: "@UI.lineItem",
    group: "List Report / table",
    purpose: "Adds the field as a column in the List Report table. `position` orders columns.",
    example: "@UI.lineItem: [{ position: 10, label: 'Product' }]\nProductName;",
  },
  {
    name: "@UI.selectionField",
    group: "List Report / table",
    purpose: "Adds the field to the filter bar of the List Report.",
    example: "@UI.selectionField: [{ position: 10 }]\nCategory;",
  },
  {
    name: "@UI.identification",
    group: "Object Page",
    purpose: "Fields shown in the main 'General Information' section of the Object Page.",
    example: "@UI.identification: [{ position: 10 }]\nProductName;",
  },
  {
    name: "@UI.fieldGroup",
    group: "Object Page",
    purpose: "Groups fields into a named section/form on the Object Page.",
    example: "@UI.fieldGroup: [{ qualifier: 'Pricing', position: 10, label: 'Price' }]\nPrice;",
  },
  {
    name: "@UI.facet",
    group: "Object Page",
    purpose: "Defines the sections/tabs of the Object Page (reference to fieldGroup, identification, lineItem of a child).",
    example: "@UI.facet: [{ id: 'Pricing', type: #FIELDGROUP_REFERENCE, targetQualifier: 'Pricing', label: 'Pricing', position: 20 }]",
  },
  {
    name: "@UI.dataPoint",
    group: "List Report / table",
    purpose: "Renders a value as a KPI / rating / progress, often with criticality.",
    example: "@UI.dataPoint: { title: 'Stock', criticality: 'StockCriticality' }\nQuantity;",
  },
  {
    name: "@UI.hidden",
    group: "List Report / table",
    purpose: "Keeps a field in the service but out of the generated UI (static bool or a path to a bool field).",
    example: "@UI.hidden: true",
  },
  {
    name: "@Consumption.valueHelpDefinition",
    group: "Value help & text",
    purpose: "Attaches an F4 value help view to the field.",
    example: "@Consumption.valueHelpDefinition: [{ entity: { name: 'ZI_Category', element: 'Category' } }]\nCategory;",
  },
  {
    name: "@ObjectModel.text.element / @Semantics.text",
    group: "Value help & text",
    purpose: "Marks the descriptive text for a code/ID field so the UI shows 'ID (Text)'.",
    example: "@ObjectModel.text.element: ['CategoryName']\nCategory;\n\n@Semantics.text: true\nCategoryName;",
  },
  {
    name: "@Semantics.amount.currencyCode / @Semantics.quantity.unitOfMeasure",
    group: "Semantics",
    purpose: "Links an amount to its currency field / a quantity to its UoM field so formatting is correct.",
    example: "@Semantics.amount.currencyCode: 'CurrencyCode'\nPrice;\n\n@Semantics.currencyCode: true\nCurrencyCode;",
  },
  {
    name: "@Semantics.businessDate.from / .to / .at",
    group: "Semantics",
    purpose: "Marks validity/posting dates so date handling and time-dependency work.",
    example: "@Semantics.businessDate.at: true\nPostingDate;",
  },
  {
    name: "@Search.searchable / @Search.defaultSearchElement",
    group: "Search & analytics",
    purpose: "Enables free-text search ($search) on the entity and picks which fields it covers.",
    example: "@Search.searchable: true\ndefine view entity ... {\n  @Search.defaultSearchElement: true\n  @Search.fuzzinessThreshold: 0.8\n  ProductName;\n}",
  },
  {
    name: "@Analytics.dataCategory: #CUBE / #DIMENSION",
    group: "Search & analytics",
    purpose: "Declares a view as an analytical cube or dimension for use in analytical queries.",
    example: "@Analytics.dataCategory: #CUBE\n@Analytics.dataExtraction.enabled: true",
  },
  {
    name: "@ObjectModel.semanticKey",
    group: "Object Page",
    purpose: "The human-readable key (e.g. ProductID) shown instead of the technical UUID key.",
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
