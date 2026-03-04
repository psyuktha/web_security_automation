import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { StatsCards } from "@/components/StatsCards";
import { useToast } from "@/hooks/use-toast";
import { Shield, LogOut, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeScanStats } from "@/utils/scanStats";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

type ScanHistoryItem = {
  created_at?: string | Date;
  status?: string;
  vulnerabilities_found?: number;
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
};

const StatsPage = () => {
  const { user, isAuthenticated, loading, signout, getAuthHeaders } = useAuth();
  const [totalScans, setTotalScans] = useState(0);
  const [activeScans, setActiveScans] = useState(0);
  const [vulnerabilitiesFound, setVulnerabilitiesFound] = useState(0);
  const [criticalVulnerabilities, setCriticalVulnerabilities] = useState(0);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setLoadingStats(true);
        const response = await fetch(`${API_URL}/scan-history/user/${user.id}`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch scan history");
        }

        const history = (await response.json()) as ScanHistoryItem[];
        setHistory(history);

        // Calculate stats from history (shared with dashboard)
        const { totalScans: total, activeScans: active, vulnerabilitiesFound: totalVulns, criticalVulnerabilities: critical } =
          computeScanStats(history);

        setTotalScans(total);
        setActiveScans(active);
        setVulnerabilitiesFound(totalVulns);
        setCriticalVulnerabilities(critical);
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast({
          title: "Error",
          description: "Failed to load statistics",
          variant: "destructive",
        });
      } finally {
        setLoadingStats(false);
      }
    };

    if (isAuthenticated && user) {
      fetchStats();
    }
  }, [user, isAuthenticated, getAuthHeaders, toast]);

  const handleLogout = () => {
    signout();
    navigate("/auth");
  };

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

  if (!isAuthenticated || !user) {
    return null;
  }

  const charts = useMemo(() => {
    // Scans + vulnerabilities over time (grouped by day)
    const byDay = new Map<string, { day: string; scans: number; vulnerabilities: number }>();
    for (const scan of history) {
      const d = scan?.created_at ? new Date(scan.created_at) : null;
      if (!d || Number.isNaN(d.getTime())) continue;
      const day = format(d, "MMM dd");
      const entry = byDay.get(day) || { day, scans: 0, vulnerabilities: 0 };
      entry.scans += 1;
      entry.vulnerabilities += scan?.vulnerabilities_found || 0;
      byDay.set(day, entry);
    }
    const timeline = Array.from(byDay.values());

    // Severity breakdown (totals)
    const severityTotals = history.reduce(
      (acc, scan) => {
        acc.critical += scan?.critical_count || 0;
        acc.high += scan?.high_count || 0;
        acc.medium += scan?.medium_count || 0;
        acc.low += scan?.low_count || 0;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, low: 0 }
    );

    const severityPie = [
      { name: "Critical", value: severityTotals.critical, color: "hsl(var(--destructive))" },
      { name: "High", value: severityTotals.high, color: "hsl(var(--warning))" },
      { name: "Medium", value: severityTotals.medium, color: "hsl(var(--warning) / 0.7)" },
      { name: "Low", value: severityTotals.low, color: "hsl(var(--info))" },
    ].filter((x) => x.value > 0);

    const severityBars = [
      { severity: "Critical", count: severityTotals.critical },
      { severity: "High", count: severityTotals.high },
      { severity: "Medium", count: severityTotals.medium },
      { severity: "Low", count: severityTotals.low },
    ];

    return { timeline, severityPie, severityBars };
  }, [history]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Statistics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Overview of your security scanning activity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {loadingStats ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="animate-fade-in">
                <StatsCards
                  totalScans={totalScans}
                  activeScans={activeScans}
                  vulnerabilitiesFound={vulnerabilitiesFound}
                  criticalVulnerabilities={criticalVulnerabilities}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Scans & Vulnerabilities Over Time</CardTitle>
                    <CardDescription>Grouped by day</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    {charts.timeline.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No scan history yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={charts.timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                          <Line
                            type="monotone"
                            dataKey="vulnerabilities"
                            stroke="hsl(var(--destructive))"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vulnerabilities by Severity</CardTitle>
                    <CardDescription>Totals across all your scans</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    {charts.severityPie.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No vulnerability data yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip />
                          <Legend />
                          <Pie data={charts.severityPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                            {charts.severityPie.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Statistics</CardTitle>
                  <CardDescription>
                    Detailed breakdown of your scanning activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Average Vulnerabilities per Scan</p>
                      <p className="text-2xl font-bold mt-2">
                        {totalScans > 0
                          ? (vulnerabilitiesFound / totalScans).toFixed(1)
                          : "0"}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Critical Issue Rate</p>
                      <p className="text-2xl font-bold mt-2">
                        {vulnerabilitiesFound > 0
                          ? ((criticalVulnerabilities / vulnerabilitiesFound) * 100).toFixed(1)
                          : "0"}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts.severityBars} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="severity" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StatsPage;
