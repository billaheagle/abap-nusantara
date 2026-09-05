/** EDMX ($metadata) parser — DOM-based, works for OData V2 and V4. Client-only. */

interface EdmProperty {
  name: string;
  type: string;
  nullable: boolean;
  maxLength?: string;
  precision?: string;
  scale?: string;
  isKey: boolean;
}

interface EdmNavigation {
  name: string;
  type: string;
}

export interface EdmStructured {
  name: string;
  properties: EdmProperty[];
  navigations: EdmNavigation[];
}

interface EdmOperation {
  name: string;
  kind: "FunctionImport" | "Function" | "Action";
  returnType?: string;
  parameters: { name: string; type: string }[];
}

export interface EdmModel {
  version: string;
  namespaces: string[];
  entityTypes: EdmStructured[];
  complexTypes: EdmStructured[];
  entitySets: { name: string; type: string }[];
  operations: EdmOperation[];
}

function attr(el: Element, name: string): string | undefined {
  return el.getAttribute(name) ?? undefined;
}

function tag(root: Document | Element, name: string): Element[] {
  return Array.from(root.getElementsByTagNameNS("*", name));
}

function readStructured(el: Element): EdmStructured {
  const keyRefs = tag(el, "PropertyRef").map((r) => r.getAttribute("Name"));
  const properties: EdmProperty[] = tag(el, "Property")
    .filter((p) => p.parentElement === el)
    .map((p) => ({
      name: attr(p, "Name") ?? "",
      type: attr(p, "Type") ?? "",
      nullable: attr(p, "Nullable") !== "false",
      maxLength: attr(p, "MaxLength"),
      precision: attr(p, "Precision"),
      scale: attr(p, "Scale"),
      isKey: keyRefs.includes(attr(p, "Name") ?? null),
    }));
  const navigations: EdmNavigation[] = tag(el, "NavigationProperty")
    .filter((n) => n.parentElement === el)
    .map((n) => ({
      name: attr(n, "Name") ?? "",
      type: attr(n, "Type") ?? attr(n, "Relationship") ?? "",
    }));
  return { name: attr(el, "Name") ?? "", properties, navigations };
}

export function parseEdmx(xml: string): EdmModel {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const err = doc.querySelector("parsererror");
  if (err) throw new Error(err.textContent?.replace(/\s+/g, " ").trim() || "Invalid XML");

  const edmx = tag(doc, "Edmx")[0];
  const version = edmx?.getAttribute("Version") ?? doc.documentElement.getAttribute("Version") ?? "unknown";

  const schemas = tag(doc, "Schema");
  const namespaces = schemas.map((s) => attr(s, "Namespace") ?? "").filter(Boolean);

  const entityTypes = tag(doc, "EntityType").map(readStructured);
  const complexTypes = tag(doc, "ComplexType").map(readStructured);

  const entitySets = tag(doc, "EntitySet").map((s) => ({
    name: attr(s, "Name") ?? "",
    type: attr(s, "EntityType") ?? "",
  }));

  const operations: EdmOperation[] = [
    ...tag(doc, "FunctionImport").map((f) => ({
      name: attr(f, "Name") ?? "",
      kind: "FunctionImport" as const,
      returnType: attr(f, "ReturnType"),
      parameters: tag(f, "Parameter").map((p) => ({ name: attr(p, "Name") ?? "", type: attr(p, "Type") ?? "" })),
    })),
    ...tag(doc, "Function").map((f) => ({
      name: attr(f, "Name") ?? "",
      kind: "Function" as const,
      returnType: tag(f, "ReturnType")[0]?.getAttribute("Type") ?? undefined,
      parameters: tag(f, "Parameter").map((p) => ({ name: attr(p, "Name") ?? "", type: attr(p, "Type") ?? "" })),
    })),
    ...tag(doc, "Action").map((a) => ({
      name: attr(a, "Name") ?? "",
      kind: "Action" as const,
      returnType: tag(a, "ReturnType")[0]?.getAttribute("Type") ?? undefined,
      parameters: tag(a, "Parameter").map((p) => ({ name: attr(p, "Name") ?? "", type: attr(p, "Type") ?? "" })),
    })),
  ];

  if (entityTypes.length === 0 && complexTypes.length === 0 && entitySets.length === 0) {
    throw new Error("No EDM types found. Is this a $metadata document?");
  }

  return { version, namespaces, entityTypes, complexTypes, entitySets, operations };
}
