// ─────────────────────────────────────────────────────────────
// 빌드 시점에 IMF 전망 데이터를 미리 받아 정적 JSON으로 저장하는 스크립트.
//
//  ▷ 왜 필요한가?
//    GitHub Pages는 정적 파일만 서빙하고 서버 함수(api/imf.js)를 실행할 수
//    없습니다. IMF DataMapper는 브라우저 직접 호출을 CORS로 막기 때문에
//    Vercel처럼 서버 함수가 없는 배포 환경에서는 IMF 전망을 실시간으로
//    가져올 방법이 없습니다.
//    → 그래서 "빌드할 때(Node 환경, CORS 제한 없음) 미리 받아서 정적 파일로
//      끼워 넣고, 브라우저는 그 정적 파일을 읽는다"로 우회합니다.
//    (src/api/imf.js 가 /api/imf 프록시 실패 시 이 정적 파일로 폴백합니다.)
//
//  ▷ 재미있는 사실: IMF DataMapper API는 URL에 국가 코드를 넣어도 무시하고
//    항상 "그 지표의 전체 국가" 데이터를 돌려줍니다. 그래서 국가마다 따로
//    요청할 필요 없이 지표 하나당 요청 1번(총 5번)이면 충분합니다.
//    (여기서는 앱이 쓰는 17개국만 걸러내 파일 크기를 줄입니다.)
//
//  ▷ 실행 시점: `npm run build` 안에서 자동 실행됩니다. (package.json 참고)
//    네트워크 문제 등으로 실패해도 빌드 전체를 멈추지 않고, 기존에 커밋된
//    public/data/imf-outlook.json 을 그대로 둡니다. (마지막 성공 스냅샷 유지)
// ─────────────────────────────────────────────────────────────
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMF_INDICATORS } from "../src/api/imf.js";
import { ISO3 } from "../src/lib/indicators.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, "../public/data/imf-outlook.json");
const COUNTRIES = Object.values(ISO3); // 앱이 쓰는 17개국 ISO3 코드

// 지표 하나의 "전체 국가" 데이터를 한 번에 받아옵니다.
async function fetchIndicatorAllCountries(code) {
  const url = `https://www.imf.org/external/datamapper/api/v1/${encodeURIComponent(code)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json?.values?.[code] ?? {};
}

async function main() {
  // 결과 형태: { [ISO3]: { [indicatorCode]: [{year, value}, ...] } }
  // → src/api/imf.js 의 fetchImfOutlook() 반환값과 동일한 모양이라
  //   화면 코드(ForecastCard 등)는 폴백 여부를 신경 쓸 필요가 없습니다.
  const out = {};
  for (const iso3 of COUNTRIES) out[iso3] = {};

  let successCount = 0;
  for (const ind of IMF_INDICATORS) {
    let byCountry;
    try {
      byCountry = await fetchIndicatorAllCountries(ind.code);
    } catch (err) {
      console.warn(`⚠️  IMF ${ind.code} 요청 실패, 건너뜁니다: ${err.message}`);
      continue;
    }
    successCount++;
    for (const iso3 of COUNTRIES) {
      const byYear = byCountry[iso3];
      if (!byYear) continue;
      const series = Object.entries(byYear)
        .map(([year, value]) => ({ year: Number(year), value: Number(value) }))
        .filter((d) => !Number.isNaN(d.value))
        .sort((a, b) => a.year - b.year);
      if (series.length > 0) out[iso3][ind.code] = series;
    }
  }

  if (successCount === 0) {
    console.warn(
      "⚠️  IMF 지표를 하나도 받지 못했습니다. 기존 public/data/imf-outlook.json 을 그대로 둡니다."
    );
    return;
  }

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(out));
  console.log(
    `✅ IMF 전망 스냅샷 저장 완료 (${successCount}/${IMF_INDICATORS.length}개 지표): ${OUT_PATH}`
  );
}

main().catch((err) => {
  // 이 스크립트가 실패해도 배포 전체가 막히면 안 되므로 여기서 흡수합니다.
  console.warn(`⚠️  IMF 전망 스냅샷 갱신 중 오류, 기존 파일 유지: ${err.message}`);
});
