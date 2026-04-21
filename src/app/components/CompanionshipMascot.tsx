export function CompanionshipMascot() {
  return (
    <svg
      viewBox="0 0 360 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", maxWidth: "360px", margin: "0 auto" }}
    >
      {/* Small character - Left side */}
      <g>
        {/* Small character left leg - back */}
        <path
          d="M60 215 L55 250 Q55 254 58 254 L64 254 Q67 254 67 250 L70 220"
          fill="#D4E8F0"
          stroke="#6B8FA3"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Small character right leg - front */}
        <path
          d="M85 220 L88 250 Q88 254 91 254 L97 254 Q100 254 100 250 L98 215"
          fill="#D4E8F0"
          stroke="#6B8FA3"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Small character body */}
        <ellipse cx="77" cy="185" rx="38" ry="50" fill="#E8F4F8" />
        <ellipse cx="77" cy="185" rx="38" ry="50" fill="none" stroke="#6B8FA3" strokeWidth="2.5" />

        {/* Small character sash */}
        <path
          d="M45 165 Q52 167 77 169 Q102 167 109 165 L115 200 Q108 202 77 204 Q46 202 39 200 Z"
          fill="#B8E0ED"
          stroke="#6B8FA3"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Dashed line on small sash */}
        <line
          x1="52"
          y1="182"
          x2="62"
          y2="184"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="5 3"
        />
        <line
          x1="68"
          y1="185"
          x2="78"
          y2="187"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="5 3"
        />

        {/* Heart on small sash */}
        <path
          d="M92 188 Q92 186 93.5 186 Q95 186 95 187.5 Q95 186 96.5 186 Q98 186 98 188 Q98 190 95 191.5 Q92 190 92 188"
          fill="white"
        />

        {/* Small character head */}
        <circle cx="77" cy="130" r="42" fill="white" />
        <circle cx="77" cy="130" r="42" fill="none" stroke="#6B8FA3" strokeWidth="2.5" />

        {/* Head highlight */}
        <path
          d="M48 112 Q57 95 77 92 Q97 95 106 112"
          fill="#E8F4F8"
          opacity="0.7"
        />

        {/* Small character left eye */}
        <circle cx="65" cy="130" r="5.5" fill="#4A5F7A" />
        <circle cx="67" cy="128.5" r="2" fill="white" />

        {/* Small character right eye */}
        <circle cx="89" cy="130" r="5.5" fill="#4A5F7A" />
        <circle cx="91" cy="128.5" r="2" fill="white" />

        {/* Small character smile */}
        <path
          d="M68 145 Q77 150 86 145"
          stroke="#4A5F7A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Small character left arm */}
        <path
          d="M42 165 Q32 158 28 148"
          fill="none"
          stroke="#6B8FA3"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M42 165 Q32 158 28 148"
          fill="#D4E8F0"
          opacity="0.8"
        />
        <ellipse cx="27" cy="146" rx="8" ry="10" fill="#D4E8F0" />
        <ellipse cx="27" cy="146" rx="8" ry="10" fill="none" stroke="#6B8FA3" strokeWidth="2.5" />

        {/* Small character right arm - extended to hold hands */}
        <path
          d="M112 168 Q125 170 138 172"
          fill="none"
          stroke="#6B8FA3"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M112 168 L120 169 L138 172 L112 168"
          fill="#D4E8F0"
          opacity="0.8"
        />
        <ellipse cx="140" cy="173" rx="8" ry="10" fill="#D4E8F0" />
        <ellipse cx="140" cy="173" rx="8" ry="10" fill="none" stroke="#6B8FA3" strokeWidth="2.5" />
      </g>

      {/* Large character - Right side */}
      <g>
        {/* Large character left leg - back */}
        <path
          d="M225 240 L220 280 Q220 285 225 285 L233 285 Q238 285 238 280 L243 245"
          fill="#D4E8F0"
          stroke="#6B8FA3"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Large character right leg - front */}
        <path
          d="M260 245 L265 280 Q265 285 270 285 L278 285 Q283 285 283 280 L280 240"
          fill="#D4E8F0"
          stroke="#6B8FA3"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Large character body */}
        <ellipse cx="250" cy="195" rx="50" ry="65" fill="#E8F4F8" />
        <ellipse cx="250" cy="195" rx="50" ry="65" fill="none" stroke="#6B8FA3" strokeWidth="2.5" />

        {/* Large character sash */}
        <path
          d="M205 170 Q217 174 250 177 Q283 174 295 170 L305 220 Q293 224 250 227 Q207 224 195 220 Z"
          fill="#B8E0ED"
          stroke="#6B8FA3"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Dashed line on large sash */}
        <line
          x1="217"
          y1="195"
          x2="232"
          y2="197"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 4"
        />
        <line
          x1="240"
          y1="199"
          x2="255"
          y2="201"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 4"
        />

        {/* Heart on large sash */}
        <path
          d="M275 205 Q275 202 277 202 Q279 202 279 204 Q279 202 281 202 Q283 202 283 205 Q283 208 279 210 Q275 208 275 205"
          fill="white"
        />

        {/* Large character head */}
        <circle cx="250" cy="105" r="55" fill="white" />
        <circle cx="250" cy="105" r="55" fill="none" stroke="#6B8FA3" strokeWidth="2.5" />

        {/* Head highlight */}
        <path
          d="M210 83 Q223 63 250 60 Q277 63 290 83"
          fill="#E8F4F8"
          opacity="0.7"
        />

        {/* Large character left eye */}
        <circle cx="232" cy="105" r="7.5" fill="#4A5F7A" />
        <circle cx="235" cy="103" r="2.5" fill="white" />

        {/* Large character right eye */}
        <circle cx="268" cy="105" r="7.5" fill="#4A5F7A" />
        <circle cx="271" cy="103" r="2.5" fill="white" />

        {/* Large character smile */}
        <path
          d="M235 125 Q250 133 265 125"
          stroke="#4A5F7A"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Large character left arm - extended to hold hands */}
        <path
          d="M200 175 Q185 177 170 178"
          fill="none"
          stroke="#6B8FA3"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M200 175 L190 176 L170 178 L200 175"
          fill="#D4E8F0"
          opacity="0.8"
        />
        <ellipse cx="168" cy="179" rx="10" ry="12" fill="#D4E8F0" />
        <ellipse cx="168" cy="179" rx="10" ry="12" fill="none" stroke="#6B8FA3" strokeWidth="2.5" />

        {/* Large character right arm */}
        <path
          d="M300 178 Q315 175 322 168"
          fill="none"
          stroke="#6B8FA3"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M300 178 Q315 175 322 168"
          fill="#D4E8F0"
          opacity="0.8"
        />
        <ellipse cx="324" cy="166" rx="10" ry="12" fill="#D4E8F0" />
        <ellipse cx="324" cy="166" rx="10" ry="12" fill="none" stroke="#6B8FA3" strokeWidth="2.5" />
      </g>

      {/* Hand holding connection - subtle indicator */}
      <ellipse cx="154" cy="176" rx="16" ry="14" fill="#E8F4F8" opacity="0.6" />
      <circle cx="154" cy="176" r="3" fill="#B8E0ED" />
    </svg>
  );
}
