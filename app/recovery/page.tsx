"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MonthlyReportGenerator from "@/components/reports/MonthlyReportGenerator";

export default function RecoveryPage() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [backupLoading, setBackupLoading] = useState(false);

  // Handle data download
  const downloadVisitsData = async () => {
    try {
      setBackupLoading(true);
      toast.success("Preparing data for download...");

      // Fetch all visits for the current user
      const { data, error } = await supabase
        .from("doctor_visits")
        .select("*")
        .eq("user_id", user?.id)
        .order("visit_date", { ascending: false });

      if (error) throw error;

      // Create a JSON file with metadata
      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user?.id,
        visits: data || [],
        version: "1.0",
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `doctor-visits-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Data downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading data:", error);
      toast.error("Failed to download data: " + error.message);
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Data Recovery & Backup</h1>
      <p className="text-gray-600 mb-6">
        Tools to backup, recover, and maintain your health data
      </p>

      <Tabs defaultValue="backup">
        <TabsList className="mb-6">
          <TabsTrigger value="backup">Data Backup</TabsTrigger>
          <TabsTrigger value="reports">Monthly Reports</TabsTrigger>
          <TabsTrigger value="history">Backup History</TabsTrigger>
        </TabsList>

        <TabsContent value="backup">
          <Card className="p-6">
            <div className="flex items-start">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-700"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">
                  Export Your Health Data
                </h3>
                <p className="text-gray-600 mb-4">
                  Download a complete backup of your doctor visits data. You can
                  use this file to restore your data if needed, or to transfer
                  your medical history to another healthcare system.
                </p>

                <div className="space-y-4">
                  <Button
                    onClick={downloadVisitsData}
                    disabled={backupLoading}
                    className="flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    {backupLoading
                      ? "Preparing Backup..."
                      : "Download Full Backup"}
                  </Button>

                  <div className="bg-gray-50 p-4 rounded border mt-4">
                    <h4 className="font-medium mb-2">Why backup your data?</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Protect against data loss</li>
                      <li>Keep records for personal reference</li>
                      <li>Transfer your medical history between providers</li>
                      <li>
                        Ensure you always have access to your health information
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <MonthlyReportGenerator />
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <h3 className="text-xl font-medium mb-4">Backup History</h3>
            <p className="mb-4 text-gray-600">
              View your previous data backups and exports. You can restore from
              these backups if needed.
            </p>

            <div className="border rounded-md p-4 bg-gray-50 text-center">
              <p className="text-gray-500">No backup history available yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Your backup history will appear here once you've created
                backups.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
