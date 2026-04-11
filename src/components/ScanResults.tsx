import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";

export interface Vulnerability {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  endpoint: string;
  description: string;
  evidence?: string;
}

interface ScanResultsProps {
  vulnerabilities: Vulnerability[];
  isScanning: boolean;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-destructive text-destructive-foreground";
    case "high":
      return "bg-warning/90 text-foreground";
    case "medium":
      return "bg-warning/60 text-foreground";
    case "low":
      return "bg-info/60 text-foreground";
    case "info":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "critical":
    case "high":
      return <XCircle className="h-4 w-4" />;
    case "medium":
      return <AlertTriangle className="h-4 w-4" />;
    case "low":
    case "info":
      return <Info className="h-4 w-4" />;
    default:
      return <CheckCircle className="h-4 w-4" />;
  }
};

export const ScanResults = ({ vulnerabilities, isScanning }: ScanResultsProps) => {
  const criticalCount = vulnerabilities.filter((v) => v.severity === "critical").length;
  const highCount = vulnerabilities.filter((v) => v.severity === "high").length;
  const mediumCount = vulnerabilities.filter((v) => v.severity === "medium").length;
  const lowCount = vulnerabilities.filter((v) => v.severity === "low").length;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:shadow-xl">
      <CardHeader>
        <CardTitle>Scan Results</CardTitle>
        <CardDescription>
          {isScanning
            ? "Scanning in progress..."
            : `Found ${vulnerabilities.length} potential vulnerabilities`}
        </CardDescription>
        {!isScanning && vulnerabilities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} Critical</Badge>
            )}
            {highCount > 0 && <Badge className="bg-warning/90">{highCount} High</Badge>}
            {mediumCount > 0 && <Badge className="bg-warning/60">{mediumCount} Medium</Badge>}
            {lowCount > 0 && <Badge className="bg-info/60">{lowCount} Low</Badge>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {vulnerabilities.length === 0 && !isScanning ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-success mb-4" />
              <p className="text-muted-foreground">No vulnerabilities detected yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Configure and start a scan to see results
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {vulnerabilities.map((vuln, index) => (
                <Card 
                  key={vuln.id} 
                  className="border-border/50 animate-fade-in transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(vuln.severity)}
                        <h4 className="font-semibold">{vuln.type}</h4>
                      </div>
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{vuln.description}</p>
                    <p className="text-xs text-primary font-mono">{vuln.endpoint}</p>
                    {vuln.evidence && (
                      <div className="mt-3 p-3 bg-secondary rounded-md">
                        <p className="text-xs font-mono text-muted-foreground">
                          Evidence: {vuln.evidence}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
