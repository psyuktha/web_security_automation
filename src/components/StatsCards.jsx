import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Shield, Target, AlertTriangle } from "lucide-react";

export const StatsCards = ({
  totalScans,
  activeScans,
  vulnerabilitiesFound,
  criticalVulnerabilities,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:scale-105 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:rotate-12" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalScans}</div>
          <p className="text-xs text-muted-foreground">All time scans performed</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:scale-105 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Scans</CardTitle>
          <Activity className={`h-4 w-4 text-primary ${activeScans > 0 ? 'animate-pulse-glow' : ''}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeScans}</div>
          <p className="text-xs text-muted-foreground">Currently running</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:scale-105 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
          <Shield className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{vulnerabilitiesFound}</div>
          <p className="text-xs text-muted-foreground">Total vulnerabilities found</p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:scale-105 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          <AlertTriangle className={`h-4 w-4 text-destructive ${criticalVulnerabilities > 0 ? 'animate-pulse-glow' : ''}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{criticalVulnerabilities}</div>
          <p className="text-xs text-muted-foreground">Require immediate attention</p>
        </CardContent>
      </Card>
    </div>
  );
};

