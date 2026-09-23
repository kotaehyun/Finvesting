/**
 * core 모듈의 export 상수를 JSON으로 덤프한다.
 * 숫자 잎마다 entries 메타를 붙인다. 새 숫자는 만들지 않는다.
 *
 * 사용: node --experimental-strip-types packages/core/scripts/dump-data-json.mjs
 * (또는 pnpm exec tsx packages/core/scripts/dump-data-json.mjs)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");

const VERIFIED = "미검증";

function mergeEntry(defaults, partial) {
  return {
    id: partial.id,
    value: partial.value,
    unit: partial.unit ?? defaults.unit ?? "",
    asOf: partial.asOf ?? defaults.asOf,
    effectiveFrom: partial.effectiveFrom ?? defaults.effectiveFrom,
    effectiveTo: partial.effectiveTo ?? defaults.effectiveTo,
    sourceTitle: partial.sourceTitle ?? defaults.sourceTitle,
    sourceUrl: partial.sourceUrl ?? defaults.sourceUrl,
    article: partial.article !== undefined ? partial.article : defaults.article,
    verifiedBy: partial.verifiedBy ?? defaults.verifiedBy,
    verifiedOn: partial.verifiedOn !== undefined ? partial.verifiedOn : defaults.verifiedOn,
  };
}

function collectNumberEntries(value, defaults, prefix = "") {
  const out = [];
  const walk = (v, path) => {
    if (v === null) {
      if (path) out.push(mergeEntry(defaults, { id: path, value: null }));
      return;
    }
    if (typeof v === "number") {
      if (Number.isFinite(v)) out.push(mergeEntry(defaults, { id: path || "value", value: v }));
      return;
    }
    if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, path ? `${path}[${i}]` : `[${i}]`));
      return;
    }
    if (v && typeof v === "object") {
      for (const [k, child] of Object.entries(v)) walk(child, path ? `${path}.${k}` : k);
    }
  };
  walk(value, prefix);
  return out;
}

function writeJson(rel, obj) {
  const abs = join(dataDir, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify(obj, null, 2) + "\n");
  console.log("wrote", rel, "entries", obj.entries?.length ?? 0);
}

async function load(rel) {
  const url = pathToFileURL(join(root, "src", rel)).href;
  return import(url);
}

function pack(defaults, payload) {
  const entries = collectNumberEntries(payload, defaults);
  return { defaults, ...payload, entries };
}

const jobs = [
  {
    file: "realty/bankruptcy.json",
    mod: "realty-bankruptcy.ts",
    defaults: {
      asOf: "2025",
      effectiveFrom: null,
      effectiveTo: null,
      sourceTitle: "법원통계월보 · 서울회생법원 개인파산 통계조사",
      sourceUrl: "https://www.scourt.go.kr/portal/news/NewsViewAction.work?gubun=6&seqnum=2860",
      article: null,
      verifiedBy: VERIFIED,
      verifiedOn: null,
    },
    pick: (m) => ({
      causes: m.REALTY_BANKRUPTCY_CAUSES,
      stats: m.REALTY_INSOLVENCY_STATS,
      links: m.REALTY_INSOLVENCY_LINKS,
      slots: m.REALTY_INSOLVENCY_SLOTS,
    }),
  },
  {
    file: "realty/card.json",
    mod: "realty-card.ts",
    defaults: {
      asOf: "2026-06-30",
      effectiveFrom: null,
      effectiveTo: null,
      sourceTitle: "금융감독원 2026년 상반기 여신전문금융회사 영업실적(잠정)",
      sourceUrl: "https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218",
      article: null,
      verifiedBy: VERIFIED,
      verifiedOn: null,
    },
    pick: (m) => ({
      links: m.REALTY_CARD_LINKS,
      npl: m.REALTY_CARD_NPL,
      revolving: m.REALTY_REVOLVING,
    }),
  },
];

// Remaining modules filled below after first batch pattern — extended list
const more = [
  ["realty/claims.json", "realty-claims.ts", "REALTY", "claims"],
  ["realty/cohort.json", "realty-cohort.ts", "REALTY", "cohort"],
  ["realty/distress.json", "realty-distress.ts", "REALTY", "distress"],
  ["realty/loans.json", "realty-loans.ts", "REALTY", "loans"],
  ["realty/map.json", "realty-map.ts", "REALTY", "map"],
  ["realty/nts.json", "realty-nts.ts", "REALTY", "nts"],
  ["realty/officials.json", "realty-officials.ts", "REALTY", "officials"],
  ["realty/pop.json", "realty-pop.ts", "REALTY", "pop"],
  ["realty/rates.json", "realty-rates.ts", "REALTY", "rates"],
  ["realty/ref.json", "realty-ref.ts", "REALTY", "ref"],
  ["realty/stress.json", "realty-stress.ts", "REALTY", "stress"],
  ["realty/tenure.json", "realty-tenure.ts", "REALTY", "tenure"],
  ["realty/wealth.json", "realty-wealth.ts", "REALTY", "wealth"],
];

async function dumpModule(outFile, modFile, defaults, pickFn) {
  const m = await load(modFile);
  const payload = pickFn(m);
  writeJson(outFile, pack(defaults, payload));
}

function defaultMeta(sourceTitle, sourceUrl, asOf = null) {
  return {
    asOf,
    effectiveFrom: null,
    effectiveTo: null,
    sourceTitle,
    sourceUrl,
    article: null,
    verifiedBy: VERIFIED,
    verifiedOn: null,
  };
}

/** export 이름 중 REALTY_* / 숫자 포함 객체를 전부 담는다(함수 제외). */
function pickAllDataExports(m) {
  const payload = {};
  for (const [k, v] of Object.entries(m)) {
    if (typeof v === "function") continue;
    if (k === "default") continue;
    // 타입·문자열 유니온은 런타임에 없음
    payload[k] = v;
  }
  return payload;
}

async function main() {
  for (const job of jobs) {
    await dumpModule(job.file, job.mod, job.defaults, job.pick);
  }

  // 나머지 realty: 모듈 전체 데이터 export + 파일 안 첫 source/url 추정
  const metaHints = {
    "realty-claims.ts": defaultMeta("부동산 채권·담보 공표", "https://www.fss.or.kr/", null),
    "realty-cohort.ts": defaultMeta("혼인·출산 코호트 공표", "https://kosis.kr/", null),
    "realty-distress.ts": defaultMeta("공실·연체·경매 공표", "https://www.fss.or.kr/", null),
    "realty-loans.ts": defaultMeta("가계대출 공표", "https://www.bok.or.kr/", null),
    "realty-map.ts": defaultMeta("시도 중심점·대출 맵", "https://www.openstreetmap.org/", null),
    "realty-nts.ts": defaultMeta("국세 집계", "https://www.nts.go.kr/", null),
    "realty-officials.ts": defaultMeta("공직자 재산 공개", "https://www.pge.go.kr/", null),
    "realty-pop.ts": defaultMeta("인구·가구 공표", "https://kosis.kr/", null),
    "realty-rates.ts": defaultMeta("한은·COFIX 대출금리", "https://www.bok.or.kr/", null),
    "realty-ref.ts": defaultMeta("부동산 참고 집계", "https://www.molit.go.kr/", null),
    "realty-stress.ts": defaultMeta("공실·PIR 등 스트레스", "https://www.molit.go.kr/", null),
    "realty-tenure.ts": defaultMeta("전월세 비중 공표", "https://kosis.kr/", null),
    "realty-wealth.ts": defaultMeta("고액 자산 이동 집계", "https://www.nts.go.kr/", null),
  };

  for (const [outFile, modFile] of more.map((r) => [r[0], r[1]])) {
    const m = await load(modFile);
    let defaults = metaHints[modFile] ?? defaultMeta("데이터 없음", "https://example.invalid/", null);
    // 모듈 안 링크·asOf가 있으면 덮어쓴다(새 URL 생성 금지 — 코드에 있는 것만)
    const payload = pickAllDataExports(m);
    const blob = JSON.stringify(payload);
    const urlMatch = blob.match(/https?:\\\/\\\/[^"\\]+/);
    // JSON.stringify doesn't escape that way for plain strings
    const urlMatch2 = blob.match(/https?:\/\/[^"\\s]+/);
    if (urlMatch2) defaults = { ...defaults, sourceUrl: urlMatch2[0] };
    // asOf 필드 탐색
    const asOfHit = Object.values(payload).find((v) => v && typeof v === "object" && "asOf" in v && typeof v.asOf === "string");
    if (asOfHit) defaults = { ...defaults, asOf: asOfHit.asOf };
    const sourceHit = Object.values(payload).find((v) => v && typeof v === "object" && "source" in v && typeof v.source === "string");
    if (sourceHit) defaults = { ...defaults, sourceTitle: sourceHit.source };
    writeJson(outFile, pack(defaults, { exports: payload }));
  }

  // tax brackets
  {
    const m = await load("tax-brackets.ts");
    const defaults = {
      asOf: null,
      effectiveFrom: null,
      effectiveTo: null,
      sourceTitle: "국세법령정보시스템·조문 문언",
      sourceUrl: "https://www.law.go.kr/",
      article: "소득세법 제55조 등",
      verifiedBy: VERIFIED,
      verifiedOn: null,
    };
    const payload = {
      itaArt55: m.ITA_ART55_BRACKETS,
      ihtaArt26: m.IHTA_ART26_BRACKETS,
      ltaArt111House: m.LTA_ART111_HOUSE_BRACKETS,
      cretArt9_2house: m.CRET_ART9_2HOUSE_BRACKETS,
      cretArt9_3house: m.CRET_ART9_3HOUSE_BRACKETS,
      taxTablesMeta: m.TAX_TABLES.map(({ brackets: _b, ...rest }) => rest),
      cgtFlatRates: m.CGT_FLAT_RATES,
      giftDeductions: m.GIFT_DEDUCTIONS,
      taxTerms: m.TAX_TERMS,
      progressivePlain: m.PROGRESSIVE_PLAIN,
      taxHelpLinks: m.TAX_HELP_LINKS,
    };
    writeJson("tax/brackets.json", pack(defaults, payload));
  }

  // payroll
  {
    const m = await load("payroll.ts");
    const defaults = {
      asOf: "2026",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      sourceTitle: "4대보험 연계센터·복지부 건정심(건강보험)",
      sourceUrl: "https://www.4insure.or.kr/",
      article: null,
      verifiedBy: VERIFIED,
      verifiedOn: null,
    };
    writeJson(
      "tax/payroll-rates-2026.json",
      pack(defaults, {
        rates: m.PAYROLL_RATES_2026,
        basicPersonalExemption: m.BASIC_PERSONAL_EXEMPTION,
      }),
    );
  }

  // corp local
  {
    const m = await load("corp-tax.ts");
    const defaults = {
      asOf: null,
      effectiveFrom: null,
      effectiveTo: null,
      sourceTitle: "지방세법 제103조의20",
      sourceUrl: "https://www.law.go.kr/",
      article: "지방세법 제103조의20",
      verifiedBy: VERIFIED,
      verifiedOn: null,
    };
    writeJson(
      "tax/corp-local-rate.json",
      pack(defaults, { citLocalOnCorpTax: m.CIT_LOCAL_ON_CORP_TAX }),
    );
  }

  // ei / min wage (civil pay already written)
  {
    const m = await load("labor-cost.ts");
    const defaults = {
      asOf: "2026-01-01",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      sourceTitle: "고용노동부 고시 제2025-47호 · 고용산재보험료징수법 시행령 제12조",
      sourceUrl: "https://www.moel.go.kr/",
      article: "고용산재보험료징수법 시행령 제12조",
      verifiedBy: VERIFIED,
      verifiedOn: null,
    };
    writeJson(
      "tax/ei-stability.json",
      pack(defaults, {
        minWage2026: m.MIN_WAGE_2026,
        eiStabilityBands: m.EI_STABILITY_BANDS,
        industrialAccidentNote: m.INDUSTRIAL_ACCIDENT_NOTE,
      }),
    );
  }

  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
