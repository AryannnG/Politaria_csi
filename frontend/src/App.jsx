import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import ProtectedRoute from "./components/routing/ProtectedRoute.jsx";
import CityReadyPage from "./pages/CityReadyPage.jsx";
import CitiesPage from "./pages/CitiesPage.jsx";
import CreateCityPage from "./pages/CreateCityPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

function SiteLayout() {
  return <AppShell><Outlet /></AppShell>;
}

export default function App() {
  return <Routes>
    <Route element={<SiteLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/cities" element={<CitiesPage />} />
        <Route path="/cities/new" element={<CreateCityPage />} />
      </Route>
    </Route>
    <Route path="/cities/:cityId" element={<ProtectedRoute><CityReadyPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
