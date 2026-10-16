import type { FlowSpec } from "./schema";

/**
 * The home page hero: the exchange-rate iFlow from "Memanggil REST API
 * Pertama: Kurs Mata Uang". Articles carry their own flows in a ```flow block
 * (see ./schema.ts); this copy stays in code so the hero works even before
 * that article is published. Keep it in step with the article's block.
 */

const MESSAGE_SLOTS: FlowSpec["slots"] = [
  { title: "Body", note: "ikut terkirim" },
  { title: "Header", note: "ikut terkirim" },
  { title: "Property", note: "tinggal di iFlow" },
];

const JSON_HEADER = "Content-Type:\n application/json";

export const HOME_FLOW: FlowSpec = {
  name: "IF_FRK2ERP_ExchangeRate_Sync",
  path: "/erp/exchangerate",
  status: "Started",
  nodes: [
    { label: "Postman", icon: "send", x: 7, y: 36, kind: "end" },
    { label: "Baca\nrequest", icon: "script", x: 29, y: 36 },
    { label: "Request Reply", icon: "request", x: 51, y: 36, labelAt: "top" },
    { label: "Susun\njawaban", icon: "script", x: 73, y: 36 },
    { label: "Balas", icon: "check", x: 93, y: 36, kind: "end" },
    { label: "Frankfurter", icon: "api", x: 51, y: 80, kind: "api", labelAt: "right" },
  ],
  edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 2, to: 5, dashed: true }],
  slots: MESSAGE_SLOTS,
  steps: [
    { node: 0, text: "**Postman** meminta kurs USD ke IDR untuk satu tanggal.", values: ['{"base":"USD",\n "quote":"IDR",\n "date":"2026-09-30"}', JSON_HEADER, "(kosong)"] },
    { node: 1, text: "**GS_ReadRateRequest** memvalidasi request dan menyimpannya di property.", values: ['{"base":"USD",\n "quote":"IDR",\n "date":"2026-09-30"}', JSON_HEADER, "p_base = USD\np_quote = IDR\np_query = date=2026-09-30"] },
    { node: 2, text: "**RR_GetExchangeRate** menyusun address dan query dari property.", values: ['{"base":"USD",\n "quote":"IDR",\n "date":"2026-09-30"}', JSON_HEADER, "p_base = USD\np_quote = IDR\np_query = date=2026-09-30"] },
    { node: 5, text: "**Frankfurter** menjawab. Body lama tertimpa jawaban API.", values: ['{"date":"2026-09-30",\n "base":"USD",\n "quote":"IDR",\n "rate":17922}', "CamelHttp\nResponseCode: 200", "p_base = USD\np_quote = IDR\np_query = date=2026-09-30"] },
    { node: 3, text: "**GS_BuildRateResponse** menyusun jawaban versi Toko Nusantara dari property.", values: ['{"pair":"USD/IDR",\n "rate":17922,\n "rateDate":"2026-09-30",\n "source":"Frankfurter"}', JSON_HEADER, "p_base = USD\np_quote = IDR\np_query = date=2026-09-30"] },
    { node: 4, text: "**Balasan** sampai. Property tidak ikut keluar.", values: ['{"pair":"USD/IDR",\n "rate":17922,\n "rateDate":"2026-09-30",\n "source":"Frankfurter"}', JSON_HEADER, "(tidak terkirim)"] },
  ],
};
