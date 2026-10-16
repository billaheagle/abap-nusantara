export interface Snippet {
  title: string;
  category: string;
  description: string;
  code: string;
}

export const GROOVY_CATEGORIES = [
  "Dasar message",
  "Header & property",
  "Transformasi body",
  "JSON & XML",
  "Logging & MPL",
  "Penanganan error",
  "Encoding & keamanan",
];

export const GROOVY_SNIPPETS: Snippet[] = [
  {
    title: "Kerangka script standar",
    category: "Dasar message",
    description: "Signature processData yang dipakai setiap step Groovy di Integration Suite.",
    code: `import com.sap.gateway.ip.core.customdev.util.Message
import java.util.HashMap

Message processData(Message message) {
    def body = message.getBody(java.lang.String)
    // ... proses di sini ...
    message.setBody(body)
    return message
}`,
  },
  {
    title: "Membaca dan mengisi header",
    category: "Header & property",
    description: "Header ikut berjalan bersama message dan dipetakan ke header adapter atau HTTP.",
    code: `def headers = message.getHeaders()
def correlationId = headers.get("SAP_MplCorrelationId")

message.setHeader("X-Request-Id", correlationId)`,
  },
  {
    title: "Membaca dan mengisi exchange property",
    category: "Header & property",
    description: "Property tetap di dalam iFlow dan tidak dikirim ke receiver.",
    code: `def props = message.getProperties()
def retryCount = (props.get("retryCount") ?: 0) as int

message.setProperty("retryCount", retryCount + 1)`,
  },
  {
    title: "Mengambil body sebagai String, byte, atau stream",
    category: "Transformasi body",
    description: "Pilih tipe yang sesuai dengan step berikutnya; biasanya String.",
    code: `def asString = message.getBody(java.lang.String)
def asBytes  = message.getBody(byte[])
def asStream = message.getBody(java.io.Reader)`,
  },
  {
    title: "Parse JSON dan ubah satu field",
    category: "JSON & XML",
    description: "JsonSlurper untuk membaca, JsonBuilder atau JsonOutput untuk menulis.",
    code: `import groovy.json.JsonSlurper
import groovy.json.JsonOutput

def json = new JsonSlurper().parseText(message.getBody(java.lang.String))
json.status = "PROCESSED"
json.items.each { it.net = (it.gross as BigDecimal) / 1.11 }

message.setBody(JsonOutput.prettyPrint(JsonOutput.toJson(json)))`,
  },
  {
    title: "Parse XML dengan XmlSlurper",
    category: "JSON & XML",
    description: "Membaca payload XML dengan memperhatikan namespace.",
    code: `def xml = new XmlSlurper().parseText(message.getBody(java.lang.String))
def orderId = xml.Header.OrderID.text()
def lineCount = xml.Items.Item.size()

message.setProperty("orderId", orderId)
message.setProperty("lineCount", lineCount)`,
  },
  {
    title: "Menyusun XML dengan MarkupBuilder",
    category: "JSON & XML",
    description: "Membuat dokumen XML yang rapi dari data.",
    code: `import groovy.xml.MarkupBuilder

def writer = new StringWriter()
def xml = new MarkupBuilder(writer)
xml.Order(id: message.getProperty("orderId")) {
    Status("OK")
    Items {
        (1..3).each { Item(number: it) }
    }
}
message.setBody(writer.toString())`,
  },
  {
    title: "Menulis ke Message Processing Log",
    category: "Logging & MPL",
    description: "Attachment muncul di bawah entri MPL di monitoring.",
    code: `import com.sap.it.api.mapping.*

def messageLog = messageLogFactory.getMessageLog(message)
if (messageLog != null) {
    messageLog.setStringProperty("Step", "Enrich")
    messageLog.addAttachmentAsString("PayloadBeforeMapping",
        message.getBody(java.lang.String), "text/plain")
}`,
  },
  {
    title: "Mengisi custom status MPL",
    category: "Logging & MPL",
    description: "Menentukan status yang tampil di Monitor Message Processing.",
    code: `def messageLog = messageLogFactory.getMessageLog(message)
messageLog?.addCustomHeaderProperty("BusinessKey", message.getProperty("orderId") as String)
// Custom status diisi lewat header 'SAP_MessageProcessingLogCustomStatus':
message.setHeader("SAP_MessageProcessingLogCustomStatus", "SKIPPED_DUPLICATE")`,
  },
  {
    title: "Melempar exception yang jelas",
    category: "Penanganan error",
    description: "Message masuk ke exception subprocess dengan teks ini tercatat di MPL.",
    code: `def status = new JsonSlurper().parseText(message.getBody(java.lang.String)).status
if (status != "OK") {
    throw new com.sap.it.api.exceptions.IntegrationException(
        "Downstream rejected the order: \${status}")
}
return message`,
  },
  {
    title: "Membaca exception yang tertangkap di exception subprocess",
    category: "Penanganan error",
    description: "Exception-nya tersedia sebagai property di dalam exception subprocess.",
    code: `def ex = message.getProperty("CamelExceptionCaught") as Throwable
def errorText = ex?.message ?: "Unknown error"
def errorClass = ex?.class?.name

message.setProperty("errorText", errorText)
message.setHeader("SAP_MessageProcessingLogCustomStatus", "FAILED")`,
  },
  {
    title: "Base64 encode / decode",
    category: "Encoding & keamanan",
    description: "Sering dipakai untuk attachment, sertifikat, dan header Basic auth.",
    code: `def raw = message.getBody(byte[])
def b64 = raw.encodeBase64().toString()

def decoded = b64.decodeBase64()          // -> byte[]
message.setBody(new String(decoded, "UTF-8"))`,
  },
  {
    title: "Membaca nilai dari Secure Store",
    category: "Encoding & keamanan",
    description: "Artifact 'Secure Parameter' atau 'User Credentials' yang sudah di-deploy.",
    code: `import com.sap.it.api.securestore.SecureStoreService
import com.sap.it.api.ITApiFactory

def service = ITApiFactory.getService(SecureStoreService.class, null)
def cred = service.getUserCredential("MY_API_CREDENTIAL")
def user = cred.getUsername()
def pass = new String(cred.getPassword())`,
  },
];
