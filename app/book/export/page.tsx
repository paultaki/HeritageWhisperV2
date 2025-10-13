"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, Printer } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ExportPage() {
  const { user } = useAuth();
  const [isExporting2up, setIsExporting2up] = useState(false);
  const [isExportingTrim, setIsExportingTrim] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPDF = async (format: "2up" | "trim") => {
    const setLoading = format === "2up" ? setIsExporting2up : setIsExportingTrim;
    setLoading(true);
    setError(null);

    try {
      // Make POST request to export API
      const response = await apiRequest("POST", `/api/export/${format}`, {});

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      // Get PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heritage-book-${format}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Export error:", err);
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const openPrintView = (format: "2up" | "trim") => {
    window.open(`/book/print/${format}`, "_blank");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F3]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please sign in to export your book</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-heritage-brown mb-2">
            Export Your Book
          </h1>
          <p className="text-gray-600">
            Download your stories as a beautifully formatted PDF
          </p>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 2-Up Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Home Printing (2-Up)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>Perfect for home printers:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>2 pages per sheet</li>
                  <li>8.5" × 11" landscape</li>
                  <li>Cut and fold to create booklet</li>
                  <li>Optimized for inkjet/laser printers</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => exportPDF("2up")}
                  disabled={isExporting2up}
                  className="w-full"
                >
                  {isExporting2up ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download 2-Up PDF
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => openPrintView("2up")}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Preview in Browser
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Opens print dialog - use your browser's "Save as PDF" option
              </p>
            </CardContent>
          </Card>

          {/* Trim Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Print-on-Demand (Trim)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>Professional printing:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Single page per sheet</li>
                  <li>6" × 9" trim size</li>
                  <li>Ready for print services</li>
                  <li>Premium book format</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => exportPDF("trim")}
                  disabled={isExportingTrim}
                  className="w-full"
                >
                  {isExportingTrim ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Trim PDF
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => openPrintView("trim")}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Preview in Browser
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Opens print dialog - use your browser's "Save as PDF" option
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Export Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Method 1: Direct Download (Recommended)</h3>
              <p className="text-gray-600">
                Click "Download PDF" button above. The PDF will be generated on our servers 
                and downloaded directly to your device. Takes 10-30 seconds depending on book size.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Method 2: Browser Print</h3>
              <p className="text-gray-600">
                Click "Preview in Browser" to open the print-optimized view. Then use your 
                browser's print function (⌘+P on Mac, Ctrl+P on Windows) and select "Save as PDF" 
                as the destination.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-xs">
                <strong>Note:</strong> Server-side PDF generation may timeout on very large books 
                (50+ stories). If this happens, use the browser print method instead.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
