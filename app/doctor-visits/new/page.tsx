"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { checkAllergicMedicines } from "@/utils/allergicMedicines";
interface NewVisitForm {
  doctor_name: string;
  specialty: string;
  visit_date: string;
  reason: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  follow_up_date: string;
}

export default function NewDoctorVisit() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NewVisitForm>({
    doctor_name: "",
    specialty: "",
    visit_date: new Date().toISOString().split("T")[0],
    reason: "",
    diagnosis: "",
    prescription: "",
    notes: "",
    follow_up_date: "",
  });
  const [allergicWarnings, setAllergicWarnings] = useState<string[]>([]);

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        showToast("Please sign in to add a visit", "error");
        router.push("/auth/login");
        return;
      }

      // Validate required fields
      if (!formData.doctor_name || !formData.visit_date) {
        showToast("Please fill in all required fields", "error");
        setLoading(false);
        return;
      }

      // Include version field for concurrency control
      const visitData = {
        ...formData,
        user_id: user.id,
        version: 1, // Initial version
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insert with better error handling
      const { data, error } = await supabase
        .from("doctor_visits")
        .insert([visitData])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message || "Failed to add visit");
      }

      showToast("Visit added successfully", "success");
      router.push("/doctor-visits");
    } catch (error: any) {
      console.error(
        "Error adding visit:",
        error instanceof Error ? error.message : JSON.stringify(error)
      );
      showToast(
        error instanceof Error ? error.message : "Failed to add visit",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Check for allergic medicines when prescription changes
    if (name === "prescription") {
      const allergicMeds = checkAllergicMedicines(value);
      setAllergicWarnings(allergicMeds);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild>
            <Link href="/doctor-visits" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Visits
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">New Doctor Visit</h1>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="doctor_name">Doctor Name *</Label>
                <Input
                  id="doctor_name"
                  name="doctor_name"
                  value={formData.doctor_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit_date">Visit Date *</Label>
                <Input
                  type="date"
                  id="visit_date"
                  name="visit_date"
                  value={formData.visit_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  type="date"
                  id="follow_up_date"
                  name="follow_up_date"
                  value={formData.follow_up_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescription">Prescription</Label>
              <Textarea
                id="prescription"
                name="prescription"
                value={formData.prescription}
                onChange={handleInputChange}
                rows={3}
              />
              {allergicWarnings.length > 0 && (
                <div className="mt-2 p-3 bg-red-100 text-red-700 rounded-md">
                  <p className="font-medium">
                    Warning: Allergic Medicines Detected!
                  </p>
                  <p className="text-sm">
                    The following medicines are known allergens:
                  </p>
                  <ul className="list-disc list-inside text-sm">
                    {allergicWarnings.map((med) => (
                      <li key={med}>{med}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/doctor-visits")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding Visit..." : "Add Visit"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
