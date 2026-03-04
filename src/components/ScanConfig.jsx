import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Play, Loader2 } from "lucide-react";

export const ScanConfig = ({ onStartScan, isScanning }) => {
  const [targetUrl, setTargetUrl] = useState("");
  const [attackTypes, setAttackTypes] = useState({
    sqlInjection: true,
    xss: true,
    commandInjection: true,
    fileUpload: true,
    csrf: false,
    authBypass: false,
  });

  const handleStartScan = () => {
    if (!targetUrl) return;
    onStartScan({ targetUrl, attackTypes });
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur transition-all duration-300 hover:shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary animate-pulse-glow" />
          <CardTitle>Scan Configuration</CardTitle>
        </div>
        <CardDescription>Configure your security scan parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="target-url">Target URL</Label>
          <Input
            id="target-url"
            type="url"
            placeholder="https://example.com"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            disabled={isScanning}
          />
        </div>

        <div className="space-y-4">
          <Label>Attack Types</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sql-injection"
                checked={attackTypes.sqlInjection}
                onCheckedChange={(checked) =>
                  setAttackTypes({ ...attackTypes, sqlInjection: checked })
                }
                disabled={isScanning}
              />
              <label htmlFor="sql-injection" className="text-sm cursor-pointer">
                SQL Injection
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="xss"
                checked={attackTypes.xss}
                onCheckedChange={(checked) =>
                  setAttackTypes({ ...attackTypes, xss: checked })
                }
                disabled={isScanning}
              />
              <label htmlFor="xss" className="text-sm cursor-pointer">
                Cross-Site Scripting (XSS)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="command-injection"
                checked={attackTypes.commandInjection}
                onCheckedChange={(checked) =>
                  setAttackTypes({ ...attackTypes, commandInjection: checked })
                }
                disabled={isScanning}
              />
              <label htmlFor="command-injection" className="text-sm cursor-pointer">
                Command Injection
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="file-upload"
                checked={attackTypes.fileUpload}
                onCheckedChange={(checked) =>
                  setAttackTypes({ ...attackTypes, fileUpload: checked })
                }
                disabled={isScanning}
              />
              <label htmlFor="file-upload" className="text-sm cursor-pointer">
                File Upload Attacks
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="csrf"
                checked={attackTypes.csrf}
                onCheckedChange={(checked) =>
                  setAttackTypes({ ...attackTypes, csrf: checked })
                }
                disabled={isScanning}
              />
              <label htmlFor="csrf" className="text-sm cursor-pointer">
                CSRF
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auth-bypass"
                checked={attackTypes.authBypass}
                onCheckedChange={(checked) =>
                  setAttackTypes({ ...attackTypes, authBypass: checked })
                }
                disabled={isScanning}
              />
              <label htmlFor="auth-bypass" className="text-sm cursor-pointer">
                Authentication Bypass
              </label>
            </div>
          </div>
        </div>

        <Button
          onClick={handleStartScan}
          disabled={!targetUrl || isScanning}
          className="w-full"
          size="lg"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Scan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

