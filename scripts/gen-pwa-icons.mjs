// ─────────────────────────────────────────────────────────────
// PWA(설치형 앱) 아이콘을 코드로 그려서 PNG로 저장하는 스크립트.
//
//  ▷ 왜 코드로 그리나?
//    디자인 툴 없이도 "브랜드 파란 배경 + 상승하는 막대 3개(차트 느낌)"라는
//    단순한 로고를 항상 똑같이 만들 수 있고, 저장소에 바이너리 자산을 덜 얹습니다.
//    (외부 의존성 없이 Node 내장 zlib만으로 유효한 PNG를 인코딩합니다.)
//
//  ▷ 산출물 (public/)
//    pwa-192x192.png, pwa-512x512.png : 일반 아이콘
//    maskable-512.png                 : 안전영역(가장자리 여백)을 둔 마스커블 아이콘
//    apple-touch-icon.png (180)       : iOS 홈 화면용
//
//  ▷ 실행: `npm run build` 안에서 자동 실행 (public/에 파일이 이미 있으면 건너뜀은 안 함 — 항상 갱신)
// ─────────────────────────────────────────────────────────────
import { writeFile, mkdir } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public");

const BRAND = [0x00, 0x71, 0xe3]; // #0071e3
const WHITE = [0xff, 0xff, 0xff];

// ── 아주 작은 PNG 인코더 (truecolor + alpha, 8bit) ──────────────
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  // 나머지(compression/filter/interlace)는 0

  // 스캔라인마다 filter byte(0) 를 앞에 붙임
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── 아이콘 픽셀 그리기 ────────────────────────────────────────
function drawIcon(size, { pad = 0.14 } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = size * 0.22; // 둥근 모서리
  const inset = size * pad; // 마스커블 안전영역

  const put = (x, y, [r, g, b], a = 255) => {
    const i = (y * size + x) * 4;
    rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
  };
  const inRoundRect = (x, y, x0, y0, x1, y1, rad) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    const cx = Math.min(Math.max(x, x0 + rad), x1 - rad);
    const cy = Math.min(Math.max(y, y0 + rad), y1 - rad);
    return (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad;
  };

  // 막대 3개 (왼→오 상승). 아이콘 안쪽 영역 기준.
  const areaX0 = inset + size * 0.14;
  const areaX1 = size - inset - size * 0.14;
  const areaY0 = inset + size * 0.16;
  const areaY1 = size - inset - size * 0.16;
  const barW = (areaX1 - areaX0) / 3.5;
  const gap = barW / 5;
  const heights = [0.42, 0.68, 1.0];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 배경: 둥근 사각형 안이면 브랜드색, 밖이면 투명
      if (!inRoundRect(x, y, inset, inset, size - inset, size - inset, radius)) {
        put(x, y, BRAND, 0);
        continue;
      }
      put(x, y, BRAND, 255);

      // 막대
      for (let b = 0; b < 3; b++) {
        const bx0 = areaX0 + b * (barW + gap);
        const bx1 = bx0 + barW;
        const bh = (areaY1 - areaY0) * heights[b];
        const by0 = areaY1 - bh;
        if (x >= bx0 && x <= bx1 && y >= by0 && y <= areaY1) {
          put(x, y, WHITE, 255);
        }
      }
    }
  }
  return rgba;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const targets = [
    { file: "pwa-192x192.png", size: 192, pad: 0 },
    { file: "pwa-512x512.png", size: 512, pad: 0 },
    { file: "maskable-512.png", size: 512, pad: 0.14 },
    { file: "apple-touch-icon.png", size: 180, pad: 0 },
  ];
  for (const t of targets) {
    const png = encodePng(t.size, t.size, drawIcon(t.size, { pad: t.pad }));
    await writeFile(path.join(OUT_DIR, t.file), png);
    console.log(`✅ ${t.file} (${t.size}px, ${png.length} bytes)`);
  }
}

main().catch((err) => {
  console.warn(`⚠️  PWA 아이콘 생성 실패(기존 파일 유지): ${err.message}`);
});
