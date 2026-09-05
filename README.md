# Global Macro Command Center (국가 경제 리스크 모니터)

한 국가를 고르면 **거시지표(물가·성장·고용) + 기업/시장 + 재정·부채 + 대외·교역 + 금융·통화**를
공개 오픈 데이터에서 불러와 차트로 보여주고, 값의 높낮이에 따라
**초록 / 노랑 / 빨강 리스크 신호**를 표시하는 가벼운 웹앱입니다.
여기에 **OECD 경기선행지수로 지금 경기 국면(확장·둔화·수축·회복)** 을 읽고,
**IMF 전망**으로 앞으로의 방향까지 함께 봅니다.

> 2학기 개인 프로젝트. DB·백엔드 서버 없이 **프론트엔드 + 공개 오픈 데이터**로 동작합니다.
> (IMF 전망은 CORS 우회를 위해 Vercel Serverless Function을 쓰되, 서버 함수가 없는
> GitHub Pages 등 정적 호스팅에서는 빌드 시 미리 받아둔 정적 스냅샷으로 자동 대체됩니다.)

---

## 빠른 시작

```bash
npm install       # 처음 한 번만
npm run dev       # 개발 서버 → http://localhost:5173
npm run build     # 배포용 빌드 (dist/ 폴더 생성)
npm run preview   # 빌드 결과 미리보기
```

Node 18 이상 필요 (권장 20+).

> 로컬 `npm run dev` 에는 `/api` 경로가 없지만, **IMF 전망 카드**는 `npm run build`가
> 미리 받아 둔 정적 스냅샷(`public/data/imf-outlook.json`)으로 폴백해 정상 표시됩니다.
> (스냅샷을 새로 받고 싶다면 `npm run prefetch:imf` 실행 후 새로고침)

---

## 4가지 모드

| 모드 | 하는 일 | 데이터 |
|---|---|---|
| **단일 국가** | 국가 개요 + 5개 카테고리 20여 개 지표를 타일로 한눈에 + 선택 지표 상세 추이 + IMF 전망 | World Bank, IMF |
| **경기 국면** | OECD 경기선행지수(CLI)로 확장·둔화·수축·회복 4국면 판정 + 기업/소비자 심리지수 | OECD (DBnomics) |
| **국가 비교** | 두 나라를 같은 지표로 한 차트에 겹쳐 비교 (카테고리→지표 선택) | World Bank |
| **관계 분석** | 두 지표를 x·y축에 놓고 산점도로 상관관계 확인 (필립스 곡선 등 프리셋 제공) | World Bank |

---

## 데이터 소스

| 소스 | 키 | CORS | 호출 방식 | 이 앱에서 쓰는 것 |
|---|---|---|---|---|
| [World Bank Open Data](https://data.worldbank.org) | 불필요 | 허용 | 브라우저 직접 | 거시·기업/시장·재정·대외·금융 지표 23종, 국가 메타데이터 |
| [DBnomics](https://db.nomics.world) | 불필요 | 허용 | 브라우저 직접 | OECD 경기선행지수(CLI)·기업경기실사(BCI)·소비자심리(CCI) |
| [IMF DataMapper](https://www.imf.org/external/datamapper) | 불필요 | **막힘** | `api/imf.js` 서버 함수 경유, 실패 시 빌드 시점 정적 스냅샷으로 폴백 | 성장률·물가·실업·정부부채·경상수지 전망(향후 3년) |
| [FRED](https://fred.stlouisfed.org) | 필요 | 막힘 | `api/fred.js` 서버 함수 경유 | (선택) 미국 고빈도 시계열 — 키 등록 시 활성 |

- **왜 이렇게 나눴나?** 키가 필요 없고 CORS가 열린 소스(World Bank·DBnomics)를 주력으로 삼아
  백엔드 없이 완성하고, CORS가 막힌 IMF는 얇은 프록시 함수 1개로 감쌌습니다.
- **서버 함수가 없는 정적 호스팅(GitHub Pages)은 어떻게 하나?** `npm run build` 가
  `scripts/fetch-imf-outlook.mjs`를 먼저 실행해 IMF 5개 지표 × 17개국 데이터를
  받아 `public/data/imf-outlook.json`으로 저장합니다. IMF DataMapper는 브라우저에서
  직접 부르면 CORS로 막히지만, 빌드는 Node 환경에서 돌기 때문에 문제없이 받아올 수
  있습니다. 배포된 앱은 `/api/imf`를 먼저 시도하고, 그게 없으면(정적 호스팅) 이
  정적 파일로 자동 전환합니다.
- DBnomics는 IMF·OECD·Eurostat 등 90여 기관 데이터를 하나의 JSON API로 재제공하는 허브라,
  향후 지표를 늘릴 때 새 API를 붙이지 않고 시리즈 코드만 추가하면 됩니다.

---

## 폴더 구조

```
├─ index.html
├─ vite.config.js
├─ scripts/
│   └─ fetch-imf-outlook.mjs  빌드 시 IMF 전망을 미리 받아 정적 스냅샷으로 저장
├─ public/
│   └─ data/imf-outlook.json  위 스크립트가 생성하는 정적 스냅샷 (서버 함수 없는 배포용 폴백)
├─ api/
│   ├─ imf.js                 IMF DataMapper 프록시 (CORS 우회, 키 불필요)
│   └─ fred.js                (선택) FRED 프록시 (키 필요)
└─ src/
    ├─ main.jsx / index.css
    ├─ App.jsx                4개 모드 전환
    ├─ lib/
    │   ├─ indicators.js      국가 17개 + 지표 23개(5개 카테고리) + ISO 코드 변환표
    │   ├─ risk.js            "지표 값 → 리스크 신호" 판정 규칙 12종
    │   ├─ businessCycle.js   CLI → 경기 4국면 해석
    │   └─ format.js          숫자 표시 도우미
    ├─ api/
    │   ├─ worldBank.js       World Bank 호출 (단일/다중 지표, 국가 메타)
    │   ├─ dbnomics.js        DBnomics(OECD) 경기지표 호출
    │   ├─ imf.js             IMF 프록시 호출 + 정적 스냅샷 폴백 클라이언트 도우미
    │   └─ fred.js            FRED 프록시 클라이언트 도우미
    ├─ hooks/
    │   ├─ useAsync.js        로딩/성공/에러 + 경쟁상태 처리 공통 훅
    │   ├─ useMacroData.js    useAllIndicators / useCountryProfile / useLeadingIndicators / useImfOutlook
    │   ├─ useSeries.js       한 국가+한 지표 (비교·관계 모드용)
    │   └─ usePair.js         한 국가+두 지표 (산점도용)
    ├─ components/
    │   ├─ ui.jsx             Card / Select / SegmentedControl / Spinner / ErrorBox
    │   ├─ IndicatorTabs.jsx  알약 탭 (지표·카테고리 공용)
    │   ├─ OverviewGrid.jsx   카테고리 지표 타일 격자
    │   ├─ CountryHeaderCard.jsx  국가 개요 카드
    │   ├─ StatCard.jsx / RiskCard.jsx
    │   ├─ PhaseGauge.jsx     경기 4국면 게이지
    │   ├─ ConfidenceCard.jsx BCI/CCI 심리지수 게이지
    │   ├─ ForecastCard.jsx   IMF 전망 표
    │   ├─ TrendChart.jsx     라인차트 (연간·월간, 기준선 지원)
    │   └─ ScatterChartCard.jsx  산점도
    └─ views/
        ├─ SingleCountryView.jsx
        ├─ BusinessCycleView.jsx
        ├─ CompareView.jsx
        └─ RelationView.jsx
```

---

## 배포

### GitHub Pages (현재 운영 중인 배포)

`main` 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 자동으로 빌드해
Pages 에 올립니다. (저장소 Settings → Pages → Source 를 "GitHub Actions" 로
한 번만 바꿔주면 됩니다.) 매달 1일에도 스케줄로 한 번 더 빌드해, 코드 변경이
없어도 IMF 전망 정적 스냅샷을 최신 값으로 갱신합니다.

GitHub Pages는 서버 함수를 실행하지 못하므로 `/api/imf`, `/api/fred` 는 여기서
동작하지 않습니다. IMF 전망은 빌드 시 미리 받아둔 정적 스냅샷으로 자동 대체되어
정상 표시되고, FRED(선택 기능)만 비활성 상태로 남습니다.

### Vercel (서버 함수까지 실시간으로 쓰고 싶을 때)

1. 이 폴더를 GitHub 저장소에 push
2. [vercel.com](https://vercel.com) 로그인 → **Add New → Project** → 저장소 Import
3. Framework Preset이 자동으로 **Vite** 로 잡힘 → **Deploy**
4. `api/` 폴더가 자동으로 Serverless Function 으로 배포됨 → IMF 전망을 실시간 프록시로 조회
5. (선택) FRED를 쓰려면 Settings → Environment Variables 에 `FRED_API_KEY` 등록 후 재배포

---

## "설명 가능한 코드" 원칙

모든 파일 상단에 **무슨 역할인지 / 왜 이렇게 했는지**를 한국어 주석으로 적어 두었습니다.
`src/lib/risk.js`의 리스크 임계값과 `src/lib/businessCycle.js`의 국면 구분은
"제가 국제기구의 경험적 기준을 참고해 직접 정한 단순 규칙"이며,
공식 판정이 아니고 피드백을 받아 조정할 예정임을 코드에 명시했습니다.

---

## 로드맵

| 단계 | 내용 | 상태 |
|---|---|---|
| Phase 3–6 | 거시지표 3종 + 추이차트 + 국가 비교 + 산점도 | ✅ |
| Phase 7 | 사용자 테스트 → 임계값·UX 개선 | ⬜ |
| Phase 8 | **지표 23종·5개 카테고리로 확장** (기업/시장·재정·대외·금융) | ✅ |
| Phase 9 | **경기 국면 모드** (OECD CLI·BCI·CCI, DBnomics) | ✅ |
| Phase 10 | **IMF 전망 연동** (프록시 함수) | ✅ |
| Phase 10.5 | **GitHub Pages 정적 배포 지원** (IMF 전망 정적 스냅샷 폴백) | ✅ |
| Phase 11 | FRED 연동으로 미국 월간 데이터 추가 | 🧩 뼈대 준비됨 |

개발 기록은 [`DEVLOG.md`](./DEVLOG.md), 기획 문서는 [`PROJECT.md`](./PROJECT.md) 참고.
