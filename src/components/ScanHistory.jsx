import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Clock, Trash2, ExternalLink, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { generatePDFReport } from "@/utils/pdfGenerator";
import { mongodbAPI } from "@/utils/mongodb";

export const ScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await mongodbAPI.getScanHistory();
      setHistory(data || []);
    } catch (error) {
      toast({
        title: "Error fetching history",
        description: error.message || "Failed to fetch scan history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await mongodbAPI.deleteScanHistory(id);
      setHistory(history.filter((item) => item.id !== id));
      toast({
        title: "Deleted",
        description: "Scan history item deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error deleting item",
        description: error.message || "Failed to delete scan history",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = (item) => {
    try {
      const report = {
        target_url: item.target_url,
        created_at: item.created_at,
        vulnerabilities: item.results || [],
        scan_duration: item.scan_duration,
        critical_count: item.critical_count,
        high_count: item.high_count,
        medium_count: item.medium_count,
        low_count: item.low_count,
      };
      
      generatePDFReport(report);
      
      toast({
        title: "PDF Downloaded",
        description: "Security scan report has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error generating PDF",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scan history yet</p>
            <p className="text-sm">Start your first security scan to see results here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target URL</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vulnerabilities</TableHead>
                <TableHead>Critical</TableHead>
                <TableHead>High</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      {item.target_url}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(item.created_at), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.vulnerabilities_found > 0 ? "destructive" : "secondary"}>
                      {item.vulnerabilities_found} found
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.critical_count > 0 ? (
                      <Badge variant="destructive">{item.critical_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.high_count > 0 ? (
                      <Badge variant="destructive" className="bg-warning">
                        {item.high_count}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPDF(item)}
                        title="Download PDF Report"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
