import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { ClinicDataProvider } from "./context/ClinicDataProvider.jsx";
import { ToastProvider } from "./components/ToastProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ClinicDataProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ClinicDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
