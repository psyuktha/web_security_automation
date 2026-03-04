import jsPDF from "jspdf";
import { format } from "date-fns";

const getMitigationForVulnerability = (type) => {
  const mitigations = {
    "SQL Injection": `
MITIGATION STEPS:
1. Use Parameterized Queries/Prepared Statements
   - Always use prepared statements with parameterized queries
   - Never concatenate user input directly into SQL queries
   
2. Input Validation
   - Validate and sanitize all user inputs
   - Use whitelist validation for expected input patterns
   - Reject any input containing SQL metacharacters
   
3. Least Privilege Principle
   - Use database accounts with minimal required permissions
   - Avoid using admin/root accounts for web applications
   
4. Additional Security Measures
   - Implement Web Application Firewall (WAF)
   - Use ORM frameworks that handle SQL injection prevention
   - Regular security audits and penetration testing
   - Keep database software updated with latest security patches`,

    "Cross-Site Scripting (XSS)": `
MITIGATION STEPS:
1. Output Encoding
   - Encode all user-generated content before displaying
   - Use context-appropriate encoding (HTML, JavaScript, URL)
   - Implement Content Security Policy (CSP) headers
   
2. Input Validation
   - Validate all input on both client and server side
   - Use whitelist validation for acceptable characters
   - Reject or sanitize dangerous HTML/JavaScript content
   
3. Framework Protection
   - Use modern frameworks with built-in XSS protection
   - Enable auto-escaping in template engines
   - Use HTTPOnly and Secure flags on cookies
   
4. Additional Security
   - Implement X-XSS-Protection headers
   - Regular security code reviews
   - Use trusted libraries for sanitization
   - Educate developers on XSS prevention`,

    "Command Injection": `
MITIGATION STEPS:
1. Avoid System Calls
   - Never pass user input directly to system commands
   - Use built-in language functions instead of shell commands
   - Implement functionality in native code when possible
   
2. Input Validation
   - Strictly validate all user inputs
   - Use whitelist approach for allowed characters
   - Reject inputs with shell metacharacters (&, |, ;, $, etc.)
   
3. Secure Coding Practices
   - Use libraries that escape shell arguments
   - Implement least privilege for process execution
   - Run processes in sandboxed environments
   
4. Additional Measures
   - Regular code reviews focusing on command execution
   - Use static analysis tools to detect vulnerabilities
   - Implement logging and monitoring for command execution
   - Keep system and dependencies updated`,

    "File Upload Attacks": `
MITIGATION STEPS:
1. File Type Validation
   - Validate file extensions using whitelist
   - Check file content/magic numbers, not just extension
   - Implement file size limits
   
2. Secure Storage
   - Store uploaded files outside web root
   - Use random filenames instead of user-provided names
   - Set appropriate file permissions (read-only when possible)
   
3. Content Scanning
   - Scan uploaded files for malware
   - Validate file content matches expected format
   - Strip metadata from uploaded files
   
4. Additional Security
   - Implement rate limiting for uploads
   - Use separate domain for serving user content
   - Set appropriate Content-Type headers
   - Regular security audits of upload functionality`,

    "CSRF": `
MITIGATION STEPS:
1. Anti-CSRF Tokens
   - Implement synchronizer tokens for all state-changing requests
   - Use framework's built-in CSRF protection
   - Ensure tokens are unique per session
   
2. SameSite Cookie Attribute
   - Set SameSite=Strict or SameSite=Lax on cookies
   - Use Secure flag for HTTPS-only transmission
   - Implement HTTPOnly flag to prevent JavaScript access
   
3. Custom Headers
   - Require custom headers for sensitive operations
   - Verify Origin and Referer headers
   - Implement double-submit cookie pattern
   
4. Additional Measures
   - Re-authenticate for sensitive operations
   - Implement user interaction (CAPTCHA) for critical actions
   - Use POST for state-changing operations
   - Regular security testing and code reviews`,

    "Authentication Bypass": `
MITIGATION STEPS:
1. Strong Authentication
   - Implement multi-factor authentication (MFA)
   - Use secure password hashing (bcrypt, Argon2)
   - Enforce strong password policies
   
2. Session Management
   - Use secure, random session identifiers
   - Implement proper session timeout
   - Regenerate session IDs after login
   - Secure session storage and transmission
   
3. Access Control
   - Implement principle of least privilege
   - Verify authorization on every request
   - Use role-based access control (RBAC)
   - Regular access control audits
   
4. Additional Security
   - Implement account lockout after failed attempts
   - Use HTTPS for all authentication traffic
   - Regular security testing and penetration testing
   - Monitor and log authentication attempts
   - Keep authentication libraries updated`,
  };

  return mitigations[type] || `
GENERAL MITIGATION STEPS:
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
    
    const mitigation = getMitigationForVulnerability(vuln.type);
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

