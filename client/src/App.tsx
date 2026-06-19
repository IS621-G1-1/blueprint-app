import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Home } from "@/pages/Home";
import { LoginPage } from "@/pages/LoginPage";
import { Planner } from "@/pages/Planner";
import { Profile } from "@/pages/Profile";
import { RegisterPage } from "@/pages/RegisterPage";
import { Timetable } from "@/pages/Timetable";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";
import { Watchlist } from "@/pages/Watchlist";

function DefaultRedirect() {
  const token = localStorage.getItem("blueprint_token");

  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}
