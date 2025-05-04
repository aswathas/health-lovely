"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";

export default function ConcurrencyTestTool({ visitId }: { visitId?: string }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const supabase = createClientComponentClient();
  const { showToast } = useToast();

  // Simulates concurrent edits on the same record
  const runConcurrencyTest = async () => {
    if (!visitId) {
      showToast("Please select a doctor visit to test", "error");
      return;
    }

    setRunning(true);
    setResults(["Starting concurrency test..."]);

    try {
      // Get the current visit
      const { data: visit } = await supabase
        .from("doctor_visits")
        .select("*")
        .eq("id", visitId)
        .single();

      if (!visit) {
        throw new Error("Visit not found");
      }

      setResults((prev) => [...prev, `Current version: ${visit.version || 1}`]);

      // Simulate 3 concurrent updates
      const updates = [
        { notes: visit.notes + " - Update 1", version: visit.version },
        { notes: visit.notes + " - Update 2", version: visit.version },
        { notes: visit.notes + " - Update 3", version: visit.version },
      ];

      // Run updates with a slight delay between them
      const results = await Promise.all(
        updates.map(
          (update, i) =>
            new Promise((resolve) => {
              setTimeout(async () => {
                try {
                  setResults((prev) => [
                    ...prev,
                    `Attempt ${i + 1}: Updating with version ${update.version}`,
                  ]);

                  const { data, error } = await supabase
                    .from("doctor_visits")
                    .update({
                      notes: update.notes,
                      version: update.version + 1,
                    })
                    .eq("id", visitId)
                    .eq("version", update.version)
                    .select();

                  if (error) {
                    setResults((prev) => [
                      ...prev,
                      `Attempt ${i + 1}: Failed - ${error.message}`,
                    ]);
                    resolve({ success: false, error });
                  } else if (data && data.length > 0) {
                    setResults((prev) => [
                      ...prev,
                      `Attempt ${i + 1}: Success! Updated to version ${
                        update.version + 1
                      }`,
                    ]);
                    resolve({ success: true, data });
                  } else {
                    setResults((prev) => [
                      ...prev,
                      `Attempt ${i + 1}: Failed - Version conflict detected`,
                    ]);
                    resolve({ success: false, reason: "Version conflict" });
                  }
                } catch (err) {
                  resolve({ success: false, error: err });
                }
              }, i * 500); // Stagger the requests
            })
        )
      );

      // Get final version
      const { data: finalVisit } = await supabase
        .from("doctor_visits")
        .select("*")
        .eq("id", visitId)
        .single();

      const successCount = results.filter((r: any) => r.success).length;

      setResults((prev) => [
        ...prev,
        `Test completed: ${successCount}/3 updates succeeded`,
        `Final version: ${finalVisit?.version || "unknown"}`,
      ]);
    } catch (error: any) {
      setResults((prev) => [...prev, `Test error: ${error.message}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="p-4 mb-4">
      <h3 className="font-bold mb-2">Concurrency Test Tool</h3>
      <p className="text-sm text-gray-600 mb-4">
        This tool demonstrates concurrency control by simulating multiple
        simultaneous updates to the same record. Only one update should succeed
        while others will receive version conflicts.
      </p>

      <Button onClick={runConcurrencyTest} disabled={running || !visitId}>
        {running ? "Running Test..." : "Run Concurrency Test"}
      </Button>

      {results.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-sm max-h-60 overflow-auto">
          {results.map((result, i) => (
            <div key={i} className="mb-1">
              {result.includes("Success") ? (
                <span className="text-green-600">{result}</span>
              ) : result.includes("Failed") || result.includes("error") ? (
                <span className="text-red-600">{result}</span>
              ) : (
                <span>{result}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
