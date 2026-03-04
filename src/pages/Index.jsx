import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ScanConfig } from "@/components/ScanConfig";
import { ScanResults } from "@/components/ScanResults";
import { ScanHistory } from "@/components/ScanHistory";
import { StatsCards } from "@/components/StatsCards";
import { useToast } from "@/hooks/use-toast";
import { Shield, LogOut, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { mongodbAPI } from "@/utils/mongodb";

const Index = () => {
  const [session, setSession] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [totalScans, setTotalScans] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!session) {
    return null;
  }

  const handleStartScan = async (config) => {
    setIsScanning(true);
    setVulnerabilities([]);
    setTotalScans((prev) => prev + 1);

    toast({
      title: "Scan Started",
      description: `Initiating security scan on ${config.targetUrl}`,
    });

    const startTime = Date.now();

    // Simulate scan - Replace this with actual API call to your Python backend
    // Example: await fetch('http://your-python-backend/api/scan', { method: 'POST', body: JSON.stringify(config) })
    setTimeout(async () => {
      // Mock results for demonstration
      const mockVulnerabilities = [
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

      const scanDuration = Math.floor((Date.now() - startTime) / 1000);
      const criticalCount = mockVulnerabilities.filter((v) => v.severity === "critical").length;
      const highCount = mockVulnerabilities.filter((v) => v.severity === "high").length;
      const mediumCount = mockVulnerabilities.filter((v) => v.severity === "medium").length;
      const lowCount = mockVulnerabilities.filter((v) => v.severity === "low").length;

      // Convert attack types to array for database
      const scanTypes = Object.entries(config.attackTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);

      // Save to MongoDB
      try {
        await mongodbAPI.createScanHistory({
          user_id: session.user.id,
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
        });
      } catch (error) {
        console.error("Error saving scan history:", error);
        toast({
          title: "Warning",
          description: "Scan completed but failed to save to database",
          variant: "destructive",
        });
      }

      toast({
        title: "Scan Complete",
        description: `Found ${mockVulnerabilities.length} potential vulnerabilities`,
        variant: mockVulnerabilities.length > 0 ? "destructive" : "default",
      });
    }, 5000);
  };

  const criticalCount = vulnerabilities.filter((v) => v.severity === "critical").length;

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
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{session.user.email}</span>
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
            activeScans={isScanning ? 1 : 0}
            vulnerabilitiesFound={vulnerabilities.length}
            criticalVulnerabilities={criticalCount}
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

