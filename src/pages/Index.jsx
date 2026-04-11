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

    try {
      const response = await fetch("http://localhost:3001/api/scan/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(config)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to start scan");
      }

      const scanId = data.scanId;

      const pollScan = setInterval(async () => {
        try {
          const statusRes = await fetch(`http://localhost:3001/api/scan/status/${scanId}`, {
            headers: {
              "Authorization": `Bearer ${session.access_token}`
            }
          });
          const statusData = await statusRes.json();
          
          if (statusData.status === "completed" || statusData.status === "failed") {
            clearInterval(pollScan);
            setIsScanning(false);

            if (statusData.status === "completed") {
              const results = statusData.results || [];
              setVulnerabilities(results);
              
              toast({
                title: "Scan Complete",
                description: `Found ${results.length} fully verified vulnerabilities`,
                variant: results.length > 0 ? "destructive" : "default",
              });
            } else {
              toast({
                 title: "Scan Failed",
                 description: "The security scan encountered an error",
                 variant: "destructive"
              });
            }
          }
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }
      }, 3000);

    } catch (error) {
      setIsScanning(false);
      console.error("Error starting scan:", error);
      toast({
        title: "Error Starting Scan",
        description: error.message,
        variant: "destructive",
      });
    }
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

