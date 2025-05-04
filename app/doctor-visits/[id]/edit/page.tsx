"use client";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/contexts/AuthContext";
import ConflictResolutionModal from "@/components/doctor-visits/ConflictResolutionModal";
import { Button } from "@/components/ui/button";

export default function EditDoctorVisit() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);
  const [conflictData, setConflictData] = useState<{
    current: any;
    server: any;
  }>({
    current: null,
    server: null,
  });
  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    fetchVisitData();
  }, [user, id]);

  const fetchVisitData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("doctor_visits")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFormData(data);
    } catch (error: any) {
      showToast(error.message || "Failed to load visit data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    switch (type) {
      case "error":
        toast.error(message);
        break;
      case "success":
        toast.success(message);
        break;
      default:
        toast(message);
    }
  };

  const updateVisit = async (data: any, currentVersion: number) => {
    // Log attempt
    window.dispatchEvent(
      new CustomEvent("concurrency-event", {
        detail: {
          id: crypto.randomUUID(),
          type: "attempt",
          timestamp: new Date(),
          resource: `doctor-visit-${id}`,
          details: `Attempting to update from version ${currentVersion} to ${
            currentVersion + 1
          }`,
        },
      })
    );

    setLoading(true);
    try {
      const { data: updatedVisit, error } = await supabase
        .from("doctor_visits")
        .update({
          ...data,
          version: currentVersion + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("version", currentVersion)
        .select()
        .single();

      if (error) throw error;

      if (!updatedVisit) {
        // Log conflict
        window.dispatchEvent(
          new CustomEvent("concurrency-event", {
            detail: {
              id: crypto.randomUUID(),
              type: "conflict",
              timestamp: new Date(),
              resource: `doctor-visit-${id}`,
              details: `Version conflict detected: expected ${currentVersion}`,
            },
          })
        );

        showToast(
          "This record was modified by another user. Refreshing data...",
          "error"
        );
        const { data: latestData } = await supabase
          .from("doctor_visits")
          .select("*")
          .eq("id", id)
          .single();

        // Only show conflict modal if we have both sets of data
        if (data && latestData) {
          setConflictData({
            current: data,
            server: latestData,
          });
          setShowConflictModal(true);
        } else {
          // Just refresh the form with the latest data if we can't compare
          setFormData(latestData);
          showToast("Form has been updated with the latest data", "info");
        }
        return false;
      }

      // Log success
      window.dispatchEvent(
        new CustomEvent("concurrency-event", {
          detail: {
            id: crypto.randomUUID(),
            type: "success",
            timestamp: new Date(),
            resource: `doctor-visit-${id}`,
            details: `Successfully updated to version ${currentVersion + 1}`,
          },
        })
      );

      showToast("Visit updated successfully", "success");
      router.push("/doctor-visits");
      return true;
    } catch (error: any) {
      console.error("Error updating visit:", error);
      showToast(error.message || "Failed to update visit", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUseServerVersion = () => {
    if (!conflictData.server) return;
    setFormData(conflictData.server);
    setShowConflictModal(false);
  };

  const handleUseLocalVersion = async () => {
    if (!conflictData.current || !conflictData.server) return;

    try {
      await updateVisit(conflictData.current, conflictData.server.version);
      setShowConflictModal(false);
    } catch (error) {
      console.error("Error applying changes:", error);
    }
  };

  if (loading && !formData) {
    return <div className="p-8 text-center">Loading visit data...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Doctor Visit</h1>

      {formData && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateVisit(formData, formData.version || 1);
          }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Doctor Name
                </label>
                <input
                  type="text"
                  value={formData.doctor_name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      doctor_name: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Visit Date
                </label>
                <input
                  type="date"
                  value={formData.visit_date?.substring(0, 10) || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visit_date: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  value={formData.specialty || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialty: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={formData.follow_up_date?.substring(0, 10) || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      follow_up_date: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Reason for Visit
              </label>
              <textarea
                value={formData.reason || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reason: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                rows={2}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Diagnosis
              </label>
              <textarea
                value={formData.diagnosis || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    diagnosis: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                rows={2}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Prescription
              </label>
              <textarea
                value={formData.prescription || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prescription: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                rows={2}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notes: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                rows={3}
              ></textarea>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                type="button"
                className="px-4 py-2 border rounded"
                onClick={() => router.push("/doctor-visits")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="mt-8 border-t pt-4">
            <h2 className="text-lg font-semibold mb-4">
              Concurrency Demo Tools
            </h2>

            <div className="mb-4 p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium mb-2">Multi-device Scenario</h3>
              <p className="text-sm mb-3">
                This demonstrates a realistic concurrency conflict scenario.
              </p>
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      // 1. First, get the current version from server
                      const { data: currentRecord } = await supabase
                        .from("doctor_visits")
                        .select("*")
                        .eq("id", id)
                        .single();

                      if (!currentRecord) {
                        showToast("Could not find the current record", "error");
                        return;
                      }

                      // 2. Make a change on the "other device"
                      const { data, error } = await supabase
                        .from("doctor_visits")
                        .update({
                          notes:
                            (currentRecord.notes || "") +
                            " [Updated from another device]",
                          version: (currentRecord.version || 1) + 1,
                          updated_at: new Date().toISOString(),
                        })
                        .eq("id", id)
                        .eq("version", currentRecord.version)
                        .select();

                      if (error) {
                        showToast(
                          "Simulation failed: " + error.message,
                          "error"
                        );
                        return;
                      }

                      showToast(
                        "Record updated on another device! Now try saving your changes.",
                        "success"
                      );
                    } catch (err: any) {
                      showToast("Error: " + err.message, "error");
                    }
                  }}
                >
                  Step 1: Simulate Update on Another Device
                </Button>

                <div className="px-4 py-2 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Step 2: Make some changes to the form fields above, then
                    click "Save Changes"
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 p-4 bg-green-50 rounded-md">
              <h3 className="font-medium mb-2">
                Offline/Online Synchronization
              </h3>
              <p className="text-sm mb-3">
                Shows how the system handles edits made while offline that
                conflict with server changes when connection is restored.
              </p>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    localStorage.setItem(
                      `doctor-visit-${id}-offline`,
                      JSON.stringify({
                        ...formData,
                        notes: formData.notes + " [Edited while offline]",
                        updatedAt: new Date().toISOString(),
                      })
                    );
                    showToast(
                      "Changes saved locally (simulating offline mode)",
                      "info"
                    );
                  }}
                >
                  Save Offline Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const offlineData = localStorage.getItem(
                      `doctor-visit-${id}-offline`
                    );
                    if (!offlineData) {
                      showToast("No offline changes found", "error");
                      return;
                    }

                    try {
                      const parsedData = JSON.parse(offlineData);

                      // Check if there's a version conflict
                      const { data: currentRecord } = await supabase
                        .from("doctor_visits")
                        .select("*")
                        .eq("id", id)
                        .single();

                      if (currentRecord.version !== formData.version) {
                        setConflictData({
                          current: parsedData,
                          server: currentRecord,
                        });
                        setShowConflictModal(true);
                        showToast(
                          "Conflict detected with server version",
                          "error"
                        );
                      } else {
                        // No conflict, apply changes
                        await updateVisit(parsedData, formData.version);
                        localStorage.removeItem(`doctor-visit-${id}-offline`);
                      }
                    } catch (error) {
                      console.error("Error syncing offline changes:", error);
                      showToast("Error syncing offline changes", "error");
                    }
                  }}
                >
                  Sync Offline Changes
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      <ConflictResolutionModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        currentData={conflictData.current}
        serverData={conflictData.server}
        onUseServer={handleUseServerVersion}
        onUseLocal={handleUseLocalVersion}
      />
    </div>
  );
}
