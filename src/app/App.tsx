import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider } from "./context/AppContext";
import { I18nProvider } from "./i18n/I18nContext";

export default function App() {
  return (
    <I18nProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </I18nProvider>
  );
}