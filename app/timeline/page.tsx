"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HealthScoreGraph from "@/components/timeline/HealthScoreGraph";

interface TimelineEvent {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string;
  metadata: any;
  healthScore?: {
    score: number;
    analysis: string;
  };
}

interface HealthScoreDataPoint {
  date: string;
  score: number;
  diagnosis: string;
  doctor: string;
  analysis?: string;
}

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthScores, setHealthScores] = useState<HealthScoreDataPoint[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const { user } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user) {
      fetchTimelineData();
    }
  }, [user]);

  const fetchTimelineData = async () => {
    try {
      setLoading(true);

      // Fetch doctor visits and ORDER BY visit_date ASCENDING
      const { data: visitsData, error: visitsError } = await supabase
        .from("doctor_visits")
        .select("*")
        .eq("user_id", user?.id)
        .order("visit_date", { ascending: true }); // Changed to ascending

      if (visitsError) throw visitsError;

      // Process visits into timeline events
      const timelineEvents: TimelineEvent[] =
        visitsData?.map((visit) => ({
          id: visit.id,
          date: visit.visit_date,
          type: "doctor_visit",
          title: `Doctor Visit: ${visit.doctor_name}`,
          description: visit.diagnosis || "No diagnosis provided",
          metadata: {
            doctor_name: visit.doctor_name,
            specialty: visit.specialty,
            reason: visit.reason,
            diagnosis: visit.diagnosis,
            prescription: visit.prescription,
            notes: visit.notes,
          },
        })) || [];

      setEvents(timelineEvents);

      // Calculate health scores for doctor visits
      await calculateHealthScores(visitsData || []);
    } catch (error) {
      console.error("Error fetching timeline data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScores = async (visits: any[]) => {
    try {
      setLoadingScores(true);

      const scorePromises = visits.map(async (visit) => {
        // Skip if there's no diagnosis
        if (!visit.diagnosis) {
          return {
            date: visit.visit_date,
            score: 50, // Default neutral score
            diagnosis: "No diagnosis provided",
            doctor: visit.doctor_name,
          };
        }

        // Call our API to get health score for this diagnosis
        const response = await fetch("/api/health-score", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            diagnosis: visit.diagnosis,
            visitDetails: {
              reason: visit.reason,
              prescription: visit.prescription,
              notes: visit.notes,
            },
            visitId: visit.id, // Add this to identify the visit
          }),
        });

        if (!response.ok) {
          console.error("Failed to analyze diagnosis:", visit.diagnosis);
          return {
            date: visit.visit_date,
            score: 50, // Default neutral score
            diagnosis: visit.diagnosis,
            doctor: visit.doctor_name,
          };
        }

        const scoreData = await response.json();
        return {
          date: visit.visit_date,
          score: scoreData.score,
          diagnosis: visit.diagnosis,
          doctor: visit.doctor_name,
          analysis: scoreData.analysis,
        };
      });

      const scores = await Promise.all(scorePromises);
      setHealthScores(scores);
    } catch (error) {
      console.error("Error calculating health scores:", error);
    } finally {
      setLoadingScores(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Health Timeline</h1>

      <Tabs defaultValue="graph">
        <TabsList className="mb-6">
          <TabsTrigger value="graph">Health Progression</TabsTrigger>
          <TabsTrigger value="timeline">Timeline Events</TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="space-y-6">
          <Card className="p-6">
            <HealthScoreGraph
              healthScores={healthScores}
              isLoading={loadingScores}
            />
          </Card>

          {healthScores.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Health Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">
                    Latest Health Score
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {healthScores.length > 0
                      ? healthScores.sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )[0].score
                      : "N/A"}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">
                    Average Score
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {healthScores.length > 0
                      ? Math.round(
                          healthScores.reduce(
                            (acc, curr) => acc + curr.score,
                            0
                          ) / healthScores.length
                        )
                      : "N/A"}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Health Trend</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {(() => {
                      if (healthScores.length < 2) return "Not enough data";

                      const sortedScores = [...healthScores].sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                      );

                      const firstScore = sortedScores[0].score;
                      const lastScore =
                        sortedScores[sortedScores.length - 1].score;

                      const change = Math.round(
                        ((lastScore - firstScore) / firstScore) * 100
                      );

                      if (change > 5) return `Improving (+${change}%)`;
                      if (change < -5) return `Declining (${change}%)`;
                      return "Stable";
                    })()}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="p-6">
            <div className="space-y-8">
              {events.length > 0 ? (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="relative pl-8 pb-8 border-l-2 border-gray-200 last:border-0"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-[-8px] w-4 h-4 bg-blue-500 rounded-full"></div>

                    <div className="mb-1 text-sm text-gray-500">
                      {format(new Date(event.date), "PPP")}
                    </div>
                    <h3 className="text-lg font-medium">{event.title}</h3>
                    <p className="text-gray-700 mt-1">{event.description}</p>

                    {event.type === "doctor_visit" && (
                      <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                        {event.metadata.specialty && (
                          <p className="text-sm">
                            <span className="font-medium">Specialty:</span>{" "}
                            {event.metadata.specialty}
                          </p>
                        )}
                        {event.metadata.prescription && (
                          <p className="text-sm">
                            <span className="font-medium">Prescription:</span>{" "}
                            {event.metadata.prescription}
                          </p>
                        )}
                        {event.metadata.notes && (
                          <p className="text-sm">
                            <span className="font-medium">Notes:</span>{" "}
                            {event.metadata.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No events in your timeline yet
                  </p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
