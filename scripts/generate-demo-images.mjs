// /demo で使う架空の「写真」（SVGイラスト）を public/demo/ に生成する。
// 実ユーザーの写真を使わないためのサンプル素材。被写体はすべて手続き的に描いている。
// 使い方: node scripts/generate-demo-images.mjs

import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('../public/demo/', import.meta.url)
mkdirSync(OUT, { recursive: true })

// 再現性のある疑似乱数
function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}

const backdrop = (id, top, bottom, rand) => {
  const bokeh = Array.from({ length: 9 }, () => {
    const r = 30 + rand() * 90
    return `<circle cx="${(rand() * 800).toFixed(0)}" cy="${(rand() * 800).toFixed(0)}" r="${r.toFixed(0)}" fill="#fff" opacity="${(0.05 + rand() * 0.1).toFixed(2)}"/>`
  }).join('')
  return `<defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
    <radialGradient id="vig${id}" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2b1d10" stop-opacity=".28"/></radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg${id})"/>${bokeh}`
}
const vignette = (id) => `<rect width="800" height="800" fill="url(#vig${id})"/>`

const petals = (n, rx, ry, dist, color, rot = 0) =>
  Array.from({ length: n }, (_, i) =>
    `<ellipse cx="0" cy="${-dist}" rx="${rx}" ry="${ry}" fill="${color}" transform="rotate(${rot + (360 / n) * i})"/>`
  ).join('')

const subjects = {
  maple: (r) => {
    const lobes = [0, 52, -52, 104, -104].map((a, i) => {
      const len = i === 0 ? 250 : i < 3 ? 220 : 150
      return `<path d="M0 0 L${-55} ${-len * 0.55} L0 ${-len} L55 ${-len * 0.55} Z" transform="rotate(${a})"/>`
    }).join('')
    return `<g transform="translate(400 470) rotate(${-10 + r() * 20})" fill="#C4472B" stroke="#8E2C18" stroke-width="6" stroke-linejoin="round">${lobes}
      <path d="M0 0 L0 220" stroke="#7A3B1C" stroke-width="12"/></g>`
  },
  ginkgo: () =>
    `<g transform="translate(400 520) rotate(-15)">
      <path d="M0 0 C-60 -40 -250 -120 -230 -260 C-120 -330 120 -330 230 -260 C250 -120 60 -40 0 0 Z" fill="#E7B62F" stroke="#B5871A" stroke-width="6"/>
      <path d="M0 -330 L0 -250" stroke="#C99A20" stroke-width="10"/>
      ${Array.from({ length: 11 }, (_, i) => `<path d="M0 0 L${-200 + i * 40} -280" stroke="#C99A20" stroke-width="3" opacity=".6"/>`).join('')}
      <path d="M0 0 L10 220" stroke="#8C6A1F" stroke-width="10"/></g>`,
  dandelion: () =>
    `<g transform="translate(400 380)"><path d="M0 60 C10 200 -10 300 0 420" stroke="#6E8A3A" stroke-width="14" fill="none"/>
      ${petals(24, 22, 95, 90, '#F2C230')}${petals(18, 16, 60, 55, '#F7D64A', 10)}<circle r="40" fill="#E9A91E"/></g>`,
  hydrangea: (r) =>
    `<g transform="translate(400 400)">${Array.from({ length: 34 }, () => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 230
      const hue = ['#7C8FD6', '#9A86D0', '#6FA2DA', '#B39BDB'][Math.floor(r() * 4)]
      return `<g transform="translate(${(Math.cos(a) * d).toFixed(0)} ${(Math.sin(a) * d).toFixed(0)}) rotate(${(r() * 90).toFixed(0)})">${petals(4, 22, 30, 26, hue)}<circle r="8" fill="#F4F0FF"/></g>`
    }).join('')}</g>`,
  cosmos: () =>
    `<g transform="translate(400 390)"><path d="M0 80 C-20 220 20 300 0 430" stroke="#5F7D33" stroke-width="10" fill="none"/>
      ${petals(8, 62, 135, 140, '#E58FB2')}${petals(8, 30, 90, 110, '#F3B6CF', 22)}<circle r="52" fill="#F0B62A"/><circle r="30" fill="#D9921A"/></g>`,
  horsetail: (r) =>
    Array.from({ length: 5 }, (_, i) => {
      const x = 180 + i * 110 + r() * 30, h = 420 + r() * 200
      const segs = Array.from({ length: 9 }, (_, j) => `<rect x="-9" y="${-j * (h / 9)}" width="18" height="${h / 9 - 6}" rx="6" fill="#6F9A3C"/><rect x="-11" y="${-j * (h / 9) - 6}" width="22" height="6" fill="#3E5A20"/>`).join('')
      const whorls = Array.from({ length: 6 }, (_, j) => `<path d="M0 ${-60 - j * (h / 8)} l-90 50 M0 ${-60 - j * (h / 8)} l90 50" stroke="#86AE50" stroke-width="5"/>`).join('')
      return `<g transform="translate(${x.toFixed(0)} 800)">${whorls}${segs}</g>`
    }).join(''),
  mint: () =>
    `<g transform="translate(400 430)"><path d="M0 0 L0 370" stroke="#4E7A33" stroke-width="16"/>
      ${[[-1, 0], [1, 0], [-1, -170], [1, -170], [-1, 160], [1, 160]].map(([s, y]) =>
        `<path d="M0 ${y} C${s * 60} ${y - 80} ${s * 230} ${y - 60} ${s * 260} ${y + 10} C${s * 200} ${y + 70} ${s * 70} ${y + 60} 0 ${y} Z" fill="#7DB35A" stroke="#4E7A33" stroke-width="5"/>`).join('')}
      <path d="M0 -170 C-30 -260 30 -260 0 -170" fill="#94C66E"/></g>`,
  flyagaric: () =>
    `<g transform="translate(400 470)"><path d="M-55 0 C-70 150 -60 250 -80 300 L80 300 C60 250 70 150 55 0 Z" fill="#F4EBD9" stroke="#C9B998" stroke-width="5"/>
      <path d="M-70 80 C-20 110 20 110 70 80 L65 105 C20 130 -20 130 -65 105 Z" fill="#E6D8BC"/>
      <path d="M-280 20 C-260 -230 260 -230 280 20 C150 60 -150 60 -280 20 Z" fill="#D2362A" stroke="#9A2219" stroke-width="6"/>
      ${[[-150, -60, 26], [-40, -130, 30], [80, -100, 22], [170, -20, 24], [-200, 0, 16], [10, -40, 18], [120, -170, 14]].map(([x, y, s]) => `<ellipse cx="${x}" cy="${y}" rx="${s}" ry="${s * 0.8}" fill="#FFF7EA"/>`).join('')}
      <path d="M-400 300 C-200 270 200 280 400 300 L400 330 L-400 330 Z" fill="#5C4A2E"/></g>`,
  turkeytail: () =>
    `<rect x="0" y="420" width="800" height="380" fill="#6B5232"/><path d="M0 420 C200 400 600 440 800 410" stroke="#4E3A22" stroke-width="18" fill="none"/>
      ${[[250, 470, 1.1], [520, 450, 0.9], [390, 560, 0.8]].map(([x, y, s]) =>
        `<g transform="translate(${x} ${y}) scale(${s})">${['#5B3A22', '#B57B45', '#3D3A3A', '#D9B88A', '#7A5A3A', '#EFE3CC'].map((c, i) =>
          `<path d="M${-200 + i * 28} 0 A${200 - i * 28} ${170 - i * 24} 0 0 1 ${200 - i * 28} 0 Z" fill="${c}"/>`).join('')}</g>`).join('')}
`,
  ladybird: () =>
    `<g transform="translate(400 430) rotate(-20)">
      <path d="M-330 60 C-200 -150 200 -170 340 40 C200 200 -200 210 -330 60 Z" fill="#7CAB4A" stroke="#4E7A2B" stroke-width="6"/>
      <path d="M-330 60 L340 40" stroke="#4E7A2B" stroke-width="5"/>
      <ellipse cx="0" cy="20" rx="120" ry="100" fill="#D3302A" stroke="#3A1A12" stroke-width="5"/>
      <path d="M0 -80 L0 120" stroke="#2A1610" stroke-width="6"/>
      <ellipse cx="0" cy="-85" rx="55" ry="35" fill="#2A1610"/>
      <ellipse cx="-22" cy="-92" rx="12" ry="9" fill="#F5EFE4"/><ellipse cx="22" cy="-92" rx="12" ry="9" fill="#F5EFE4"/>
      ${[[-55, -10], [55, -10], [-70, 60], [70, 60], [-30, 100], [30, 100], [0, -40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18" fill="#2A1610"/>`).join('')}</g>`,
  swallowtail: () =>
    `<g transform="translate(400 400) rotate(8)">
      ${[-1, 1].map((s) => `<path d="M0 -20 C${s * 120} -260 ${s * 330} -230 ${s * 310} -80 C${s * 290} 0 ${s * 150} 10 0 0 Z" fill="#F2D35B" stroke="#2A2218" stroke-width="10"/>
        <path d="M0 10 C${s * 140} 20 ${s * 250} 100 ${s * 200} 190 L${s * 190} 260 L${s * 150} 200 C${s * 90} 220 ${s * 30} 120 0 30 Z" fill="#F2D35B" stroke="#2A2218" stroke-width="10"/>
        <path d="M${s * 40} -60 L${s * 260} -150 M${s * 60} -20 L${s * 290} -60" stroke="#2A2218" stroke-width="14"/>
        <circle cx="${s * 150}" cy="170" r="16" fill="#3B6BC5"/><circle cx="${s * 120}" cy="190" r="12" fill="#D1452E"/>`).join('')}
      <ellipse cx="0" cy="20" rx="14" ry="110" fill="#2A2218"/>
      <path d="M-5 -85 C-30 -150 -50 -170 -70 -180 M5 -85 C30 -150 50 -170 70 -180" stroke="#2A2218" stroke-width="5" fill="none"/></g>`,
  acorn: () =>
    `<g transform="translate(400 450)">${[[-120, 30, -18], [110, 10, 14], [0, -40, 0]].map(([x, y, a]) =>
      `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-75 -10 C-80 120 -20 190 0 200 C20 190 80 120 75 -10 Z" fill="#B87B3D" stroke="#7A4D22" stroke-width="5"/>
        <path d="M-95 -10 C-95 -100 95 -100 95 -10 Z" fill="#8A6A44" stroke="#5A4128" stroke-width="5"/>
        ${Array.from({ length: 5 }, (_, i) => `<path d="M${-80 + i * 40} -20 l20 -30" stroke="#5A4128" stroke-width="4"/>`).join('')}
        <path d="M0 -80 L6 -120" stroke="#5A4128" stroke-width="10"/></g>`).join('')}</g>`,
  feather: () =>
    `<g transform="translate(400 420) rotate(-35)">
      <path d="M0 -330 C120 -200 110 120 0 300 C-110 120 -120 -200 0 -330 Z" fill="#E9E3D6" stroke="#9C9384" stroke-width="5"/>
      ${Array.from({ length: 16 }, (_, i) => `<path d="M0 ${-280 + i * 34} C40 ${-300 + i * 34} 80 ${-290 + i * 34} 100 ${-300 + i * 34} M0 ${-280 + i * 34} C-40 ${-300 + i * 34} -80 ${-290 + i * 34} -100 ${-300 + i * 34}" stroke="#B9B0A0" stroke-width="3" fill="none"/>`).join('')}
      <path d="M0 -320 L0 380" stroke="#6E6658" stroke-width="7"/>
      <path d="M-60 -60 C-20 -80 20 -80 60 -60" stroke="#566B8E" stroke-width="22" opacity=".7" fill="none"/></g>`,
  moss: (r) =>
    `<rect x="0" y="0" width="800" height="800" fill="#9C9486"/>
      ${Array.from({ length: 7 }, (_, i) => `<path d="M0 ${110 * i + 40} L800 ${110 * i + 50}" stroke="#857D70" stroke-width="6"/>`).join('')}
      ${Array.from({ length: 260 }, () => {
        const x = 120 + r() * 560, y = 160 + r() * 520
        return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(8 + r() * 20).toFixed(0)}" fill="${['#5E8B2E', '#76A33C', '#4C7424', '#8DB851'][Math.floor(r() * 4)]}"/>`
      }).join('')}`,
}

const SCENES = [
  ['maple', '#F3D9B5', '#D9A877'],
  ['ginkgo', '#F6E7C1', '#E2C27A'],
  ['dandelion', '#DCEBC2', '#9FBF6A'],
  ['hydrangea', '#D9E4D0', '#8FA97A'],
  ['cosmos', '#E9EFD8', '#A8BF7A'],
  ['horsetail', '#E3ECCF', '#B3C68D'],
  ['mint', '#E7EDD8', '#B9C99A'],
  ['flyagaric', '#C9B590', '#6E5B3B'],
  ['turkeytail', '#B9A889', '#7F6A49'],
  ['ladybird', '#E6EDCF', '#AFC487'],
  ['swallowtail', '#DDEBD0', '#93B37A'],
  ['acorn', '#E8D7B6', '#B99668'],
  ['feather', '#E9E2D2', '#BDAE90'],
  ['moss', '#B8B0A2', '#8F887B'],
]

SCENES.forEach(([name, top, bottom], i) => {
  const rand = rng(i * 7919 + 17)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">${backdrop(i, top, bottom, rand)}${subjects[name](rand)}${vignette(i)}</svg>\n`
  writeFileSync(new URL(`${name}.svg`, OUT), svg)
})
console.log(`generated ${SCENES.length} images in public/demo/`)
