"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "react-hot-toast";

interface ReportSettingsType {
  includeDetails: boolean;
  includePrescriptions: boolean;
  frequency: "monthly" | "quarterly";
  deliveryDay: number; // Day of month to deliver report
  emailAddress: string;
}

export default function MonthlyReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [reportPreview, setReportPreview] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [settings, setSettings] = useState<ReportSettingsType>({
    includeDetails: true,
    includePrescriptions: true,
    frequency: "monthly",
    deliveryDay: 1, // First day of month
    emailAddress: "",
  });

  const supabase = createClientComponentClient();

  const generateReportHTML = async (visits: any[]) => {
    // Get current month's visits
    const today = new Date();
    const firstDay = startOfMonth(subDays(today, 30)); // Previous month
    const lastDay = endOfMonth(subDays(today, 30));

    const monthlyVisits = visits.filter((visit) => {
      const visitDate = new Date(visit.visit_date);
      return visitDate >= firstDay && visitDate <= lastDay;
    });

    let html = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1 { color: #2563eb; }
          .visit { border: 1px solid #ddd; margin-bottom: 15px; padding: 15px; border-radius: 5px; }
          .visit h3 { margin-top: 0; color: #1e40af; }
          .visit p { margin: 5px 0; }
          .visit-date { color: #6b7280; font-style: italic; }
          .section { margin-bottom: 10px; }
          .section-title { font-weight: bold; display: block; }
          .footer { margin-top: 30px; color: #6b7280; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>Your Monthly Health Report</h1>
        <p>Here's a summary of your doctor visits from ${format(
          firstDay,
          "PP"
        )} to ${format(lastDay, "PP")}.</p>
        
        <div class="summary">
          <p>Total visits this month: <strong>${
            monthlyVisits.length
          }</strong></p>
        </div>
    `;

    if (monthlyVisits.length === 0) {
      html += `<p>You had no doctor visits during this period.</p>`;
    } else {
      html += `<h2>Visit Details</h2>`;

      monthlyVisits.forEach((visit) => {
        html += `
          <div class="visit">
            <h3>${visit.doctor_name}</h3>
            <p class="visit-date">${format(
              new Date(visit.visit_date),
              "PP"
            )}</p>
            
            <div class="section">
              <span class="section-title">Specialty:</span> 
              ${visit.specialty || "Not specified"}
            </div>
            
            <div class="section">
              <span class="section-title">Reason for Visit:</span>
              ${visit.reason || "Not specified"}
            </div>
            
            <div class="section">
              <span class="section-title">Diagnosis:</span>
              ${visit.diagnosis || "Not specified"}
            </div>
        `;

        if (settings.includePrescriptions && visit.prescription) {
          html += `
            <div class="section">
              <span class="section-title">Prescription:</span>
              ${visit.prescription}
            </div>
          `;
        }

        if (settings.includeDetails && visit.notes) {
          html += `
            <div class="section">
              <span class="section-title">Notes:</span>
              ${visit.notes}
            </div>
          `;
        }

        if (visit.follow_up_date) {
          html += `
            <div class="section">
              <span class="section-title">Follow-up Date:</span>
              ${format(new Date(visit.follow_up_date), "PP")}
            </div>
          `;
        }

        html += `</div>`;
      });
    }

    html += `
        <div class="footer">
          <p>This report was automatically generated on ${format(
            new Date(),
            "PPpp"
          )}.</p>
          <p>Your health is important to us. Remember to schedule your regular check-ups!</p>
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const showToast = (message: string, type: "success" | "error" | "info") => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  const sendTestReport = async () => {
    try {
      if (!settings.emailAddress) {
        toast.error("Please enter an email address");
        return;
      }

      setLoading(true);
      showToast("Sending report to your email...", "info");

      // Call our API endpoint that uses nodemailer
      const response = await fetch("/api/reports/send-monthly", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailAddress: settings.emailAddress,
          includeDetails: settings.includeDetails,
          includePrescriptions: settings.includePrescriptions,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle HTTP errors
        throw new Error(result.error || `HTTP error ${response.status}`);
      }

      if (result.success) {
        showToast(
          "Monthly report sent successfully to " + settings.emailAddress,
          "success"
        );
      } else {
        throw new Error(result.error || "Failed to send report");
      }
    } catch (error: any) {
      console.error("Error sending report:", error);
      showToast(`Failed to send report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = () => {
    // In a real app, you would store this preference in the database
    setSubscribed(!subscribed);
    if (!subscribed) {
      toast.success("You've subscribed to monthly health reports!");
    } else {
      toast.success("You've unsubscribed from monthly health reports");
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h2 className="text-xl font-bold mb-4">Monthly Health Reports</h2>

      <p className="mb-6 text-gray-600">
        Receive a summary of your doctor visits each month directly to your
        email. This helps you keep track of your health history and upcoming
        appointments.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Report Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.includeDetails}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      includeDetails: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span>Include visit notes and details</span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.includePrescriptions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      includePrescriptions: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span>Include prescription information</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Report Frequency
              </label>
              <select
                value={settings.frequency}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    frequency: e.target.value as "monthly" | "quarterly",
                  })
                }
                className="w-full p-2 border rounded"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={settings.emailAddress}
                onChange={(e) =>
                  setSettings({ ...settings, emailAddress: e.target.value })
                }
                placeholder="your@email.com"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="pt-4 flex space-x-3">
              <Button
                variant={subscribed ? "outline" : "default"}
                onClick={toggleSubscription}
              >
                {subscribed ? "Unsubscribe" : "Subscribe"}
              </Button>

              <Button
                variant="outline"
                onClick={sendTestReport}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Test Report"}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Report Preview</h3>
          <div className="border rounded p-3 h-[300px] overflow-auto bg-gray-50">
            {reportPreview ? (
              <div
                dangerouslySetInnerHTML={{ __html: reportPreview }}
                className="text-sm"
              />
            ) : (
              <p className="text-gray-500 text-center mt-20">
                Click "Send Test Report" to see a preview
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
