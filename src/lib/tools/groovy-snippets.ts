export interface Snippet {
  title: string;
  category: string;
  description: string;
  code: string;
}

export const GROOVY_CATEGORIES = [
  "Message basics",
  "Headers & properties",
  "Body transformation",
  "JSON & XML",
  "Logging & MPL",
  "Error handling",
  "Encoding & security",
];

export const GROOVY_SNIPPETS: Snippet[] = [
  {
    title: "Standard script skeleton",
    category: "Message basics",
    description: "The processData signature every Groovy step uses in Integration Suite.",
    code: `import com.sap.gateway.ip.core.customdev.util.Message
import java.util.HashMap

Message processData(Message message) {
    def body = message.getBody(java.lang.String)
    // ... work here ...
    message.setBody(body)
    return message
}`,
  },
  {
    title: "Read & set a header",
    category: "Headers & properties",
    description: "Headers travel with the message and map to adapter/HTTP headers.",
    code: `def headers = message.getHeaders()
def correlationId = headers.get("SAP_MplCorrelationId")

message.setHeader("X-Request-Id", correlationId)`,
  },
  {
    title: "Read & set an exchange property",
    category: "Headers & properties",
    description: "Properties stay inside the iFlow and are not sent to receivers.",
    code: `def props = message.getProperties()
def retryCount = (props.get("retryCount") ?: 0) as int

message.setProperty("retryCount", retryCount + 1)`,
  },
  {
    title: "Get the body as String / bytes / stream",
    category: "Body transformation",
    description: "Pick the type that matches the next step; String is the usual choice.",
    code: `def asString = message.getBody(java.lang.String)
def asBytes  = message.getBody(byte[])
def asStream = message.getBody(java.io.Reader)`,
  },
  {
    title: "Parse JSON and edit a field",
    category: "JSON & XML",
    description: "JsonSlurper for reading, JsonBuilder / JsonOutput for writing.",
    code: `import groovy.json.JsonSlurper
import groovy.json.JsonOutput

def json = new JsonSlurper().parseText(message.getBody(java.lang.String))
json.status = "PROCESSED"
json.items.each { it.net = (it.gross as BigDecimal) / 1.11 }

message.setBody(JsonOutput.prettyPrint(JsonOutput.toJson(json)))`,
  },
  {
    title: "Parse XML with XmlSlurper",
    category: "JSON & XML",
    description: "Namespace-aware reading of an XML payload.",
    code: `def xml = new XmlSlurper().parseText(message.getBody(java.lang.String))
def orderId = xml.Header.OrderID.text()
def lineCount = xml.Items.Item.size()

message.setProperty("orderId", orderId)
message.setProperty("lineCount", lineCount)`,
  },
  {
    title: "Build XML with MarkupBuilder",
    category: "JSON & XML",
    description: "Generate a clean XML document from data.",
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
    title: "Write to the Message Processing Log",
    category: "Logging & MPL",
    description: "Attachments show up under the MPL entry in monitoring.",
    code: `import com.sap.it.api.mapping.*

def messageLog = messageLogFactory.getMessageLog(message)
if (messageLog != null) {
    messageLog.setStringProperty("Step", "Enrich")
    messageLog.addAttachmentAsString("PayloadBeforeMapping",
        message.getBody(java.lang.String), "text/plain")
}`,
  },
  {
    title: "Set the MPL custom status",
    category: "Logging & MPL",
    description: "Drives the status shown in Monitor Message Processing.",
    code: `def messageLog = messageLogFactory.getMessageLog(message)
messageLog?.addCustomHeaderProperty("BusinessKey", message.getProperty("orderId") as String)
// Custom status is set via the 'SAP_MessageProcessingLogCustomStatus' header:
message.setHeader("SAP_MessageProcessingLogCustomStatus", "SKIPPED_DUPLICATE")`,
  },
  {
    title: "Throw a descriptive exception",
    category: "Error handling",
    description: "Message ends up in the exception subprocess with this text in the MPL.",
    code: `def status = new JsonSlurper().parseText(message.getBody(java.lang.String)).status
if (status != "OK") {
    throw new com.sap.it.api.exceptions.IntegrationException(
        "Downstream rejected the order: \${status}")
}
return message`,
  },
  {
    title: "Read the caught exception in an error subprocess",
    category: "Error handling",
    description: "The exception is exposed as a property inside the exception subprocess.",
    code: `def ex = message.getProperty("CamelExceptionCaught") as Throwable
def errorText = ex?.message ?: "Unknown error"
def errorClass = ex?.class?.name

message.setProperty("errorText", errorText)
message.setHeader("SAP_MessageProcessingLogCustomStatus", "FAILED")`,
  },
  {
    title: "Base64 encode / decode",
    category: "Encoding & security",
    description: "Common for attachments, certificates and Basic auth headers.",
    code: `def raw = message.getBody(byte[])
def b64 = raw.encodeBase64().toString()

def decoded = b64.decodeBase64()          // -> byte[]
message.setBody(new String(decoded, "UTF-8"))`,
  },
  {
    title: "Read a value from the Secure Store",
    category: "Encoding & security",
    description: "Deployed 'Secure Parameter' / 'User Credentials' artifacts.",
    code: `import com.sap.it.api.securestore.SecureStoreService
import com.sap.it.api.ITApiFactory

def service = ITApiFactory.getService(SecureStoreService.class, null)
def cred = service.getUserCredential("MY_API_CREDENTIAL")
def user = cred.getUsername()
def pass = new String(cred.getPassword())`,
  },
];
