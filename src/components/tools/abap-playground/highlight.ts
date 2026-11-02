// A small ABAP highlighter for the playground editor: one line in, tokens out.

export type TokenKind = "kw" | "str" | "tpl" | "num" | "cmt" | "sy" | "dot" | "plain";

export interface Token {
  kind: TokenKind;
  text: string;
}

const KEYWORDS = new Set(
  (
    "REPORT PROGRAM DATA TYPES CONSTANTS PARAMETERS TYPE LIKE VALUE BEGIN END OF TABLE STANDARD SORTED HASHED WITH EMPTY KEY DEFAULT UNIQUE NON-UNIQUE LENGTH DECIMALS " +
    "WRITE SKIP ULINE NEW-LINE IF ELSEIF ELSE ENDIF CASE WHEN OTHERS ENDCASE DO TIMES ENDDO WHILE ENDWHILE LOOP AT INTO ENDLOOP WHERE APPEND TO INSERT MODIFY FROM INDEX CLEAR REFRESH FREE " +
    "READ BINARY SEARCH TRANSPORTING NO FIELDS SORT BY ASCENDING DESCENDING DELETE ADJACENT DUPLICATES COMPARING SELECT SINGLE DISTINCT ENDSELECT ORDER PRIMARY UP ROWS APPENDING CORRESPONDING AS " +
    "FORM ENDFORM PERFORM USING CHANGING TABLES EXIT CONTINUE RETURN CHECK LEAVE CONCATENATE SEPARATED RESPECTING BLANKS LINES CONDENSE NO-GAPS TRANSLATE UPPER LOWER SPLIT MESSAGE " +
    "AND OR NOT IS INITIAL BETWEEN EQ NE LT GT LE GE CP NP CO CN CA NA CS NS DIV MOD START-OF-SELECTION COUNT SUM MIN MAX AVG " +
    "CLASS ENDCLASS DEFINITION IMPLEMENTATION PUBLIC PROTECTED PRIVATE SECTION METHODS CLASS-METHODS CLASS-DATA METHOD ENDMETHOD " +
    "INTERFACE ENDINTERFACE INTERFACES INHERITING ABSTRACT FINAL REDEFINITION IMPORTING EXPORTING CHANGING RETURNING RAISING RECEIVING " +
    "OPTIONAL READ-ONLY NEW ME SUPER TRY CATCH CLEANUP ENDTRY RAISE EXCEPTION COND SWITCH CONV CAST THEN BOUND INSTANCE SUPPLIED REF CREATE OBJECT CALL " +
    "FIELD-SYMBOLS FIELD-SYMBOL ASSIGNING ASSIGN COMPONENT STRUCTURE UNASSIGN ASSIGNED REDUCE INIT NEXT FOR IN UNTIL JOIN INNER LEFT OUTER ON GROUP HAVING " +
    "UPDATE SET COMMIT ROLLBACK WORK FRIENDS LOCAL TESTING RISK LEVEL HARMLESS DURATION SHORT"
  ).split(" "),
);

const isWordStart = (ch: string) => /[A-Za-z_]/.test(ch);

export function highlightLine(line: string): Token[] {
  if (line.startsWith("*")) return [{ kind: "cmt", text: line }];
  const out: Token[] = [];
  const push = (kind: TokenKind, text: string) => {
    const last = out[out.length - 1];
    if (last && last.kind === kind && kind === "plain") last.text += text;
    else out.push({ kind, text });
  };
  let i = 0;
  const n = line.length;
  while (i < n) {
    const ch = line[i];
    if (ch === '"') {
      push("cmt", line.slice(i));
      break;
    }
    if (ch === "'" || ch === "`" || ch === "|") {
      let j = i + 1;
      while (j < n) {
        if (ch === "|" && line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === ch) {
          if (ch !== "|" && line[j + 1] === ch) {
            j += 2;
            continue;
          }
          j++;
          break;
        }
        j++;
      }
      push(ch === "|" ? "tpl" : "str", line.slice(i, j));
      i = j;
      continue;
    }
    if (/[0-9]/.test(ch) && !/[A-Za-z0-9_]/.test(line[i - 1] ?? "")) {
      let j = i;
      while (j < n && /[0-9.]/.test(line[j])) j++;
      if (line[j - 1] === ".") j--;
      push("num", line.slice(i, j));
      i = j;
      continue;
    }
    if (isWordStart(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_\-~]/.test(line[j]) && !(line[j] === "-" && !isWordStart(line[j + 1] ?? ""))) j++;
      const word = line.slice(i, j);
      const up = word.toUpperCase();
      push(up.startsWith("SY-") ? "sy" : KEYWORDS.has(up) ? "kw" : "plain", word);
      i = j;
      continue;
    }
    if (ch === "." && line.slice(i + 1).trim() === "") {
      push("dot", ".");
      i++;
      continue;
    }
    push("plain", ch);
    i++;
  }
  return out;
}
