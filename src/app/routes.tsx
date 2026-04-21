import { createBrowserRouter, Navigate } from "react-router";
import { AppRoot, MobileRoot } from "./components/Root";
import { EntryScreen }          from "./components/EntryScreen";
import { OnboardingScreen }     from "./components/OnboardingScreen";
import { ConditionScreen }      from "./components/ConditionScreen";
import { RecommendationScreen } from "./components/RecommendationScreen";
import { CourseFlowScreen }     from "./components/CourseFlowScreen";
import { DetailScreen }         from "./components/DetailScreen";
import { AlternativeScreen }    from "./components/AlternativeScreen";
import { SmartRecommendScreen } from "./components/SmartRecommendScreen";
import { MapScreen }            from "./components/MapScreen";
import { CrowdScreen }          from "./components/CrowdScreen";
import { AccessibilityReportScreen } from "./components/AccessibilityReportScreen";
import { CostScreen }           from "./components/CostScreen";
import { SafetyScreen }         from "./components/SafetyScreen";
import { PlaceDetailScreen }    from "./components/PlaceDetailScreen";

import { ComparisonScreen } from "./components/ComparisonScreen";
import { FeasibilityScreen } from "./components/FeasibilityScreen";
import { ExecutionScreen } from "./components/ExecutionScreen";
import { TourApiTestScreen } from "./components/TourApiTestScreen";

// Desktop flow
import { DesktopRoot }          from "./components/desktop/DesktopRoot";
import { OnboardingPage }       from "./components/desktop/OnboardingPage";
import { ConditionsPage }       from "./components/desktop/ConditionsPage";
import { GeneratingPage }       from "./components/desktop/GeneratingPage";
import { ResultsPage }          from "./components/desktop/ResultsPage";
import { CourseDetailPage }     from "./components/desktop/CourseDetailPage";
import { TimelinePage }         from "./components/desktop/TimelinePage";
import { MapPage }              from "./components/desktop/MapPage";
import { LivePage }             from "./components/desktop/LivePage";
import { DeparturePage }        from "./components/desktop/DeparturePage";
import { DesktopComparisonPage } from "./components/desktop/DesktopComparisonPage";
import { DesktopFeasibilityPage } from "./components/desktop/DesktopFeasibilityPage";
import { TourLeafletDevPage } from "./components/desktop/TourLeafletDevPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppRoot,
    children: [
      { index: true, Component: EntryScreen },

      /* ── Mobile flow ── */
      {
        path: "mobile",
        Component: MobileRoot,
        children: [
          { index: true,                    Component: OnboardingScreen },
          { path: "conditions",             Component: ConditionScreen },
          { path: "smart",                  Component: SmartRecommendScreen },
          { path: "recommendations",        Component: RecommendationScreen },
          { path: "detail/:id",             Component: DetailScreen },
          { path: "course/:id",             Component: CourseFlowScreen },
          { path: "alternatives/:id",       Component: AlternativeScreen },
          { path: "map/:id",                Component: MapScreen },
          { path: "crowd/:id",              Component: CrowdScreen },
          { path: "accessibility/:id",      Component: AccessibilityReportScreen },
          { path: "cost/:id",               Component: CostScreen },
          { path: "safety/:id",             Component: SafetyScreen },
          { path: "place/:id/:step",        Component: PlaceDetailScreen },
          { path: "compare",                Component: ComparisonScreen },
          { path: "feasibility/:id",        Component: FeasibilityScreen },
          { path: "execution/:id",          Component: ExecutionScreen },
          { path: "tour-debug",             Component: TourApiTestScreen },
        ],
      },

      /* ── Desktop flow ── */
      {
        path: "desktop",
        Component: DesktopRoot,
        children: [
          { path: "onboarding",             Component: OnboardingPage },
          { path: "conditions",             Component: ConditionsPage },
          { path: "generating",             Component: GeneratingPage },
          { path: "results",                Component: ResultsPage },
          { path: "course/:id",             Component: CourseDetailPage },
          { path: "course",                 Component: () => <Navigate to="/desktop/results" replace /> },
          { path: "timeline/:id",           Component: TimelinePage },
          { path: "map/:id",                Component: MapPage },
          { path: "live/:id",               Component: LivePage },
          { path: "execution/:id",          Component: ExecutionScreen },
          { path: "departure/:id",          Component: DeparturePage },
          { path: "departure",              Component: () => <Navigate to="/desktop/results" replace /> },
          { path: "compare",                Component: DesktopComparisonPage },
          { path: "feasibility/:id",        Component: DesktopFeasibilityPage },
          { path: "tour-map-dev",           Component: TourLeafletDevPage },
          { path: "kakao-map",              Component: () => <Navigate to="/desktop/tour-map-dev" replace /> },
        ],
      },
    ],
  },
]);