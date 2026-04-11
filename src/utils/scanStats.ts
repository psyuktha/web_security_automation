export type ScanHistoryLike = {
  status?: string;
  vulnerabilities_found?: number;
  critical_count?: number;
};

export type ScanStats = {
  totalScans: number;
  activeScans: number;
  vulnerabilitiesFound: number;
  criticalVulnerabilities: number;
};

export function computeScanStats(history: ScanHistoryLike[] | null | undefined): ScanStats {
  const list = Array.isArray(history) ? history : [];

  const totalScans = list.length;
  const activeScans = list.filter(
    (scan) => scan?.status === "running" || scan?.status === "pending"
  ).length;

  const vulnerabilitiesFound = list.reduce(
    (sum, scan) => sum + (scan?.vulnerabilities_found || 0),
    0
  );

  const criticalVulnerabilities = list.reduce(
    (sum, scan) => sum + (scan?.critical_count || 0),
    0
  );

  return { totalScans, activeScans, vulnerabilitiesFound, criticalVulnerabilities };
}

