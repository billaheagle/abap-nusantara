/**
 * Animated message flows shown inside articles (and the home hero). Each one
 * follows the iFlow its article builds: step names, payloads and property
 * values are taken from the article, so keep them in sync when an article
 * changes.
 *
 * Coordinates are percentages of the canvas. Steps point at a node by index;
 * text may use **bold** for step names.
 */

export type FlowIcon = "send" | "modifier" | "script" | "request" | "reply" | "api" | "error" | "token" | "gateway" | "sign" | "filter" | "check";

export interface FlowNode {
  label: string;
  icon: FlowIcon;
  x: number;
  y: number;
  /** "end" draws a circle; "api" and "sub" mark something outside the main process. */
  kind?: "end" | "api" | "sub";
  labelAt?: "bottom" | "top" | "right" | "left";
}

export interface FlowStep {
  node: number;
  text: string;
  /** One value per slot, in slot order. */
  values: [string, string, string];
}

export interface FlowSpec {
  /** iFlow ID shown in the title bar. */
  name: string;
  /** Sender address, or a short note for concept flows. */
  path: string;
  /** Deployment status chip; omitted for concept flows. */
  status?: string;
  /** Canvas height in px on wide screens (phones use a bit less). */
  height?: number;
  nodes: FlowNode[];
  edges: { from: number; to: number; dashed?: boolean }[];
  slots: [{ title: string; note: string }, { title: string; note: string }, { title: string; note: string }];
  steps: FlowStep[];
  /** Heading (anchor id) in the article this flow is placed before. */
  before: string;
}

const MESSAGE_SLOTS: FlowSpec["slots"] = [
  { title: "Body", note: "ikut terkirim" },
  { title: "Header", note: "ikut terkirim" },
  { title: "Property", note: "tinggal di iFlow" },
];

const JSON_HEADER = "Content-Type:\n application/json";
const ORDER_REQUEST = '{"orderId":"TKN-ORD-1001"}';
const ORDER_REPLY = '{"orderId":"TKN-ORD-1001",\n "status":"PAID",\n "customer":"Pelanggan Demo 01",\n "totalAmount":245000, …}';
const ORDER_API = '{"code":"00","message":"OK",\n "data":{"orderId":\n "TKN-ORD-1001", …}}';
const TOKEN = "tkn-demo-access-token-0001";

export const FLOWS: Record<string, FlowSpec> = {
  // S1-3 — the envelope: what travels and what stays behind.
  "cpi-body-header-property": {
    name: "Satu amplop",
    path: "contoh order Toko Nusantara",
    before: "cara-membaca-dan-menulisnya",
    nodes: [
      { label: "Toko\nNusantara", icon: "send", x: 8, y: 40, kind: "end" },
      { label: "Content\nModifier", icon: "modifier", x: 30, y: 40 },
      { label: "Groovy\nScript", icon: "script", x: 52, y: 40 },
      { label: "Adapter", icon: "request", x: 74, y: 40 },
      { label: "Sistem\ntujuan", icon: "api", x: 92, y: 40, kind: "end" },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }],
    slots: MESSAGE_SLOTS,
    steps: [
      { node: 0, text: "**Toko Nusantara** mengirim order. Isinya menjadi body.", values: ['{"orderId":"TKN-ORD-1001",\n "items":[…]}', JSON_HEADER, "(kosong)"] },
      { node: 1, text: "**Content Modifier** menulis header di amplop dan catatan di property.", values: ['{"orderId":"TKN-ORD-1001",\n "items":[…]}', "Content-Type: application/json\nX-TKN-Order-Id:\n TKN-ORD-1001", "p_orderId = TKN-ORD-1001\np_retryCount = 0"] },
      { node: 2, text: "**Groovy Script** membaca property untuk keputusan di dalam iFlow.", values: ['{"orderId":"TKN-ORD-1001",\n "items":[…]}', "Content-Type: application/json\nX-TKN-Order-Id:\n TKN-ORD-1001", "p_orderId = TKN-ORD-1001\np_retryCount = 0"] },
      { node: 3, text: "**Adapter** mengirim body dan header. Property tidak ditempel ke amplop.", values: ['{"orderId":"TKN-ORD-1001",\n "items":[…]}', "Content-Type: application/json\nX-TKN-Order-Id:\n TKN-ORD-1001", "p_orderId = TKN-ORD-1001\np_retryCount = 0"] },
      { node: 4, text: "**Sistem tujuan** menerima body dan header saja.", values: ['{"orderId":"TKN-ORD-1001",\n "items":[…]}', "Content-Type: application/json\nX-TKN-Order-Id:\n TKN-ORD-1001", "(tidak terkirim)"] },
    ],
  },

  // S1-5 — Hello World: the success path, then the error path through the Exception Subprocess.
  "iflow-pertama-hello-world": {
    name: "IF_ERP2BTP_HelloWorld_Sync",
    path: "/erp/helloworld",
    status: "Started",
    before: "langkah",
    nodes: [
      { label: "Postman", icon: "send", x: 10, y: 36, kind: "end" },
      { label: "GS_Build\nGreeting", icon: "script", x: 50, y: 36 },
      { label: "Balas", icon: "check", x: 90, y: 36, kind: "end" },
      { label: "EXS_HandleError", icon: "error", x: 50, y: 80, kind: "sub", labelAt: "right" },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3, dashed: true }, { from: 3, to: 2, dashed: true }],
    slots: MESSAGE_SLOTS,
    steps: [
      { node: 0, text: "**Postman** mengirim nama pelanggan.", values: ['{"customer":\n "Pelanggan Demo 01"}', JSON_HEADER, "(kosong)"] },
      { node: 1, text: "**GS_BuildGreeting** membaca nama dan menyusun balasan.", values: ['{"message":"Halo Pelanggan\n Demo 01, salam dari\n Toko Nusantara!"}', JSON_HEADER, "p_customer =\n Pelanggan Demo 01"] },
      { node: 2, text: "**Balasan** sampai di Postman dengan status 200.", values: ['{"message":"Halo Pelanggan\n Demo 01, salam dari\n Toko Nusantara!"}', JSON_HEADER, "(tidak terkirim)"] },
      { node: 0, text: "Kirim lagi, kali ini body **{}** tanpa customer.", values: ["{}", JSON_HEADER, "(kosong)"] },
      { node: 1, text: "**GS_BuildGreeting** melempar error: field customer wajib diisi.", values: ["{}", JSON_HEADER, "(kosong)"] },
      { node: 3, text: "**EXS_HandleError** mengubah error menjadi JSON yang rapi.", values: ['{"error":"Request tidak valid",\n "detail":"Field \'customer\'\n wajib diisi"}', "CamelHttp\nResponseCode: 400", "(kosong)"] },
      { node: 2, text: "**Balasan 400** sampai, bukan error mentah.", values: ['{"error":"Request tidak valid",\n "detail":"Field \'customer\'\n wajib diisi"}', "CamelHttp\nResponseCode: 400", "(tidak terkirim)"] },
    ],
  },

  // S2-1 — exchange rate from Frankfurter. Also the home page hero.
  "cpi-memanggil-rest-api-pertama": {
    name: "IF_FRK2ERP_ExchangeRate_Sync",
    path: "/erp/exchangerate",
    status: "Started",
    before: "langkah",
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
  },

  // S2-3 — access token cached in a global variable.
  "access-token-global-variable": {
    name: "IF_TKN2ERP_OrderDetail_Sync",
    path: "/erp/orderdetail",
    status: "Started",
    before: "langkah",
    height: 230,
    nodes: [
      { label: "Postman", icon: "send", x: 7, y: 34, kind: "end" },
      { label: "Baca\norderId", icon: "script", x: 24, y: 34 },
      { label: "Cek\ncache", icon: "check", x: 41, y: 34 },
      { label: "Ambil\ntoken", icon: "token", x: 58, y: 34 },
      { label: "Panggil\norder", icon: "request", x: 75, y: 34 },
      { label: "Susun\njawaban", icon: "script", x: 93, y: 34 },
      { label: "/auth/token", icon: "token", x: 58, y: 80, kind: "sub", labelAt: "left" },
      { label: "/orders", icon: "api", x: 75, y: 80, kind: "api", labelAt: "right" },
    ],
    edges: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 4, to: 5 },
      { from: 3, to: 6, dashed: true }, { from: 4, to: 7, dashed: true },
    ],
    slots: MESSAGE_SLOTS,
    steps: [
      { node: 0, text: "**Postman** menanyakan detail order.", values: [ORDER_REQUEST, JSON_HEADER, "(kosong)"] },
      { node: 1, text: "**GS_ReadOrderRequest** memvalidasi format dan menyimpan orderId.", values: [ORDER_REQUEST, JSON_HEADER, "p_orderId = TKN-ORD-1001"] },
      { node: 2, text: "**GS_CheckTokenCache** melihat global variable masih kosong.", values: [ORDER_REQUEST, JSON_HEADER, "p_orderId = TKN-ORD-1001\np_tokenValid = false"] },
      { node: 6, text: "**LIP_EnsureAccessToken** meminta token baru dan menyimpannya di global variable.", values: [ORDER_REQUEST, JSON_HEADER, `p_orderId = TKN-ORD-1001\np_accessToken =\n ${TOKEN}`] },
      { node: 4, text: "**CM_SetAuthHeader** memasang token, lalu **RR_GetOrderDetail** memanggil API.", values: [ORDER_REQUEST, `Authorization: Bearer\n ${TOKEN}`, `p_orderId = TKN-ORD-1001\np_accessToken =\n ${TOKEN}`] },
      { node: 7, text: "**API order** menjawab dengan amplop {code, message, data}.", values: [ORDER_API, "CamelHttp\nResponseCode: 200", `p_orderId = TKN-ORD-1001\np_accessToken =\n ${TOKEN}`] },
      { node: 5, text: "**GS_BuildOrderResponse** menyusun jawaban ringkas untuk ERP.", values: [ORDER_REPLY, JSON_HEADER, "(tidak terkirim)"] },
      { node: 2, text: "Pesan **berikutnya**: token di cache masih berlaku, jadi dipakai langsung tanpa ke /auth/token.", values: [ORDER_REQUEST, JSON_HEADER, `p_tokenValid = true\np_accessToken =\n ${TOKEN}`] },
    ],
  },

  // S2-5 — body swapped for the string-to-sign, signed, then restored.
  "signature-simple-signer-cpi": {
    name: "IF_TKN2ERP_OrderDetail_Sync",
    path: "/erp/orderdetail",
    status: "Started",
    before: "langkah",
    nodes: [
      { label: "Pasang\ntoken", icon: "modifier", x: 8, y: 40 },
      { label: "String-\nto-sign", icon: "script", x: 29, y: 40 },
      { label: "Simple\nSigner", icon: "sign", x: 50, y: 40 },
      { label: "Pulihkan\nbody", icon: "modifier", x: 71, y: 40 },
      { label: "API", icon: "api", x: 92, y: 40, kind: "api" },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }],
    slots: MESSAGE_SLOTS,
    steps: [
      { node: 0, text: "**CM_SetAuthHeader** sudah memasang token. Body request GET ini kosong.", values: ["(kosong)", `Authorization: Bearer\n ${TOKEN}`, "p_orderId = TKN-ORD-1001"] },
      { node: 1, text: "**GS_BuildStringToSign** menyimpan body asli, menambah timestamp, lalu menjadikan string-to-sign sebagai body.", values: [`GET:/orders/TKN-ORD-1001:\n${TOKEN}:\ne3b0c442…7852b855:\n2026-10-02T09:15:00+07:00`, "X-TKN-Timestamp:\n 2026-10-02T09:15:00+07:00", "p_requestBody = (kosong)"] },
      { node: 2, text: "**SGN_SignRequest** menandatangani body dengan key pair tkn-api-signing.", values: [`GET:/orders/TKN-ORD-1001:\n${TOKEN}:\ne3b0c442…7852b855:\n2026-10-02T09:15:00+07:00`, "h_tknSignature:\n <signature Base64>", "p_requestBody = (kosong)"] },
      { node: 3, text: "**CM_RestoreRequestBody** mengembalikan body asli dan menyalin signature ke X-TKN-Signature.", values: ["(kosong)", "X-TKN-Timestamp: …\nX-TKN-Signature:\n <signature Base64>", "p_requestBody = (kosong)"] },
      { node: 4, text: "**RR_GetOrderDetail** mengirim request. API memverifikasi signature dengan certificate kita.", values: ["(kosong)", "X-TKN-Timestamp: …\nX-TKN-Signature:\n <signature Base64>", "(tidak terkirim)"] },
    ],
  },

  // S2-6 — the gateway subflow behind ProcessDirect.
  "pola-gateway-subflow-processdirect": {
    name: "IF_TKN2ERP_OrderDetail_Sync",
    path: "/erp/orderdetail",
    status: "Started",
    before: "langkah",
    height: 230,
    nodes: [
      { label: "Postman", icon: "send", x: 7, y: 34, kind: "end" },
      { label: "Baca\norderId", icon: "script", x: 27, y: 34 },
      { label: "Isi\nkontrak h_*", icon: "modifier", x: 49, y: 34 },
      { label: "Panggil\ngateway", icon: "request", x: 71, y: 34 },
      { label: "Susun\njawaban", icon: "script", x: 93, y: 34 },
      { label: "Gateway", icon: "gateway", x: 60, y: 80, kind: "sub", labelAt: "left" },
      { label: "API", icon: "api", x: 84, y: 80, kind: "api", labelAt: "right" },
    ],
    edges: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
      { from: 3, to: 5, dashed: true }, { from: 5, to: 6, dashed: true },
    ],
    slots: MESSAGE_SLOTS,
    steps: [
      { node: 0, text: "**Postman** menanyakan detail order.", values: [ORDER_REQUEST, JSON_HEADER, "(kosong)"] },
      { node: 1, text: "**GS_ReadOrderRequest** menyimpan orderId di property.", values: [ORDER_REQUEST, JSON_HEADER, "p_orderId = TKN-ORD-1001"] },
      { node: 2, text: "**CM_SetGatewayRequest** menulis kontrak gateway di header h_*.", values: ["(kosong)", "h_method = GET\nh_path =\n /orders/TKN-ORD-1001", "p_orderId = TKN-ORD-1001"] },
      { node: 5, text: "Lewat **ProcessDirect**, gateway hanya menerima body dan header. Property pemanggil tidak ikut.", values: ["(kosong)", "h_method = GET\nh_path =\n /orders/TKN-ORD-1001", "(property pemanggil\n tidak terbawa)"] },
      { node: 6, text: "**SF_TKN_ApiGateway** mengurus token dan signature, lalu memanggil API.", values: ["(kosong)", "Authorization: Bearer …\nX-TKN-Timestamp: …\nX-TKN-Signature: …", "p_httpPath =\n /orders/TKN-ORD-1001"] },
      { node: 3, text: "Gateway membalas dengan **h_httpStatus** dan body jawaban API apa adanya.", values: [ORDER_API, "h_httpStatus = 200", "p_orderId = TKN-ORD-1001"] },
      { node: 4, text: "**GS_BuildOrderResponse** menyusun jawaban untuk ERP.", values: [ORDER_REPLY, JSON_HEADER, "(tidak terkirim)"] },
    ],
  },

  // S2-7 — headers in the message vs. headers the HTTP receiver actually sends.
  "http-receiver-request-headers": {
    name: "SF_TKN_ApiGateway",
    path: "RCV_HTTP_TKN_ApiCall",
    status: "Started",
    before: "langkah",
    nodes: [
      { label: "Header\ndi pesan", icon: "modifier", x: 12, y: 40 },
      { label: "HTTP\nreceiver", icon: "filter", x: 50, y: 40 },
      { label: "Mock Toko\nNusantara", icon: "api", x: 88, y: 40, kind: "api" },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }],
    slots: [
      { title: "Header di pesan", note: "di CPI" },
      { title: "Request Headers", note: "field channel" },
      { title: "Diterima mock", note: "call log" },
    ],
    steps: [
      { node: 0, text: "Step sebelumnya sudah menempel tiga header di amplop CPI.", values: ["Authorization\nX-TKN-Timestamp\nX-TKN-Signature", "traceparent", "—"] },
      { node: 1, text: "**Request Headers** bawaan channel hanya berisi traceparent.", values: ["Authorization\nX-TKN-Timestamp\nX-TKN-Signature", "traceparent", "—"] },
      { node: 2, text: "Mock **tidak menerima** satu pun header buatan kita.", values: ["Authorization\nX-TKN-Timestamp\nX-TKN-Signature", "traceparent", "traceparent\nuser-agent, accept, …"] },
      { node: 1, text: "Daftarnya diisi dengan header yang memang dibutuhkan API.", values: ["Authorization\nX-TKN-Timestamp\nX-TKN-Signature", "traceparent|Authorization|\nContent-Type|\nX-TKN-Timestamp|\nX-TKN-Signature", "—"] },
      { node: 2, text: "Sekarang ketiganya **sampai** di mock.", values: ["Authorization\nX-TKN-Timestamp\nX-TKN-Signature", "traceparent|Authorization|\nContent-Type|\nX-TKN-Timestamp|\nX-TKN-Signature", "authorization\nx-tkn-timestamp\nx-tkn-signature"] },
    ],
  },

  // S2-8 — HTTP status vs. business code: three answers, three replies.
  "http-status-vs-kode-bisnis": {
    name: "IF_TKN2ERP_OrderDetail_Sync",
    path: "/erp/orderdetail",
    status: "Started",
    before: "langkah",
    nodes: [
      { label: "Panggil\ngateway", icon: "request", x: 14, y: 36 },
      { label: "Klasifikasi", icon: "script", x: 52, y: 36 },
      { label: "Balas ERP", icon: "check", x: 90, y: 36, kind: "end" },
      { label: "API", icon: "api", x: 14, y: 80, kind: "api", labelAt: "right" },
    ],
    edges: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 0, to: 3, dashed: true }],
    slots: [
      { title: "Jawaban API", note: "body" },
      { title: "h_httpStatus", note: "dari gateway" },
      { title: "Balasan ke ERP", note: "status + body" },
    ],
    steps: [
      { node: 3, text: "Kasus 1: **order ditemukan**.", values: ['{"code":"00","message":"OK",\n "data":{…}}', "200", "—"] },
      { node: 1, text: "**GS_BuildOrderResponse** melihat status 2xx dan code 00: sukses.", values: ['{"code":"00","message":"OK",\n "data":{…}}', "200", "—"] },
      { node: 2, text: "ERP menerima **200** dengan detail order.", values: ['{"code":"00","message":"OK",\n "data":{…}}', "200", '200\n{"orderId":"TKN-ORD-1001",\n …}'] },
      { node: 3, text: "Kasus 2: **order tidak ada**.", values: ['{"code":"ORD-404",\n "message":"Order TKN-ORD-9999\n tidak ditemukan"}', "404", "—"] },
      { node: 2, text: "404 dengan code ORD-404 adalah jawaban bisnis, jadi ERP menerima **404**.", values: ['{"code":"ORD-404",\n "message":"Order TKN-ORD-9999\n tidak ditemukan"}', "404", '404\n{"error":"ORDER_NOT_FOUND",\n …}'] },
      { node: 3, text: "Kasus 3: **path salah**. Sama-sama 404, tapi bukan amplop Toko Nusantara.", values: ['{"error":{"name":"…",\n "message":"…"}}', "404", "—"] },
      { node: 2, text: "Tanpa kode bisnis, ini masalah teknis: ERP menerima **502**.", values: ['{"error":{"name":"…",\n "message":"…"}}', "404", '502\n{"error":"UPSTREAM_ERROR",\n …}'] },
    ],
  },
};
