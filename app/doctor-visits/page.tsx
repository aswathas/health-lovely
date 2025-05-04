"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { format } from "date-fns";
import { Stethoscope, Plus, Calendar, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ConflictResolutionModal from "@/components/doctor-visits/ConflictResolutionModal";
import ConcurrencyMonitor from "@/components/ConcurrencyMonitor";
import ConcurrencyTestTool from "@/components/ConcurrencyTestTool";
import ConcurrencyDemo from "@/components/ConcurrencyDemo";

interface DoctorVisit {
  id: string;
  user_id: string;
  visit_date: string;
  doctor_name: string;
  reason: string;
  diagnosis: string;
  follow_up_date: string;
  notes: string;
  specialty: string;
  prescription: string;
  created_at: string;
  updated_at: string;
  version?: number;
}

export default function DoctorVisits() {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [conflictData, setConflictData] = useState<{
    current: DoctorVisit | null;
    server: DoctorVisit | null;
  }>({
    current: null,
    server: null,
  });
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingUpdates, setPendingUpdates] = useState<
    { id: string; data: Partial<DoctorVisit>; version: number }[]
  >([]);
  const [selectedVisitId, setSelectedVisitId] = useState<string | undefined>();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    fetchVisits();
  }, [user]);

  useEffect(() => {
    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      processPendingUpdates();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load any saved pending updates from localStorage
    const savedUpdates = localStorage.getItem("pendingDoctorVisitUpdates");
    if (savedUpdates) {
      try {
        setPendingUpdates(JSON.parse(savedUpdates));
      } catch (e) {
        console.error("Error parsing saved updates:", e);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchVisits = async () => {
    try {
      const { data, error } = await supabase
        .from("doctor_visits")
        .select("*") // Version will be included in '*'
        .eq("user_id", user?.id)
        .order("visit_date", { ascending: false });

      if (error) throw error;

      // If no version field exists yet, add a default version 1
      const visitsWithVersion = (data || []).map((visit) => ({
        ...visit,
        version: visit.version || 1,
      }));

      setVisits(visitsWithVersion);
    } catch (error: any) {
      console.error("Error fetching visits:", error);
      showToast("Failed to load doctor visits", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateVisit = async (
    id: string,
    data: Partial<DoctorVisit>,
    currentVersion: number
  ) => {
    try {
      // Update with optimistic concurrency control
      const { data: updatedData, error } = await supabase
        .from("doctor_visits")
        .update({
          ...data,
          version: currentVersion + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("version", currentVersion) // This ensures no one else modified it
        .select()
        .single();

      if (error) throw error;

      // If no rows returned, it means someone else updated the record
      if (!updatedData) {
        // Fetch current version from server
        const { data: currentData } = await supabase
          .from("doctor_visits")
          .select("*")
          .eq("id", id)
          .single();

        if (!currentData) throw new Error("Record not found");

        // Handle conflict
        setConflictData({
          current: { ...visits.find((v) => v.id === id)!, ...data },
          server: currentData,
        });
        setShowConflictModal(true);
        return false;
      }

      // Update succeeded
      setVisits(
        visits.map((visit) =>
          visit.id === id
            ? { ...visit, ...data, version: currentVersion + 1 }
            : visit
        )
      );
      showToast("Visit updated successfully", "success");
      return true;
    } catch (error: any) {
      console.error("Error updating visit:", error);
      showToast("Update failed: " + error.message, "error");
      return false;
    }
  };

  const processPendingUpdates = async () => {
    if (!isOnline || pendingUpdates.length === 0) return;

    const updatesToProcess = [...pendingUpdates];
    setPendingUpdates([]);
    localStorage.removeItem("pendingDoctorVisitUpdates");

    for (const update of updatesToProcess) {
      try {
        const success = await updateVisit(
          update.id,
          update.data,
          update.version
        );
        if (!success) {
          showToast(
            "Some updates could not be applied due to conflicts",
            "error"
          );
        }
      } catch (error) {
        console.error("Error processing pending update:", error);
      }
    }

    // Refresh data from server to ensure we have latest
    fetchVisits();

    showToast("All pending updates processed", "success");
  };

  const updateVisitWithRecovery = async (
    id: string,
    data: Partial<DoctorVisit>,
    version: number
  ) => {
    if (!isOnline) {
      // Store for later when back online
      const newPendingUpdates = [...pendingUpdates, { id, data, version }];
      setPendingUpdates(newPendingUpdates);
      localStorage.setItem(
        "pendingDoctorVisitUpdates",
        JSON.stringify(newPendingUpdates)
      );

      // Update UI optimistically
      setVisits(
        visits.map((visit) => (visit.id === id ? { ...visit, ...data } : visit))
      );

      showToast(
        "Changes saved locally and will be applied when back online",
        "info"
      );
      return;
    }

    return updateVisit(id, data, version);
  };

  const handleUseServerVersion = () => {
    if (!conflictData.server) return;

    // Use the server version
    setVisits(
      visits.map((visit) =>
        visit.id === conflictData.server?.id ? conflictData.server : visit
      )
    );

    setShowConflictModal(false);
    setConflictData({ current: null, server: null });
    showToast("Server version applied", "info");
  };

  const handleUseLocalVersion = async () => {
    if (!conflictData.current || !conflictData.server) return;

    try {
      // Force update with our version but using the latest version number + 1
      const { data, error } = await supabase
        .from("doctor_visits")
        .update({
          ...conflictData.current,
          version: (conflictData.server.version || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conflictData.current.id)
        .select();

      if (error) throw error;

      // Update local state
      setVisits(
        visits.map((visit) =>
          visit.id === conflictData.current?.id
            ? {
                ...conflictData.current,
                version: (conflictData.server?.version || 0) + 1,
              }
            : visit
        )
      );

      showToast("Your changes have been saved", "success");
    } catch (error: any) {
      console.error("Error applying local changes:", error);
      showToast("Failed to apply changes: " + error.message, "error");
    }

    setShowConflictModal(false);
    setConflictData({ current: null, server: null });
  };

  const downloadVisitsData = async () => {
    try {
      showToast("Preparing data for download...", "info");

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

      showToast("Data downloaded successfully!", "success");
    } catch (error: any) {
      console.error("Error downloading data:", error);
      showToast("Failed to download data: " + error.message, "error");
    }
  };

  const deleteVisit = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this doctor visit? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("doctor_visits")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setVisits(visits.filter((visit) => visit.id !== id));
      showToast("Visit deleted successfully", "success");
    } catch (error: any) {
      console.error("Error deleting visit:", error);
      showToast(`Failed to delete visit: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Visits</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadVisitsData}
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
            Backup Data
          </Button>
          <Button asChild>
            <Link href="/doctor-visits/new" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Visit
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link href="/doctor-visits/chat">
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              AI Chat Assistant
            </Link>
          </Button>
        </div>
      </div>

      {visits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visits.map((visit) => (
            <Card
              key={visit.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium text-lg">{visit.doctor_name}</h3>
                  </div>
                  {visit.specialty && (
                    <p className="text-blue-600 text-sm mb-2">
                      {visit.specialty}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(visit.visit_date), "PPP")}</span>
                  </div>
                  {visit.reason && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600">
                        Reason
                      </p>
                      <p className="text-sm">{visit.reason}</p>
                    </div>
                  )}
                  {visit.diagnosis && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600">
                        Diagnosis
                      </p>
                      <p className="text-sm">{visit.diagnosis}</p>
                    </div>
                  )}
                  {visit.notes && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600">Notes</p>
                      <p className="text-sm">{visit.notes}</p>
                    </div>
                  )}
                  {visit.prescription && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600">
                        Prescription
                      </p>
                      <p className="text-sm">{visit.prescription}</p>
                    </div>
                  )}
                  {visit.follow_up_date && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-gray-600">
                        Follow-up Date
                      </p>
                      <p className="text-sm text-blue-600">
                        {format(new Date(visit.follow_up_date), "PPP")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteVisit(visit.id)}
                  className="flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  Delete
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/doctor-visits/${visit.id}/edit`}>
                    Edit Visit
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Stethoscope className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Doctor Visits Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start tracking your doctor visits to maintain a complete health
            record.
          </p>
          <Button asChild>
            <Link
              href="/doctor-visits/new"
              className="flex items-center gap-2 justify-center"
            >
              <Plus className="h-5 w-5" />
              Add Your First Visit
            </Link>
          </Button>
        </div>
      )}

      {/* Conflict resolution modal */}
      <ConflictResolutionModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        currentData={conflictData.current}
        serverData={conflictData.server}
        onUseServer={handleUseServerVersion}
        onUseLocal={handleUseLocalVersion}
      />

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg">
          Offline Mode - Changes will sync when connection is restored
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Concurrency Control Demo</h2>
        <ConcurrencyTestTool visitId={selectedVisitId} />

        <div className="mt-4">
          <h3 className="font-medium mb-2">
            Select a visit to test concurrency:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className={`p-4 border rounded cursor-pointer ${
                  selectedVisitId === visit.id
                    ? "bg-blue-50 border-blue-300"
                    : ""
                }`}
                onClick={() => setSelectedVisitId(visit.id)}
              >
                <p className="font-medium">{visit.doctor_name}</p>
                <p className="text-sm text-gray-600">
                  Date: {new Date(visit.visit_date).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  Version: {visit.version || 1}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 border-t pt-8">
        <h2 className="text-xl font-bold mb-4">Concurrency Control System</h2>

        <p className="mb-4">
          This application implements optimistic concurrency control with
          versioning to prevent data corruption when multiple users or devices
          edit the same record simultaneously.
        </p>

        {selectedVisitId && <ConcurrencyDemo visitId={selectedVisitId} />}

        <div className="mt-4">
          <Button asChild>
            <Link href="/concurrency-plan">
              View Complete Concurrency & Recovery Plan
            </Link>
          </Button>
        </div>
      </div>

      <ConcurrencyMonitor />
    </div>
  );
}
