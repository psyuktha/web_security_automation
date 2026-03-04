import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ScanConfig, ScanConfiguration } from "@/components/ScanConfig";
import { ScanResults, Vulnerability } from "@/components/ScanResults";
import { ScanHistory } from "@/components/ScanHistory";
import { StatsCards } from "@/components/StatsCards";
import { useToast } from "@/hooks/use-toast";
import { Shield, LogOut, User, BarChart3, History, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { computeScanStats } from "@/utils/scanStats";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const Index = () => {
  const { user, isAuthenticated, loading, signout, getAuthHeaders } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [activeScans, setActiveScans] = useState(0);
  const [vulnerabilitiesFound, setVulnerabilitiesFound] = useState(0);
  const [criticalVulnerabilities, setCriticalVulnerabilities] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("📊 Index component - Auth state:", { loading, isAuthenticated, user: user?.email });
    // Only redirect if we've finished loading and user is not authenticated
    if (!loading && !isAuthenticated) {
      console.log("🔄 Redirecting to /auth - user not authenticated");
      navigate("/auth", { replace: true });
    }
  }, [loading, isAuthenticated, navigate, user]);

  const refreshDashboardStats = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/scan-history/user/${user.id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch scan history");
      }

      const history = await response.json();
      const stats = computeScanStats(history);
      setTotalScans(stats.totalScans);
      setActiveScans(stats.activeScans);
      setVulnerabilitiesFound(stats.vulnerabilitiesFound);
      setCriticalVulnerabilities(stats.criticalVulnerabilities);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // keep existing values; don't block dashboard render
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshDashboardStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const handleLogout = () => {
    signout();
    navigate("/auth");
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect will happen via useEffect)
  // But also show a brief message to avoid blank screen
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleStartScan = async (config: ScanConfiguration) => {
    setIsScanning(true);
    setVulnerabilities([]);

    toast({
      title: "Scan Started",
      description: `Initiating security scan on ${config.targetUrl}. This may take a few minutes...`,
    });

    const startTime = Date.now();

    try {
      // Call real scan API
      const response = await fetch(`${API_URL}/scan/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          targetUrl: config.targetUrl,
          attackTypes: config.attackTypes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start scan");
      }

      const scanData = await response.json();
      const scanId = scanData.scanId;

      toast({
        title: "Scan Initiated",
        description: "Scan is running in the background. Results will appear when complete.",
      });

      // Poll for results
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${API_URL}/scan/status/${scanId}`, {
            headers: getAuthHeaders(),
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();

            if (statusData.status === "completed" && statusData.results) {
              clearInterval(pollInterval);
              setIsScanning(false);

              // Convert results to vulnerabilities format
              const formattedVulns = statusData.results.map((v: any, index: number) => ({
                id: `vuln-${index}`,
                type: v.type || "SQL Injection",
                severity: v.severity || "critical",
                endpoint: v.endpoint,
                description: v.description || `Vulnerability detected in ${v.endpoint}`,
                evidence: v.evidence || v.payload,
              }));

              setVulnerabilities(formattedVulns);

              // Save to localStorage for ScanResults page
              localStorage.setItem("current_scan_results", JSON.stringify(formattedVulns));

              // Refresh stats
              if (user) {
                refreshDashboardStats();
              }

              const scanDuration = Math.floor((Date.now() - startTime) / 1000);
              toast({
                title: "Scan Complete",
                description: `Found ${formattedVulns.length} vulnerabilities in ${scanDuration} seconds`,
                variant: formattedVulns.length > 0 ? "destructive" : "default",
              });
            }
          }
        } catch (error) {
          console.error("Error polling scan status:", error);
        }
      }, 5000); // Poll every 5 seconds

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isScanning) {
          setIsScanning(false);
          toast({
            title: "Scan Timeout",
            description: "Scan is taking longer than expected. Check scan history for results.",
            variant: "destructive",
          });
        }
      }, 600000); // 10 minutes
    } catch (error: any) {
      setIsScanning(false);
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to start scan",
        variant: "destructive",
      });
    }

      // Mock results for demonstration
      const mockVulnerabilities: Vulnerability[] = [
        {
          id: "1",
          type: "SQL Injection",
          severity: "critical",
          endpoint: `${config.targetUrl}/login`,
          description: "Potential SQL injection vulnerability detected in login form",
          evidence: "' OR 1=1 -- resulted in successful bypass",
        },
        {
          id: "2",
          type: "Cross-Site Scripting (XSS)",
          severity: "high",
          endpoint: `${config.targetUrl}/search`,
          description: "Reflected XSS vulnerability in search parameter",
          evidence: "<script>alert(1)</script> reflected in response",
        },
        {
          id: "3",
          type: "Command Injection",
          severity: "medium",
          endpoint: `${config.targetUrl}/api/ping`,
          description: "Possible command injection in ping utility",
          evidence: "System command execution suspected",
        },
      ];

      setVulnerabilities(mockVulnerabilities);
      setIsScanning(false);

      // Save vulnerabilities to localStorage for ScanResults page
      localStorage.setItem("current_scan_results", JSON.stringify(mockVulnerabilities));

      const scanDuration = Math.floor((Date.now() - startTime) / 1000);
      const criticalCount = mockVulnerabilities.filter((v) => v.severity === "critical").length;
      const highCount = mockVulnerabilities.filter((v) => v.severity === "high").length;
      const mediumCount = mockVulnerabilities.filter((v) => v.severity === "medium").length;
      const lowCount = mockVulnerabilities.filter((v) => v.severity === "low").length;

      // Convert attack types to array for database
      const scanTypes = Object.entries(config.attackTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      // Save to MongoDB via backend API
      try {
        const response = await fetch(`${API_URL}/scan-history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            target_url: config.targetUrl,
            scan_types: scanTypes,
            vulnerabilities_found: mockVulnerabilities.length,
            critical_count: criticalCount,
            high_count: highCount,
            medium_count: mediumCount,
            low_count: lowCount,
            scan_duration: scanDuration,
            status: "completed",
            results: mockVulnerabilities,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save scan history");
        }

        // Keep dashboard cards in sync with Stats page
        await refreshDashboardStats();
      } catch (error) {
        console.error("Error saving scan history:", error);
        toast({
          title: "Warning",
          description: "Scan completed but failed to save history",
          variant: "destructive",
        });
      }

      toast({
        title: "Scan Complete",
        description: `Found ${mockVulnerabilities.length} potential vulnerabilities`,
        variant: mockVulnerabilities.length > 0 ? "destructive" : "default",
      });
  };

  // NOTE: dashboard cards should match Stats page (history-based), not just current scan results.

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  RedTeam Security Scanner
                </h1>
                <p className="text-sm text-muted-foreground">
                  Automated Web Application Penetration Testing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/stats")}
                  title="View Statistics"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/scan-history")}
                  title="View Scan History"
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/scan-results")}
                  title="View Scan Results"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="animate-fade-in">
          <StatsCards
            totalScans={totalScans}
            activeScans={activeScans}
            vulnerabilitiesFound={vulnerabilitiesFound}
            criticalVulnerabilities={criticalVulnerabilities}
          />
        </div>

        <Tabs defaultValue="scanner" className="w-full animate-fade-in-up">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="scanner">Security Scanner</TabsTrigger>
            <TabsTrigger value="history">Scan History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scanner" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="animate-scale-in">
                <ScanConfig onStartScan={handleStartScan} isScanning={isScanning} />
              </div>
              <div className="animate-scale-in" style={{ animationDelay: "0.1s" }}>
                <ScanResults vulnerabilities={vulnerabilities} isScanning={isScanning} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6 animate-fade-in">
            <ScanHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
