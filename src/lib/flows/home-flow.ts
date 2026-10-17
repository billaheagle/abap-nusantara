import type { FlowSpec } from "./types";

/**
 * Fallback for the home page hero: the exchange-rate iFlow from "Memanggil
 * REST API Pertama: Kurs Mata Uang". Once that article is published the hero
 * plays the ```flow block from the article itself, so this copy only shows
 * while the article is still a draft (or if its block goes missing). Same
 * JSON as the article's block.
 */
export const HOME_FLOW: FlowSpec = {
  name: "IF_FRK2ERP_ExchangeRate_Sync",
  path: "/erp/exchangerate",
  status: "Started",
  sender: {
    label: "Postman",
    icon: "send",
  },
  steps: [
    {
      id: "read",
      label: "Baca\nrequest",
      icon: "script",
    },
    {
      id: "call",
      label: "Request\nReply",
      icon: "request",
      calls: "frk",
    },
    {
      id: "build",
      label: "Susun\njawaban",
      icon: "script",
    },
  ],
  receivers: [
    {
      id: "frk",
      label: "Frankfurter",
      icon: "api",
      kind: "api",
    },
  ],
  exception: {
    name: "EXS_HandleError",
    steps: [
      {
        id: "err",
        label: "Susun\nerror 400",
        icon: "modifier",
      },
    ],
  },
  slots: [
    {
      title: "Body",
      note: "ikut terkirim",
    },
    {
      title: "Header",
      note: "ikut terkirim",
    },
    {
      title: "Property",
      note: "tinggal di iFlow",
    },
  ],
  scenarios: [
    {
      label: "Kurs ditemukan",
      outcome: "ok",
      frames: [
        {
          at: "sender",
          text: "**Postman** meminta kurs USD ke IDR untuk 30 September 2026.",
          values: [
            '{"base":"USD",\n "quote":"IDR",\n "date":"2026-09-30"}',
            "Content-Type:\n application/json",
            "(kosong)",
          ],
        },
        {
          at: "read",
          text: "**GS_ReadRateRequest** memvalidasi request dan menyimpan nilainya di property.",
          values: [
            '{"base":"USD",\n "quote":"IDR",\n "date":"2026-09-30"}',
            "Content-Type:\n application/json",
            "p_base = USD\np_quote = IDR\np_rateDate = 2026-09-30\np_query = date=2026-09-30",
          ],
        },
        {
          at: "call",
          text: "**RR_GetExchangeRate** menyusun address dan query dari property, lalu memanggil Frankfurter.",
          values: [
            '{"base":"USD",\n "quote":"IDR",\n "date":"2026-09-30"}',
            "Content-Type:\n application/json",
            "p_base = USD\np_quote = IDR\np_rateDate = 2026-09-30\np_query = date=2026-09-30",
          ],
        },
        {
          at: "frk",
          text: "**Frankfurter** menjawab 200. Body lama tertimpa jawaban API.",
          values: [
            '{"date":"2026-09-30",\n "base":"USD",\n "quote":"IDR",\n "rate":17922}',
            "CamelHttp\nResponseCode: 200",
            "p_base = USD\np_quote = IDR\np_rateDate = 2026-09-30\np_query = date=2026-09-30",
          ],
          response: {
            status: "200 OK",
            body: '{\n  "date": "2026-09-30",\n  "base": "USD",\n  "quote": "IDR",\n  "rate": 17922\n}',
          },
        },
        {
          at: "build",
          text: "**GS_BuildRateResponse** menyusun jawaban versi Toko Nusantara. Nilai pair diambil dari property.",
          values: [
            '{"pair":"USD/IDR",\n "rate":17922,\n "rateDate":"2026-09-30",\n "source":"Frankfurter"}',
            "Content-Type:\n application/json",
            "p_base = USD\np_quote = IDR\np_rateDate = 2026-09-30\np_query = date=2026-09-30",
          ],
        },
        {
          at: "reply",
          text: "**Postman** menerima **200**. Property tidak ikut keluar.",
          values: [
            '{"pair":"USD/IDR",\n "rate":17922,\n "rateDate":"2026-09-30",\n "source":"Frankfurter"}',
            "HTTP 200\nContent-Type:\n application/json",
            "(tidak terkirim)",
          ],
          response: {
            status: "200 OK",
            body: '{\n  "pair": "USD/IDR",\n  "rate": 17922,\n  "rateDate": "2026-09-30",\n  "source": "Frankfurter"\n}',
          },
        },
      ],
    },
    {
      label: "Mata uang XYZ",
      outcome: "error",
      frames: [
        {
          at: "sender",
          text: "**Postman** meminta kurs USD ke **XYZ**, mata uang yang tidak ada.",
          values: [
            '{"base":"USD",\n "quote":"XYZ"}',
            "Content-Type:\n application/json",
            "(kosong)",
          ],
        },
        {
          at: "read",
          text: "Formatnya benar (tiga huruf), jadi **GS_ReadRateRequest** meloloskannya.",
          values: [
            '{"base":"USD",\n "quote":"XYZ"}',
            "Content-Type:\n application/json",
            "p_base = USD\np_quote = XYZ\np_rateDate = (kosong)\np_query = (kosong)",
          ],
        },
        {
          at: "call",
          text: "**RR_GetExchangeRate** memanggil …/v2/rate/USD/XYZ.",
          values: [
            '{"base":"USD",\n "quote":"XYZ"}',
            "Content-Type:\n application/json",
            "p_base = USD\np_quote = XYZ\np_rateDate = (kosong)\np_query = (kosong)",
          ],
        },
        {
          at: "frk",
          text: "**Frankfurter** membalas **422**. Throw Exception on Failure masih dicentang, jadi HTTP receiver melempar exception.",
          values: [
            '{"status":422,\n "message":\n "invalid currency: XYZ"}',
            "CamelHttp\nResponseCode: 422",
            "p_base = USD\np_quote = XYZ\np_rateDate = (kosong)\np_query = (kosong)",
          ],
          response: {
            status: "422 Unprocessable",
            body: '{\n  "status": 422,\n  "message": "invalid currency: XYZ"\n}',
          },
        },
        {
          at: "err",
          text: "**EXS_HandleError** menangkapnya dan menyusun JSON error dengan status 400.",
          values: [
            '{"error":"Request tidak valid",\n "detail":"HTTP operation failed invoking https://api.frankfurter.dev/v2/rate/USD/XYZ with statusCode: 422"}',
            "CamelHttp\nResponseCode: 400\nContent-Type:\n application/json",
            "p_base = USD\np_quote = XYZ\np_rateDate = (kosong)\np_query = (kosong)",
          ],
        },
        {
          at: "reply",
          text: "**Postman** menerima **400**. Detail-nya pesan adapter, lengkap dengan URL yang dipanggil.",
          values: [
            '{"error":"Request tidak valid",\n "detail":"HTTP operation failed invoking https://api.frankfurter.dev/v2/rate/USD/XYZ with statusCode: 422"}',
            "HTTP 400\nContent-Type:\n application/json",
            "(tidak terkirim)",
          ],
          response: {
            status: "400 Bad Request",
            body: '{\n  "error": "Request tidak valid",\n  "detail": "HTTP operation failed invoking https://api.frankfurter.dev/v2/rate/USD/XYZ with statusCode: 422"\n}',
          },
        },
      ],
    },
    {
      label: "Body {}",
      outcome: "error",
      frames: [
        {
          at: "sender",
          text: "**Postman** mengirim body **{}**.",
          values: ["{}", "Content-Type:\n application/json", "(kosong)"],
        },
        {
          at: "read",
          text: "**GS_ReadRateRequest** menolak: base dan quote wajib kode mata uang 3 huruf. Frankfurter tidak dipanggil.",
          values: ["{}", "Content-Type:\n application/json", "(kosong)"],
        },
        {
          at: "err",
          text: "**EXS_HandleError** menyusun JSON error dengan status 400.",
          values: [
            '{"error":"Request tidak valid",\n "detail":"java.lang.Exception: …IllegalArgumentException: Field \'base\' dan \'quote\' wajib … @ line 16 in ReadRateRequest.groovy"}',
            "CamelHttp\nResponseCode: 400\nContent-Type:\n application/json",
            "(kosong)",
          ],
        },
        {
          at: "reply",
          text: "**Postman** menerima **400**, detail-nya menyebut base dan quote.",
          values: [
            '{"error":"Request tidak valid",\n "detail":"java.lang.Exception: …IllegalArgumentException: Field \'base\' dan \'quote\' wajib … @ line 16 in ReadRateRequest.groovy"}',
            "HTTP 400\nContent-Type:\n application/json",
            "(tidak terkirim)",
          ],
          response: {
            status: "400 Bad Request",
            body: '{\n  "error": "Request tidak valid",\n  "detail": "java.lang.Exception: …IllegalArgumentException: Field \'base\' dan \'quote\' wajib … @ line 16 in ReadRateRequest.groovy"\n}',
          },
        },
      ],
    },
  ],
};
