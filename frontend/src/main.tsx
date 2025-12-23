import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { store } from "./app/store";
import App from "./App";
import { ToastProvider } from "./contexts/ToastContext";
import { checkAuth } from "./features/auth/authSlice";
import "./styles/globals.css";

// Component to check auth on mount
const AuthChecker = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check authentication status when app loads
    dispatch(checkAuth());
  }, [dispatch]);

  return null;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <AuthChecker />
          <App />
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);


