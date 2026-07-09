import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "@/routes/AppRoutes"; // Update this path to your actual AppRoutes file
import React from "react";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-right" closeButton />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;