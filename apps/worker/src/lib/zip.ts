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
