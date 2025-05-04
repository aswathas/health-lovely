"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import ConcurrencyTestTool from "@/components/ConcurrencyTestTool";
import ConcurrencyMonitor from "@/components/ConcurrencyMonitor";

export default function ConcurrencyDemo() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [demoMode, setDemoMode] = useState<"basic" | "advanced" | "recovery">(
    "basic"
  );
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) loadVisits();
  }, [user]);

  const loadVisits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("doctor_visits")
        .select("*")
        .eq("user_id", user?.id)
        .order("visit_date", { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error: any) {
      showToast("Error loading visits: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Concurrency Control Demo</h1>

      <div className="mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="text-lg font-medium mb-2">About This Demo</h2>
          <p>
            This page demonstrates our implementation of concurrency control
            using optimistic locking with version numbers. The system prevents
            data corruption when multiple users attempt to update the same
            record simultaneously.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="text-xl font-bold mb-4">Select a Visit</h2>
            {loading ? (
              <p>Loading visits...</p>
            ) : visits.length === 0 ? (
              <p>No visits found. Please create a visit first.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {visits.map((visit) => (
                  <div
                    key={visit.id}
                    className={`p-3 border rounded cursor-pointer ${
                      selectedVisit?.id === visit.id
                        ? "bg-blue-50 border-blue-300"
                        : ""
                    }`}
                    onClick={() => setSelectedVisit(visit)}
                  >
                    <p className="font-medium">{visit.doctor_name}</p>
                    <p className="text-sm">
                      {new Date(visit.visit_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Version: {visit.version || 1}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded ${
                  demoMode === "basic"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setDemoMode("basic")}
              >
                Basic Demo
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  demoMode === "advanced"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setDemoMode("advanced")}
              >
                Advanced Demo
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  demoMode === "recovery"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setDemoMode("recovery")}
              >
                Recovery Demo
              </button>
            </div>
          </div>

          {selectedVisit ? (
            <Card className="p-4">
              {demoMode === "basic" && (
                <>
                  <h2 className="text-xl font-bold mb-4">
                    Basic Concurrency Test
                  </h2>
                  <ConcurrencyTestTool visitId={selectedVisit.id} />
                </>
              )}

              {demoMode === "advanced" && (
                <>
                  <h2 className="text-xl font-bold mb-4">
                    Advanced Concurrency Simulation
                  </h2>
                  <p className="mb-4">
                    This simulation shows how multiple clients handle version
                    conflicts:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border p-4 rounded">
                      <h3 className="font-medium mb-2">Client 1</h3>
                      <p className="mb-2">
                        Currently editing version {selectedVisit.version || 1}
                      </p>
                      <button
                        className="px-3 py-1 bg-blue-500 text-white rounded"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("concurrency-event", {
                              detail: {
                                id: crypto.randomUUID(),
                                type: "attempt",
                                timestamp: new Date(),
                                resource: `client-1`,
                                details: `Attempting to update from version ${selectedVisit.version}`,
                              },
                            })
                          );
                          setTimeout(() => {
                            window.dispatchEvent(
                              new CustomEvent("concurrency-event", {
                                detail: {
                                  id: crypto.randomUUID(),
                                  type: "success",
                                  timestamp: new Date(),
                                  resource: `client-1`,
                                  details: `Successfully updated to version ${
                                    selectedVisit.version + 1
                                  }`,
                                },
                              })
                            );
                          }, 1000);
                        }}
                      >
                        Save Changes
                      </button>
                    </div>

                    <div className="border p-4 rounded">
                      <h3 className="font-medium mb-2">Client 2</h3>
                      <p className="mb-2">
                        Currently editing version {selectedVisit.version || 1}
                      </p>
                      <button
                        className="px-3 py-1 bg-blue-500 text-white rounded"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("concurrency-event", {
                              detail: {
                                id: crypto.randomUUID(),
                                type: "attempt",
                                timestamp: new Date(),
                                resource: `client-2`,
                                details: `Attempting to update from version ${selectedVisit.version}`,
                              },
                            })
                          );
                          setTimeout(() => {
                            window.dispatchEvent(
                              new CustomEvent("concurrency-event", {
                                detail: {
                                  id: crypto.randomUUID(),
                                  type: "conflict",
                                  timestamp: new Date(),
                                  resource: `client-2`,
                                  details: `Version conflict detected: expected ${
                                    selectedVisit.version
                                  } but was ${selectedVisit.version + 1}`,
                                },
                              })
                            );
                            setTimeout(() => {
                              window.dispatchEvent(
                                new CustomEvent("concurrency-event", {
                                  detail: {
                                    id: crypto.randomUUID(),
                                    type: "resolution",
                                    timestamp: new Date(),
                                    resource: `client-2`,
                                    details: `Conflict resolved by merging changes`,
                                  },
                                })
                              );
                            }, 1500);
                          }, 1500);
                        }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </>
              )}

              {demoMode === "recovery" && (
                <>
                  <h2 className="text-xl font-bold mb-4">
                    Recovery Mechanism Demo
                  </h2>
                  <p>
                    This demonstrates how the system recovers from network
                    failures:
                  </p>
                  <div className="space-y-4">
                    <button
                      className="px-3 py-2 bg-red-500 text-white rounded"
                      onClick={() => {
                        showToast(
                          "Connection lost. Switching to offline mode...",
                          "error"
                        );
                        window.dispatchEvent(
                          new CustomEvent("concurrency-event", {
                            detail: {
                              id: crypto.randomUUID(),
                              type: "attempt",
                              timestamp: new Date(),
                              resource: `network`,
                              details: `Connection lost - saving changes locally`,
                            },
                          })
                        );

                        setTimeout(() => {
                          window.dispatchEvent(
                            new CustomEvent("concurrency-event", {
                              detail: {
                                id: crypto.randomUUID(),
                                type: "attempt",
                                timestamp: new Date(),
                                resource: `network`,
                                details: `Connection restored - syncing local changes`,
                              },
                            })
                          );

                          setTimeout(() => {
                            window.dispatchEvent(
                              new CustomEvent("concurrency-event", {
                                detail: {
                                  id: crypto.randomUUID(),
                                  type: "success",
                                  timestamp: new Date(),
                                  resource: `network`,
                                  details: `All changes successfully synced to server`,
                                },
                              })
                            );
                            showToast(
                              "Connection restored. All changes synced.",
                              "success"
                            );
                          }, 2000);
                        }, 3000);
                      }}
                    >
                      Simulate Network Failure & Recovery
                    </button>
                  </div>
                </>
              )}
            </Card>
          ) : (
            <Card className="p-4">
              <p>Please select a visit to begin the demo</p>
            </Card>
          )}
        </div>
      </div>

      <ConcurrencyMonitor />
    </div>
  );
}
