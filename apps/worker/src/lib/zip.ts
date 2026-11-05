import { inflateRawSync } from "node:zlib";

const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;

function findCentral(buf: Buffer, from: number) {
  for (let i = from; i + 4 <= buf.length; i++) {
    if (buf.readUInt32LE(i) === CENTRAL) return i;
  }
  return -1;
}

/** ZIP 첫 파일 내용. DART corpCode.xml 응답용. */
export function readZipFirstFile(buf: Buffer): Buffer {
  if (buf.length < 30 || buf.readUInt32LE(0) !== LOCAL) {
    throw new Error("not a zip");
  }
  const method = buf.readUInt16LE(8);
  const nameLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const dataStart = 30 + nameLen + extraLen;
  let compSize = buf.readUInt32LE(18);
  if (compSize === 0) {
    const central = findCentral(buf, dataStart);
    compSize = central > dataStart ? central - dataStart : buf.length - dataStart;
  }
  const payload = buf.subarray(dataStart, Math.min(buf.length, dataStart + compSize));
  if (method === 0) return Buffer.from(payload);
  if (method === 8) return inflateRawSync(payload);
  throw new Error(`unsupported zip method ${method}`);
}

export function decodeDartCorpCodePayload(buf: Buffer): string {
  if (buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4b) {
    return readZipFirstFile(buf).toString("utf8");
  }
  return buf.toString("utf8");
}

type ZipEntry = { name: string; method: number; compSize: number; dataStart: number };

/** ZIP 로컬 헤더를 순회해 파일 목록·오프셋. */
export function listZipLocalEntries(buf: Buffer): ZipEntry[] {
  const out: ZipEntry[] = [];
  let i = 0;
  while (i + 30 <= buf.length && buf.readUInt32LE(i) === LOCAL) {
    const method = buf.readUInt16LE(i + 8);
    const compSize = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.subarray(i + 30, i + 30 + nameLen).toString("utf8");
    const dataStart = i + 30 + nameLen + extraLen;
    let size = compSize;
    if (size === 0) {
      const next = findCentral(buf, dataStart);
      // 다음 local 또는 central 전까지
      let nextLocal = -1;
      for (let j = dataStart; j + 4 <= buf.length; j++) {
        if (buf.readUInt32LE(j) === LOCAL) { nextLocal = j; break; }
        if (buf.readUInt32LE(j) === CENTRAL) break;
      }
      size = (nextLocal > 0 ? nextLocal : next > 0 ? next : buf.length) - dataStart;
    }
    out.push({ name, method, compSize: size, dataStart });
    i = dataStart + size;
  }
  return out;
}

export function readZipEntry(buf: Buffer, entry: ZipEntry): Buffer {
  const payload = buf.subarray(entry.dataStart, Math.min(buf.length, entry.dataStart + entry.compSize));
  if (entry.method === 0) return Buffer.from(payload);
  if (entry.method === 8) return inflateRawSync(payload);
  throw new Error(`unsupported zip method ${entry.method}`);
}

export function readZipFileBySuffix(buf: Buffer, suffix: string): Buffer | null {
  const entries = listZipLocalEntries(buf);
  const hit = entries.find((e) => e.name.toLowerCase().endsWith(suffix.toLowerCase()));
  return hit ? readZipEntry(buf, hit) : null;
}
