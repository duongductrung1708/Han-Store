import { useLocation } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  // Nếu đang ở trang admin, không render Header và Footer
  if (isAdminPage) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <AppRoutes />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1 py-6 animate-in fade-in duration-500">
        <div className="container-page">
          <AppRoutes />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;


