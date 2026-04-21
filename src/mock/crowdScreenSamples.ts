/**
 * 모바일 CrowdScreen 시연용 정적 데이터.
 * 실제 서울 열린데이터광장·기상청 API와 연결되어 있지 않습니다.
 */

export const CROWD_DATA_SAMPLE: Record<
  string,
  { hour: string; level: number; label: string }[]
> = {
  botanical: [
    { hour: "09", level: 12, label: "9시" },
    { hour: "10", level: 22, label: "10시" },
    { hour: "11", level: 44, label: "11시" },
    { hour: "12", level: 68, label: "12시" },
    { hour: "13", level: 82, label: "13시" },
    { hour: "14", level: 78, label: "14시" },
    { hour: "15", level: 72, label: "15시" },
    { hour: "16", level: 58, label: "16시" },
    { hour: "17", level: 42, label: "17시" },
    { hour: "18", level: 26, label: "18시" },
    { hour: "19", level: 14, label: "19시" },
  ],
  museum: [
    { hour: "10", level: 18, label: "10시" },
    { hour: "11", level: 32, label: "11시" },
    { hour: "12", level: 54, label: "12시" },
    { hour: "13", level: 76, label: "13시" },
    { hour: "14", level: 88, label: "14시" },
    { hour: "15", level: 84, label: "15시" },
    { hour: "16", level: 72, label: "16시" },
    { hour: "17", level: 58, label: "17시" },
    { hour: "18", level: 40, label: "18시" },
    { hour: "19", level: 28, label: "19시" },
    { hour: "20", level: 18, label: "20시" },
  ],
  palace: [
    { hour: "09", level: 18, label: "9시" },
    { hour: "10", level: 34, label: "10시" },
    { hour: "11", level: 60, label: "11시" },
    { hour: "12", level: 88, label: "12시" },
    { hour: "13", level: 95, label: "13시" },
    { hour: "14", level: 90, label: "14시" },
    { hour: "15", level: 75, label: "15시" },
    { hour: "16", level: 56, label: "16시" },
    { hour: "17", level: 36, label: "17시" },
    { hour: "18", level: 20, label: "18시" },
  ],
}

export const BEST_TIME_SAMPLE: Record<string, { time: string; reason: string }> = {
  botanical: { time: "09:00 – 10:30", reason: "개장 직후로 혼잡도 낮고, 온실 쾌적" },
  museum: { time: "10:00 – 11:30", reason: "개관 직후 한산, 조용한 관람 가능" },
  palace: { time: "09:00 – 10:30", reason: "개장 직후 외국인 관광객 적고 입장 대기 없음" },
}
