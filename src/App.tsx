import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
// Use explicit file extensions to avoid Vite picking the wrong file when both .jsx and .tsx exist.
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.jsx";
import ScanResults from "./pages/ScanResults.tsx";
import ScanHistory from "./pages/ScanHistory.tsx";
import Stats from "./pages/Stats.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/scanner" element={<Navigate to="/" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/scan-results" element={<ScanResults />} />
            <Route path="/results" element={<Navigate to="/scan-results" replace />} />
            <Route path="/scan-history" element={<ScanHistory />} />
            <Route path="/history" element={<Navigate to="/scan-history" replace />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/statistics" element={<Navigate to="/stats" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
