"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Activity,
  AlertCircle,
  PlusCircle,
  Stethoscope,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import SOSButton from "@/components/SOSButton";

interface DoctorVisit {
  id: string;
  visit_date: string;
  doctor_name: string;
  specialty: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  reason: string;
  follow_up_date: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [aiReport, setAiReport] = useState<{
    currentStatus: string;
    healthSummary: string;
    treatmentPlan: string;
    medicationAnalysis: string;
  }>({
    currentStatus: "",
    healthSummary: "",
    treatmentPlan: "",
    medicationAnalysis: "",
  });
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    fetchVisitsAndGenerateReport();
  }, [user]);

  const fetchVisitsAndGenerateReport = async () => {
    try {
      setLoading(true);

      // 1. Fetch doctor visits
      const { data: visitData, error: visitError } = await supabase
        .from("doctor_visits")
        .select("*")
        .eq("user_id", user?.id)
        .order("visit_date", { ascending: false });

      if (visitError) throw visitError;
      setVisits(visitData || []);

      // 2. Fetch medical profile data
      const { data: profileData, error: profileError } = await supabase
        .from("medical_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      // 3. Fetch CBC values if available
      const { data: cbcData, error: cbcError } = await supabase
        .from("cbc_values")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (cbcError) {
        throw cbcError;
      }

      // 4. Generate AI health report if we have data
      if (visitData && visitData.length > 0) {
        const report = await generateAIHealthReport(
          visitData,
          profileData,
          cbcData?.[0]
        );
        setAiReport(report);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIHealthReport = async (
    visits: DoctorVisit[],
    profile: any,
    cbcData: any
  ) => {
    try {
      // Use our API route instead of direct Gemini API call
      const response = await fetch("/api/ai-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visits,
          profile,
          cbcData,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating AI report:", error);
      return {
        currentStatus:
          "<p>Error generating report. Please try again later.</p>",
        healthSummary:
          "<p>Error generating report. Please try again later.</p>",
        treatmentPlan:
          "<p>Error generating report. Please try again later.</p>",
        medicationAnalysis:
          "<p>Error generating report. Please try again later.</p>",
      };
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
        <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/doctor-visits/new" className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              New Visit
            </Link>
          </Button>
          <SOSButton />
        </div>
      </div>

      {/* Latest Visit Summary Card */}
      {visits.length > 0 && (
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-semibold">Latest Doctor Visit</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4" />
                <p>{format(new Date(visits[0].visit_date), "PPP")}</p>
              </div>
              <p>
                <span className="font-medium">Doctor:</span>{" "}
                {visits[0].doctor_name}
              </p>
              {visits[0].specialty && (
                <p>
                  <span className="font-medium">Specialty:</span>{" "}
                  {visits[0].specialty}
                </p>
              )}
              {visits[0].diagnosis && (
                <p>
                  <span className="font-medium">Diagnosis:</span>{" "}
                  {visits[0].diagnosis}
                </p>
              )}
            </div>
            <div className="space-y-2">
              {visits[0].prescription && (
                <p>
                  <span className="font-medium">Prescription:</span>{" "}
                  {visits[0].prescription}
                </p>
              )}
              {visits[0].follow_up_date && (
                <p>
                  <span className="font-medium">Follow-up:</span>{" "}
                  {format(new Date(visits[0].follow_up_date), "PPP")}
                </p>
              )}
              <Link
                href="/doctor-visits"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <FileText className="h-4 w-4" />
                <span>View all visits</span>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* AI Health Report Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Current Health Status */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Current Health Status</h2>
          </div>
          {aiReport.currentStatus ? (
            <div
              className="prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: aiReport.currentStatus }}
            />
          ) : (
            <p className="text-gray-600">
              No health status available. Please add doctor visits for AI
              analysis.
            </p>
          )}
        </Card>

        {/* Health Summary */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-semibold">Health Summary</h2>
          </div>
          {aiReport.healthSummary ? (
            <div
              className="prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: aiReport.healthSummary }}
            />
          ) : (
            <p className="text-gray-600">
              No health summary available. Please add more doctor visits for AI
              analysis.
            </p>
          )}
        </Card>
      </div>

      {/* Treatment Plan & Medication Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Treatment Plan */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-semibold">Treatment Plan</h2>
          </div>
          {aiReport.treatmentPlan ? (
            <div
              className="prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: aiReport.treatmentPlan }}
            />
          ) : (
            <p className="text-gray-600">
              No treatment plan available. Please add more doctor visits for AI
              analysis.
            </p>
          )}
        </Card>

        {/* Medication Analysis */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold">Medication Analysis</h2>
          </div>
          {aiReport.medicationAnalysis ? (
            <div
              className="prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: aiReport.medicationAnalysis }}
            />
          ) : (
            <p className="text-gray-600">
              No medication analysis available. Please add more doctor visits
              for AI analysis.
            </p>
          )}
        </Card>
      </div>

      {/* No Data Message */}
      {visits.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Stethoscope className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Health Data Available
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Add your doctor visits to receive AI-generated health analysis and
            recommendations.
          </p>
          <Button asChild>
            <Link
              href="/doctor-visits/new"
              className="flex items-center gap-2 justify-center"
            >
              <PlusCircle className="h-5 w-5" />
              Add Your First Doctor Visit
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
