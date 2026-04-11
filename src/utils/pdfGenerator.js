import jsPDF from "jspdf";
import { format } from "date-fns";

const getFallbackMitigation = () => {
  return `GENERAL MITIGATION STEPS:
1. Input Validation
   - Validate and sanitize all user inputs
   - Use whitelist approach when possible
   
2. Security Best Practices
   - Keep all software and dependencies updated
   - Implement least privilege principle
   - Regular security audits and testing
   
3. Monitoring
   - Implement logging and monitoring
   - Set up alerts for suspicious activities
   
4. Developer Training
   - Regular security awareness training
   - Code review processes
   - Follow OWASP guidelines`;
};

export const generatePDFReport = (report) => {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Security Scan Report", margin, yPosition);
  
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${format(new Date(), "MMM dd, yyyy HH:mm:ss")}`, margin, yPosition);
  
  yPosition += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  
  // Scan Details
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Scan Details", margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Target URL: ${report.target_url}`, margin, yPosition);
  
  yPosition += 6;
  doc.text(`Scan Date: ${format(new Date(report.created_at), "MMM dd, yyyy HH:mm")}`, margin, yPosition);
  
  if (report.scan_duration) {
    yPosition += 6;
    doc.text(`Duration: ${report.scan_duration}s`, margin, yPosition);
  }
  
  // Summary
  yPosition += 12;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Vulnerabilities: ${report.vulnerabilities.length}`, margin, yPosition);
  
  yPosition += 6;
  doc.setTextColor(220, 38, 38); // Red for critical
  doc.text(`Critical: ${report.critical_count}`, margin, yPosition);
  
  doc.setTextColor(245, 158, 11); // Orange for high
  doc.text(`High: ${report.high_count}`, margin + 50, yPosition);
  
  doc.setTextColor(234, 179, 8); // Yellow for medium
  doc.text(`Medium: ${report.medium_count}`, margin + 90, yPosition);
  
  doc.setTextColor(59, 130, 246); // Blue for low
  doc.text(`Low: ${report.low_count}`, margin + 140, yPosition);
  
  doc.setTextColor(0, 0, 0); // Reset to black
  
  // Vulnerabilities Details
  yPosition += 15;
  
  report.vulnerabilities.forEach((vuln, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Vulnerability header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. ${vuln.type}`, margin, yPosition);
    
    yPosition += 7;
    
    // Severity badge
    doc.setFontSize(9);
    const severityColors = {
      critical: [220, 38, 38],
      high: [245, 158, 11],
      medium: [234, 179, 8],
      low: [59, 130, 246],
      info: [156, 163, 175]
    };
    
    const color = severityColors[vuln.severity] || [156, 163, 175];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(margin, yPosition - 4, 25, 6, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(vuln.severity.toUpperCase(), margin + 2, yPosition);
    doc.setTextColor(0, 0, 0);
    
    yPosition += 8;
    
    // Vulnerability details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Endpoint: ${vuln.endpoint}`, margin, yPosition);
    
    yPosition += 6;
    const descLines = doc.splitTextToSize(`Description: ${vuln.description}`, maxWidth);
    doc.text(descLines, margin, yPosition);
    yPosition += descLines.length * 5;
    
    if (vuln.evidence) {
      yPosition += 2;
      const evidenceLines = doc.splitTextToSize(`Evidence: ${vuln.evidence}`, maxWidth);
      doc.setFont("helvetica", "italic");
      doc.text(evidenceLines, margin, yPosition);
      yPosition += evidenceLines.length * 5;
      doc.setFont("helvetica", "normal");
    }
    
    // Check if we need a new page for mitigation
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Mitigation
    yPosition += 4;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94); // Green
    doc.text("MITIGATION:", margin, yPosition);
    doc.setTextColor(0, 0, 0);
    
    yPosition += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const mitigation = vuln.mitigationPlan || vuln.mitigation || vuln.recommendation || getFallbackMitigation();
    const mitigationLines = doc.splitTextToSize(mitigation.trim(), maxWidth);
    
    mitigationLines.forEach((line) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 4;
    });
    
    // Separator
    yPosition += 5;
    if (yPosition < 280) {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
    }
    yPosition += 8;
  });
  
  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  // Download
  const fileName = `security-scan-${format(new Date(report.created_at), "yyyy-MM-dd-HHmm")}.pdf`;
  doc.save(fileName);
};

