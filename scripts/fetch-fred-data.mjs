// ─────────────────────────────────────────────────────────────
// 빌드 시점에 FRED(미국) 데이터를 미리 받아 정적 JSON으로 저장하는 스크립트.
// (IMF 전망 스냅샷 scripts/fetch-imf-outlook.mjs 와 같은 목적·구조)
//
//  ▷ 왜 필요한가?
//    GitHub Pages 등 서버 함수가 없는 정적 호스팅에서는 /api/fred 가 없고,
//    FRED는 브라우저 직접 호출이 CORS로 막힙니다. 빌드는 Node 환경에서 돌고
//    CORS 제한이 없으므로, 여기서 미리 받아 public/data/fred.json 으로 끼워 넣습니다.
//
//  ▷ API 키
//    FRED는 키가 필요합니다. 환경변수 FRED_API_KEY 로 전달하세요.
//      - 로컬:  .env 에 FRED_API_KEY=... (또는 셸 환경변수)
//      - CI(GitHub Actions): 저장소 Settings → Secrets → FRED_API_KEY 등록,
//        워크플로 build 단계 env 로 주입 (.github/workflows/deploy.yml 참고)
//    키가 없으면 아무 것도 하지 않고 정상 종료합니다. (그 경우 앱에서 FRED 패널은 숨김)
//
//  ▷ 실행: `npm run build` 안에서 자동 실행. 실패해도 빌드를 막지 않습니다.
// ─────────────────────────────────────────────────────────────
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FRED_SERIES } from "../src/api/fred.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, "../public/data/fred.json");
const START = "2015-01-01";

// .env 파일이 있으면 FRED_API_KEY 만 가볍게 읽어 옵니다. (dotenv 의존성 없이)
async function keyFromDotenv() {
  try {
    const txt = await readFile(path.resolve(__dirname, "../.env"), "utf8");
    const m = txt.match(/^\s*FRED_API_KEY\s*=\s*(.+?)\s*$/m);
    return m ? m[1].replace(/^["']|["']$/g, "") : "";
  } catch {
    return "";
  }
}

async function fetchSeries(id, key) {
  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${encodeURIComponent(id)}` +
    `&observation_start=${START}&file_type=json&api_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json.observations ?? [])
    .filter((o) => o.value !== ".")
    .map((o) => ({ date: o.date, value: Number(o.value) }))
    .filter((o) => !Number.isNaN(o.value));
}

async function main() {
  const key = process.env.FRED_API_KEY || (await keyFromDotenv());
  if (!key) {
    console.log("ℹ️  FRED_API_KEY 없음 — FRED 스냅샷 생성을 건너뜁니다. (앱에서 FRED 패널은 숨김)");
    return;
  }

  const out = {};
  let ok = 0;
  for (const s of FRED_SERIES) {
    try {
      const series = await fetchSeries(s.id, key);
      if (series.length) {
        out[s.id] = series;
        ok++;
      }
    } catch (err) {
      console.warn(`⚠️  FRED ${s.id} 요청 실패, 건너뜁니다: ${err.message}`);
    }
  }

  if (ok === 0) {
    console.warn("⚠️  FRED 시리즈를 하나도 받지 못했습니다. 기존 파일(있다면)을 유지합니다.");
    return;
  }

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(out));
  console.log(`✅ FRED 스냅샷 저장 완료 (${ok}/${FRED_SERIES.length}개 시리즈): ${OUT_PATH}`);
}

main().catch((err) => {
  console.warn(`⚠️  FRED 스냅샷 갱신 중 오류, 계속 진행: ${err.message}`);
});
