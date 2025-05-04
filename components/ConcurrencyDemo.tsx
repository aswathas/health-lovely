"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export default function ConcurrencyDemo({ visitId }: { visitId: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const supabase = createClientComponentClient();

  // Reset the demo
  const resetDemo = async () => {
    try {
      // Reset version to 1
      await supabase
        .from("doctor_visits")
        .update({ version: 1 })
        .eq("id", visitId);

      setLogs(["Demo reset - version set to 1"]);
      toast.success("Demo reset successfully");
    } catch (error: any) {
      toast.error("Failed to reset demo");
    }
  };

  // Run the full demo simulation
  const runDemo = async () => {
    setIsRunning(true);
    setLogs(["Starting concurrency demonstration..."]);

    try {
      // Step 1: Get current record
      setLogs((prev) => [...prev, "Step 1: Getting current record..."]);
      const { data: visit } = await supabase
        .from("doctor_visits")
        .select("*")
        .eq("id", visitId)
        .single();

      if (!visit) {
        throw new Error("Visit not found");
      }

      setLogs((prev) => [...prev, `Record found: version ${visit.version}`]);

      // Step 2: Open two "sessions" - simulate two browser tabs
      setLogs((prev) => [
        ...prev,
        "Step 2: Simulating two users opening the same record",
      ]);

      // Session 1 reads the record
      const session1Version = visit.version;
      setLogs((prev) => [
        ...prev,
        `Session 1: Opened record (version ${session1Version})`,
      ]);

      // Session 2 reads the record
      const session2Version = visit.version;
      setLogs((prev) => [
        ...prev,
        `Session 2: Opened record (version ${session2Version})`,
      ]);

      // Step 3: Session 1 makes and saves changes
      setLogs((prev) => [...prev, "Step 3: Session 1 making changes..."]);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: session1Update, error: session1Error } = await supabase
        .from("doctor_visits")
        .update({
          notes: `${visit.notes || ""} [Updated by Session 1]`,
          version: session1Version + 1,
        })
        .eq("id", visitId)
        .eq("version", session1Version)
        .select();

      if (session1Error) {
        setLogs((prev) => [
          ...prev,
          `Session 1 update failed: ${session1Error.message}`,
        ]);
      } else {
        setLogs((prev) => [
          ...prev,
          `Session 1: Successfully updated to version ${session1Version + 1}`,
        ]);
      }

      // Step 4: Session 2 tries to save changes (should fail due to version mismatch)
      setLogs((prev) => [
        ...prev,
        "Step 4: Session 2 now trying to save changes...",
      ]);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: session2Update, error: session2Error } = await supabase
        .from("doctor_visits")
        .update({
          notes: `${visit.notes || ""} [Updated by Session 2]`,
          version: session2Version + 1,
        })
        .eq("id", visitId)
        .eq("version", session2Version)
        .select();

      if (session2Error) {
        setLogs((prev) => [
          ...prev,
          `Session 2 update failed: ${session2Error.message}`,
        ]);
      } else if (!session2Update || session2Update.length === 0) {
        setLogs((prev) => [
          ...prev,
          "Session 2: Version conflict detected! No rows were updated.",
          "Session 2: Fetching the latest version from server...",
        ]);

        // Fetch latest version
        const { data: latestRecord } = await supabase
          .from("doctor_visits")
          .select("*")
          .eq("id", visitId)
          .single();

        setLogs((prev) => [
          ...prev,
          `Session 2: Server has version ${latestRecord?.version}`,
        ]);
        setLogs((prev) => [
          ...prev,
          "Session 2: Showing conflict resolution UI to user...",
        ]);

        // Simulate conflict resolution
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLogs((prev) => [...prev, "Session 2: User chose to merge changes"]);

        // Apply merged changes
        const { error: mergeError } = await supabase
          .from("doctor_visits")
          .update({
            notes: `${
              latestRecord?.notes || ""
            } [+ Session 2 changes (merged)]`,
            version: (latestRecord?.version || 1) + 1,
          })
          .eq("id", visitId)
          .eq("version", latestRecord?.version)
          .select();

        if (mergeError) {
          setLogs((prev) => [...prev, `Merge failed: ${mergeError.message}`]);
        } else {
          setLogs((prev) => [
            ...prev,
            "Session 2: Successfully merged changes",
          ]);
        }
      } else {
        setLogs((prev) => [
          ...prev,
          `Session 2: Updated to version ${session2Version + 1} (unexpected)`,
        ]);
      }

      // Demo complete
      setLogs((prev) => [
        ...prev,
        "Demo completed! Concurrency control worked as expected.",
      ]);
    } catch (error: any) {
      setLogs((prev) => [...prev, `Error: ${error.message}`]);
      toast.error(`Demo error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="border rounded-md p-4 bg-white">
      <h2 className="text-lg font-medium mb-4">Interactive Concurrency Demo</h2>

      <div className="space-x-2 mb-4">
        <Button onClick={runDemo} disabled={isRunning}>
          {isRunning ? "Running..." : "Run Demo"}
        </Button>
        <Button variant="outline" onClick={resetDemo} disabled={isRunning}>
          Reset Demo
        </Button>
      </div>

      <div className="bg-gray-50 p-3 rounded border max-h-80 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Click "Run Demo" to start the demonstration
          </p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-sm">
                {log.includes("Error") || log.includes("failed") ? (
                  <p className="text-red-600">{log}</p>
                ) : log.includes("Success") || log.includes("completed") ? (
                  <p className="text-green-600">{log}</p>
                ) : (
                  <p>{log}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
