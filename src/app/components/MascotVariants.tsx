/**
 * MascotVariants.tsx
 * 같이가능 부산 마스코트 포즈 변형 컴포넌트
 *
 * 디자인 토큰 (LoadingMascot와 동일):
 *   Head:   white fill, stroke #6B8FA3, strokeWidth 2.5
 *   Body:   #E8F4F8 fill
 *   Sash:   #B8E0ED fill
 *   Limbs:  #D4E8F0 fill
 *   Eyes:   #4A5F7A
 *   Accent: #5B54D6 (brand purple)
 */

import { type CSSProperties } from "react";
import travelCompleteMascotImg from "../../img/5.png";

type MascotProps = { style?: CSSProperties };

const S    = "#6B8FA3";
const SW   = 2.5;
const BODY = "#E8F4F8";
const SASH = "#B8E0ED";
const LIMB = "#D4E8F0";
const EYE  = "#4A5F7A";
const HLT  = "#E8F4F8";
const ACC  = "#5B54D6";

/* ────────────────────────────────────────────────────────────
   1. HAPPY / WELCOMING  — 한쪽 팔 들어 인사, 활짝 웃음
   ───────────────────────────────────────────────────────── */
export function HappyMascot({ style }: MascotProps) {
  return (
    <svg viewBox="0 0 220 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>

      {/* Legs */}
      <path d="M75 210 L74 254 Q74 260 79 260 L87 260 Q92 260 92 255 L93 214"
        fill={LIMB} stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M107 214 L108 255 Q108 260 113 260 L121 260 Q126 260 126 255 L125 210"
        fill={LIMB} stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>

      {/* Body */}
      <ellipse cx="100" cy="150" rx="50" ry="65" fill={BODY} stroke={S} strokeWidth={SW}/>

      {/* Sash */}
      <path d="M55 130 Q65 133 100 136 Q135 133 145 130 L153 175 Q143 178 100 181 Q57 178 47 175 Z"
        fill={SASH} stroke={S} strokeWidth={SW} strokeLinejoin="round"/>
      <line x1="65" y1="152" x2="77" y2="154" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4"/>
      <line x1="85" y1="155" x2="97" y2="157" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4"/>
      <path d="M125 160 Q125 157 127 157 Q129 157 129 159 Q129 157 131 157 Q133 157 133 160 Q133 163 129 165 Q125 163 125 160"
        fill="white"/>

      {/* Left arm — raised, waving */}
      <path d="M52 122 Q32 96 17 70" fill="none" stroke={S} strokeWidth={SW} strokeLinecap="round"/>
      <ellipse cx="13" cy="64" rx="12" ry="12" fill={LIMB} stroke={S} strokeWidth={SW}/>
      <path d="M5 56 Q9 51 13 56 Q17 51 21 56" stroke={S} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>

      {/* Right arm — relaxed */}
      <path d="M150 130 Q163 136 174 143" fill="none" stroke={S} strokeWidth={SW} strokeLinecap="round"/>
      <ellipse cx="177" cy="147" rx="10" ry="12" fill={LIMB} stroke={S} strokeWidth={SW}/>

      {/* Head */}
      <circle cx="100" cy="70" r="52" fill="white" stroke={S} strokeWidth={SW}/>
      <path d="M62 52 Q73 35 100 32 Q127 35 138 52" fill={HLT} opacity="0.7"/>

      {/* Rosy cheeks */}
      <ellipse cx="78"  cy="86" rx="9" ry="6" fill="#FFB6C1" opacity="0.4"/>
      <ellipse cx="122" cy="86" rx="9" ry="6" fill="#FFB6C1" opacity="0.4"/>

      {/* Happy crescent eyes */}
      <path d="M79 80 Q86 68 93 80 Z" fill={EYE}/>
      <circle cx="83" cy="78" r="2" fill="white" opacity="0.85"/>
      <path d="M107 80 Q114 68 121 80 Z" fill={EYE}/>
      <circle cx="111" cy="78" r="2" fill="white" opacity="0.85"/>

      {/* Big smile */}
      <path d="M82 91 Q100 108 118 91" stroke={EYE} strokeWidth={SW} fill="none" strokeLinecap="round"/>

      {/* Sparkles */}
      <path d="M156 44 L158 38 L160 44 L166 46 L160 48 L158 54 L156 48 L150 46 Z" fill={ACC} opacity="0.5"/>
      <path d="M30 38 L31.5 34 L33 38 L37 39.5 L33 41 L31.5 45 L30 41 L26 39.5 Z" fill={ACC} opacity="0.4"/>
      <circle cx="170" cy="25" r="3" fill={SASH} opacity="0.7"/>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   2. GUIDING / POINTING  — 오른팔 뻗어 가리키기, 눈 우향
   ───────────────────────────────────────────────────────── */
export function GuidingMascot({ style }: MascotProps) {
  return (
    <svg viewBox="0 0 250 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>

      {/* Legs */}
      <path d="M75 210 L74 254 Q74 260 79 260 L87 260 Q92 260 92 255 L93 214"
        fill={LIMB} stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M107 214 L108 255 Q108 260 113 260 L121 260 Q126 260 126 255 L125 210"
        fill={LIMB} stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>

      {/* Body */}
      <ellipse cx="100" cy="150" rx="50" ry="65" fill={BODY} stroke={S} strokeWidth={SW}/>

      {/* Sash */}
      <path d="M55 130 Q65 133 100 136 Q135 133 145 130 L153 175 Q143 178 100 181 Q57 178 47 175 Z"
        fill={SASH} stroke={S} strokeWidth={SW} strokeLinejoin="round"/>
      <line x1="65" y1="152" x2="77" y2="154" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4"/>
      <line x1="85" y1="155" x2="97" y2="157" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4"/>
      <path d="M125 160 Q125 157 127 157 Q129 157 129 159 Q129 157 131 157 Q133 157 133 160 Q133 163 129 165 Q125 163 125 160"
        fill="white"/>

      {/* Left arm — relaxed back */}
      <path d="M50 125 Q40 122 34 112" fill="none" stroke={S} strokeWidth={SW} strokeLinecap="round"/>
      <ellipse cx="32" cy="108" rx="10" ry="12" fill={LIMB} stroke={S} strokeWidth={SW}/>

      {/* Right arm — extended pointing right */}
      <path d="M150 128 Q170 126 190 124" fill="none" stroke={S} strokeWidth={SW} strokeLinecap="round"/>
      <ellipse cx="196" cy="123" rx="11" ry="11" fill={LIMB} stroke={S} strokeWidth={SW}/>
      <path d="M196 112 Q200 112 202 116 Q204 120 202 124 Q200 128 196 128"
        fill={LIMB} stroke={S} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Head */}
      <circle cx="100" cy="70" r="52" fill="white" stroke={S} strokeWidth={SW}/>
      <path d="M62 52 Q73 35 100 32 Q127 35 138 52" fill={HLT} opacity="0.7"/>

      {/* Eyes — looking right */}
      <circle cx="86" cy="73" r="7.5" fill={EYE}/>
      <circle cx="88.5" cy="75" r="2.5" fill="white"/>
      <circle cx="116" cy="73" r="7.5" fill={EYE}/>
      <circle cx="118.5" cy="75" r="2.5" fill="white"/>

      {/* Slight smile */}
      <path d="M88 92 Q100 100 112 92" stroke={EYE} strokeWidth={SW} fill="none" strokeLinecap="round"/>

      {/* Direction arrow */}
      <path d="M214 115 L228 123 L214 131"
        stroke={ACC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

      {/* Map pin */}
      <path d="M155 28 Q155 17 163 17 Q171 17 171 28 Q171 40 163 50 Q155 40 155 28 Z"
        fill={ACC} opacity="0.65"/>
      <circle cx="163" cy="28" r="4.5" fill="white"/>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   3. EXPLAINING  — 왼팔 검지 들고 설명, 클립보드 우측 보유
   ───────────────────────────────────────────────────────── */
export function ExplainingMascot({ style }: MascotProps) {
  return (
    <svg viewBox="0 0 230 290" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>

      {/* Legs */}
      <path d="M75 210 L74 254 Q74 260 79 260 L87 260 Q92 260 92 255 L93 214"
        fill={LIMB} stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M107 214 L108 255 Q108 260 113 260 L121 260 Q126 260 126 255 L125 210"
        fill={LIMB} stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>

      {/* Body */}
      <ellipse cx="100" cy="150" rx="50" ry="65" fill={BODY} stroke={S} strokeWidth={SW}/>

      {/* Sash */}
      <path d="M55 130 Q65 133 100 136 Q135 133 145 130 L153 175 Q143 178 100 181 Q57 178 47 175 Z"
        fill={SASH} stroke={S} strokeWidth={SW} strokeLinejoin="round"/>
      <line x1="65" y1="152" x2="77" y2="154" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4"/>
      <line x1="85" y1="155" x2="97" y2="157" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4"/>
      <path d="M125 160 Q125 157 127 157 Q129 157 129 159 Q129 157 131 157 Q133 157 133 160 Q133 163 129 165 Q125 163 125 160"
        fill="white"/>

      {/* Left arm — raised, index finger up */}
      <path d="M50 122 Q40 102 36 82" fill="none" stroke={S} strokeWidth={SW} strokeLinecap="round"/>
      <ellipse cx="34" cy="77" rx="11" ry="11" fill={LIMB} stroke={S} strokeWidth={SW}/>
      <path d="M30 68 Q34 57 38 68" fill={LIMB} stroke={S} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Right arm — holding clipboard */}
      <path d="M150 130 Q162 142 170 155" fill="none" stroke={S} strokeWidth={SW} strokeLinecap="round"/>
      <ellipse cx="173" cy="158" rx="10" ry="12" fill={LIMB} stroke={S} strokeWidth={SW}/>

      {/* Clipboard */}
      <rect x="158" y="161" width="42" height="52" rx="4" fill="white" stroke={S} strokeWidth="2"/>
      <rect x="163" y="156" width="16" height="9" rx="3" fill={LIMB} stroke={S} strokeWidth="1.5"/>
      <line x1="164" y1="175" x2="194" y2="175" stroke={S} strokeWidth="1.2" opacity="0.5"/>
      <line x1="164" y1="183" x2="194" y2="183" stroke={S} strokeWidth="1.2" opacity="0.5"/>
      <line x1="164" y1="191" x2="186" y2="191" stroke={S} strokeWidth="1.2" opacity="0.5"/>
      <path d="M164 207 L170 198 L178 203 L186 193 L192 196"
        stroke={ACC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="186" cy="193" r="2" fill={ACC}/>

      {/* Head */}
      <circle cx="100" cy="70" r="52" fill="white" stroke={S} strokeWidth={SW}/>
      <path d="M62 52 Q73 35 100 32 Q127 35 138 52" fill={HLT} opacity="0.7"/>

      {/* Eyes — forward, expressive */}
      <circle cx="85" cy="73" r="7.5" fill={EYE}/>
      <circle cx="87.5" cy="75" r="2.5" fill="white"/>
      <circle cx="115" cy="73" r="7.5" fill={EYE}/>
      <circle cx="117.5" cy="75" r="2.5" fill="white"/>

      {/* Open mouth (speaking) */}
      <ellipse cx="100" cy="94" rx="10" ry="6.5" fill={EYE}/>
      <ellipse cx="100" cy="93" rx="7" ry="4" fill="white" opacity="0.45"/>

      {/* Speech bubble */}
      <path d="M128 22 Q128 11 143 11 Q158 11 158 22 Q158 32 145 33 L140 41 L138 33 Q128 33 128 22 Z"
        fill={SASH} stroke={S} strokeWidth="1.5"/>
      <line x1="136" y1="19" x2="150" y2="19" stroke={S} strokeWidth="1.5" opacity="0.6"/>
      <line x1="136" y1="26" x2="148" y2="26" stroke={S} strokeWidth="1.5" opacity="0.6"/>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   4. WAITING / THINKING  — 턱에 손 대고 생각, 눈 위로 향함
   ───────────────────────────────────────────────────────── */
export function WaitingMascot({ style }: MascotProps) {
  return (
    <svg viewBox="0 0 220 290" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>

      {/* Legs */}
      <path d="M75 210 L74 254 Q74 260 79 260 L87 260 Q92 260 92 255 L93 214"
        fill={LIMB} stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M107 214 L108 255 Q108 260 113 260 L121 260 Q126 260 126 255 L125 210"
        fill={LIMB} stroke={S} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round"/>

      {/* Body */}
      <ellipse cx="100" cy="150" rx="50" ry="65" fill={BODY} stroke={S} strokeWidth={SW}/>

      {/* Sash */}
      <path d="M55 130 Q65 133 100 136 Q135 133 145 130 L153 175 Q143 178 100 181 Q57 178 47 175 Z"
        fill={SASH} stroke={S} strokeWidth={SW} strokeLinejoin="round"/>
      <line x1="65" y1="152" x2="77" y2="154" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4"/>
      <line x1="85" y1="155" x2="97" y2="157" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4"/>
      <path d="M125 160 Q125 157 127 157 Q129 157 129 159 Q129 157 131 157 Q133 157 133 160 Q133 163 129 165 Q125 163 125 160"
        fill="white"/>

      {/* Left arm — hanging naturally */}
      <path d="M50 126 Q43 133 40 144" fill="none" stroke={S} strokeWidth={SW} strokeLinecap="round"/>
      <ellipse cx="38" cy="149" rx="10" ry="11" fill={LIMB} stroke={S} strokeWidth={SW}/>

      {/* Right arm — bent up to chin */}
      <path d="M148 128 Q142 113 127 104" fill="none" stroke={S} strokeWidth={SW} strokeLinecap="round"/>
      <ellipse cx="122" cy="100" rx="12" ry="11" fill={LIMB} stroke={S} strokeWidth={SW}/>

      {/* Head */}
      <circle cx="100" cy="70" r="52" fill="white" stroke={S} strokeWidth={SW}/>
      <path d="M62 52 Q73 35 100 32 Q127 35 138 52" fill={HLT} opacity="0.7"/>

      {/* Eyes — looking up-left (thinking) */}
      <circle cx="85" cy="73" r="7.5" fill={EYE}/>
      <circle cx="83" cy="70" r="2.5" fill="white"/>
      <circle cx="115" cy="73" r="7.5" fill={EYE}/>
      <circle cx="113" cy="70" r="2.5" fill="white"/>

      {/* Hmm mouth */}
      <path d="M88 93 Q94 90 100 93 Q106 90 112 93"
        stroke={EYE} strokeWidth={SW} fill="none" strokeLinecap="round"/>

      {/* Thought bubbles */}
      <circle cx="148" cy="44" r="8"   fill="white" stroke={S} strokeWidth="1.5" opacity="0.85"/>
      <circle cx="160" cy="29" r="5.5" fill="white" stroke={S} strokeWidth="1.5" opacity="0.75"/>
      <circle cx="168" cy="17" r="4"   fill="white" stroke={S} strokeWidth="1.5" opacity="0.65"/>
      <circle cx="143" cy="54" r="3"   fill="white" stroke={S} strokeWidth="1.5" opacity="0.55"/>
      {/* "?" via path */}
      <path d="M145 40 Q145 35 150 35 Q155 35 155 40 Q155 44 150 45 L150 47"
        stroke={S} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="150" cy="50" r="1.2" fill={S}/>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   5. CELEBRATION — 여행 완주 · src/img/5.png (웹·앱 공통 에셋)
   ───────────────────────────────────────────────────────── */
export function CelebrationMascot({ style }: MascotProps) {
  return (
    <img
      src={travelCompleteMascotImg}
      alt=""
      draggable={false}
      style={{
        objectFit: "contain",
        display: "block",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

/* ────────────────────────────────────────────────────────────
   Preview showcase (optional — for design review)
   ───────────────────────────────────────────────────────── */
export function MascotShowcase() {
  const poses = [
    { name: "반가워요!",  node: <HappyMascot    style={{ width: 140, height: "auto" }} /> },
    { name: "이쪽이에요", node: <GuidingMascot   style={{ width: 140, height: "auto" }} /> },
    { name: "설명할게요", node: <ExplainingMascot style={{ width: 140, height: "auto" }} /> },
    { name: "생각 중...", node: <WaitingMascot    style={{ width: 140, height: "auto" }} /> },
    { name: "완료!",     node: <CelebrationMascot style={{ width: 140, height: "auto" }} /> },
  ];

  return (
    <div style={{
      display: "flex", gap: 24, flexWrap: "wrap",
      justifyContent: "center", padding: 32,
      background: "#F6F7FB", minHeight: "100vh",
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      {poses.map(({ name, node }) => (
        <div key={name} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          background: "white", borderRadius: 20, padding: "24px 20px",
          boxShadow: "0 4px 20px rgba(91,84,214,0.08)",
          border: "1.5px solid #EEEDFA",
          width: 180,
        }}>
          {node}
          <span style={{ fontSize: 13, fontWeight: 700, color: "#5B54D6" }}>{name}</span>
        </div>
      ))}
    </div>
  );
}
