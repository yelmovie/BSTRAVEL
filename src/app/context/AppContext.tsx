import React, { createContext, useContext, useState } from "react";

export type ViewMode = "mobile" | "desktop";
export type BudgetLevel = "economy" | "moderate" | "generous";
export type IndoorPref  = "indoor" | "mixed" | "outdoor";

// ── Legacy companion types (kept for RecommendationScreen etc.) ──
export interface CompanionDetail {
  type: string;
  count: number;
  ageGroup: "adult" | "child";
}

// ── Newer structured group composition ──
export interface GroupComposition {
  adult: number;
  elementary: number;
  preschool: number;
  elderly: number;
}

export interface SupportOptions {
  stroller: number;
  wheelchair: number;
  foreignLanguage: boolean;
}

// ── Accessibility filter IDs ──
export const ACCESSIBILITY_FILTER_LIST = [
  { id: "ramp",              label: "경사로",      desc: "경사로·평지 동선" },
  { id: "elevator",          label: "엘리베이터",   desc: "층간 이동 필수" },
  { id: "accessible_restroom", label: "장애인화장실", desc: "무장애 화장실" },
  { id: "stroller_friendly", label: "유모차 진입",   desc: "넓은 통로·단차 없음" },
  { id: "indoor",            label: "실내 위주",    desc: "날씨 무관 코스" },
  { id: "short_walk",        label: "단거리 이동",   desc: "총 3km 이내" },
  { id: "rest_area",         label: "휴게 공간",    desc: "중간 쉼터 포함" },
  { id: "parking",           label: "주차 가능",    desc: "주차장 완비" },
] as const;

interface AppContextType {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;

  // Legacy companion fields
  companions: string[];
  setCompanions: (c: string[]) => void;
  companionDetails: CompanionDetail[];
  setCompanionDetails: (d: CompanionDetail[]) => void;

  // Structured group composition (ConditionScreen)
  groupComposition: GroupComposition;
  setGroupComposition: (g: GroupComposition) => void;
  supportOptions: SupportOptions;
  setSupportOptions: (s: SupportOptions) => void;

  // Travel conditions
  travelTime: string;
  setTravelTime: (t: string) => void;
  walkingDifficulty: number;
  setWalkingDifficulty: (d: number) => void;
  transportType: string;
  setTransportType: (t: string) => void;

  // Departure time (actual clock time, e.g. "09:00")
  departureTime: string;
  setDepartureTime: (t: string) => void;

  // Budget & indoor pref (unified — previously desktop-only)
  budget: BudgetLevel;
  setBudget: (b: BudgetLevel) => void;
  indoorPref: IndoorPref;
  setIndoorPref: (p: IndoorPref) => void;

  // Travel purpose (multi-select, unified — previously desktop-only)
  purpose: string[];
  setPurpose: (p: string[]) => void;
  togglePurpose: (p: string) => void;

  // Accessibility filters
  accessibilityFilters: string[];
  toggleAccessibilityFilter: (id: string) => void;
  setAccessibilityFilters: (ids: string[]) => void;

  // Region
  region: string;
  setRegion: (r: string) => void;

  // Busan area (시범 서비스 지역 부산)
  busanArea: string;
  setBusanArea: (a: string) => void;

  // Selected course
  selectedCourse: string;
  setSelectedCourse: (id: string) => void;

  // Comparison
  selectedForComparison: string[];
  setSelectedForComparison: (ids: string[]) => void;
  toggleComparisonSelection: (id: string) => void;

  // Saved courses
  savedCourses: string[];
  toggleSavedCourse: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("mobile");

  // Legacy
  const [companions, setCompanions] = useState<string[]>([]);
  const [companionDetails, setCompanionDetails] = useState<CompanionDetail[]>([]);

  // Structured
  const [groupComposition, setGroupComposition] = useState<GroupComposition>({
    adult: 0,
    elementary: 0,
    preschool: 0,
    elderly: 0,
  });
  const [supportOptions, setSupportOptions] = useState<SupportOptions>({
    stroller: 0,
    wheelchair: 0,
    foreignLanguage: false,
  });

  // Travel conditions
  const [travelTime, setTravelTime] = useState("half");
  const [walkingDifficulty, setWalkingDifficulty] = useState(2);
  const [transportType, setTransportType] = useState("transit");

  // Departure time
  const [departureTime, setDepartureTime] = useState("09:00");

  // Budget & indoor pref (formerly desktop-only)
  const [budget, setBudget] = useState<BudgetLevel>("moderate");
  const [indoorPref, setIndoorPref] = useState<IndoorPref>("mixed");

  // Travel purpose
  const [purpose, setPurpose] = useState<string[]>([]);
  const togglePurpose = (p: string) =>
    setPurpose((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  // Accessibility filters
  const [accessibilityFilters, setAccessibilityFilters] = useState<string[]>([]);
  const toggleAccessibilityFilter = (id: string) =>
    setAccessibilityFilters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // Region
  const [region, setRegion] = useState("seoul-all");

  // Busan area (시범 서비스 지역 부산)
  const [busanArea, setBusanArea] = useState("busan-all");

  // Course
  const [selectedCourse, setSelectedCourse] = useState("haeundae");

  // Comparison
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([
    "haeundae",
    "gamcheon",
    "citizenpark",
  ]);

  const toggleComparisonSelection = (id: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev;
        return prev.filter((x) => x !== id);
      } else {
        if (prev.length >= 3) return prev;
        return [...prev, id];
      }
    });
  };

  // Saved courses
  const [savedCourses, setSavedCourses] = useState<string[]>([]);
  const toggleSavedCourse = (id: string) =>
    setSavedCourses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <AppContext.Provider
      value={{
        viewMode,
        setViewMode,
        companions,
        setCompanions,
        companionDetails,
        setCompanionDetails,
        groupComposition,
        setGroupComposition,
        supportOptions,
        setSupportOptions,
        travelTime,
        setTravelTime,
        walkingDifficulty,
        setWalkingDifficulty,
        transportType,
        setTransportType,
        departureTime,
        setDepartureTime,
        budget,
        setBudget,
        indoorPref,
        setIndoorPref,
        purpose,
        setPurpose,
        togglePurpose,
        accessibilityFilters,
        toggleAccessibilityFilter,
        setAccessibilityFilters,
        region,
        setRegion,
        busanArea,
        setBusanArea,
        selectedCourse,
        setSelectedCourse,
        selectedForComparison,
        setSelectedForComparison,
        toggleComparisonSelection,
        savedCourses,
        toggleSavedCourse,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}