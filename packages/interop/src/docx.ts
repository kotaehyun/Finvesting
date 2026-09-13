import { zipRead, zipStore } from "./zip";

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function decodeXml(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/<w:tab\b[^/]*\/>/g, "\t");
}

function cellXml(text: string) {
  return `<w:tc><w:p><w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p></w:tc>`;
}

function tableXml(rows: string[][]) {
  const body = rows.map((r) => `<w:tr>${r.map((c) => cellXml(c)).join("")}</w:tr>`).join("");
  return `<w:tbl>${body}</w:tbl>`;
}

/** 표만 있는 최소 docx. Word·미리보기용. */
export function rowsToDocx(rows: string[][]): Uint8Array {
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${tableXml(rows)}<w:p/></w:body>
</w:document>`;
  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;
  return new Uint8Array(zipStore({
    "[Content_Types].xml": types,
    "_rels/.rels": rels,
    "word/document.xml": document,
    "word/_rels/document.xml.rels": docRels,
  }));
}

function textsIn(xml: string) {
  return [...xml.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((m) => decodeXml(m[1] ?? ""))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/** Word 표 → 행. 표가 없으면 문단을 한 열로 둔다. */
export function docxToRows(buf: Uint8Array): string[][] {
  if (buf.length >= 8 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) {
    throw new Error("구형 .doc는 지원하지 않습니다. Word에서 .docx로 저장하세요");
  }
  const xmlBuf = zipRead(Buffer.from(buf), "word/document.xml");
  if (!xmlBuf) throw new Error("docx에서 word/document.xml을 찾지 못했습니다");
  const xml = xmlBuf.toString("utf8");
  const tables = [...xml.matchAll(/<w:tbl\b[\s\S]*?<\/w:tbl>/g)];
  const out: string[][] = [];
  for (const t of tables) {
    const rows = [...t[0].matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)];
    for (const row of rows) {
      const cells = [...row[0].matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)].map((c) => textsIn(c[0]));
      if (cells.some((c) => c !== "")) out.push(cells);
    }
  }
  if (out.length) return out;
  for (const p of xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)) {
    const t = textsIn(p[0]);
    if (t) out.push([t]);
  }
  return out;
}
