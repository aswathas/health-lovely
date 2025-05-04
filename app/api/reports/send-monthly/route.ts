import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import nodemailer from "nodemailer";

// Update the transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports like 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Required for Gmail
  tls: {
    rejectUnauthorized: false,
  },
});

// Update the sendEmail function with better error handling
async function sendEmail(to: string, subject: string, html: string) {
  try {
    console.log("Attempting to send email via SMTP...");
    console.log(
      `Host: ${process.env.SMTP_HOST}, Port: ${process.env.SMTP_PORT}`
    );
    console.log(`Recipient: ${to}`);

    // Create email options
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: html,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("SMTP Error details:", error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_PORT ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASSWORD
    ) {
      console.error("SMTP settings not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestData = await request.json();
    const { emailAddress, includeDetails, includePrescriptions } = requestData;

    if (!emailAddress) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Get the user's visits
    const { data: visits, error: visitsError } = await supabase
      .from("doctor_visits")
      .select("*")
      .eq("user_id", user.id)
      .order("visit_date", { ascending: false });

    if (visitsError) {
      return NextResponse.json(
        { error: "Failed to fetch visits" },
        { status: 500 }
      );
    }

    // Filter visits for the previous month
    const today = new Date();
    const firstDay = startOfMonth(subDays(today, 30));
    const lastDay = endOfMonth(subDays(today, 30));

    const monthlyVisits = visits.filter((visit) => {
      const visitDate = new Date(visit.visit_date);
      return visitDate >= firstDay && visitDate <= lastDay;
    });

    // Generate HTML report with proper styling
    let html = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1 { color: #2563eb; }
          .visit { border: 1px solid #ddd; margin-bottom: 15px; padding: 15px; border-radius: 5px; }
          .visit h3 { margin-top: 0; color: #1e40af; }
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
          "PPP"
        )} to ${format(lastDay, "PPP")}.</p>
        
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
              "PPP"
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

        if (includePrescriptions && visit.prescription) {
          html += `
            <div class="section">
              <span class="section-title">Prescription:</span>
              ${visit.prescription}
            </div>
          `;
        }

        if (includeDetails && visit.notes) {
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
              ${format(new Date(visit.follow_up_date), "PPP")}
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
            "PPP"
          )}.</p>
          <p>Your health is important to us. Remember to schedule your regular check-ups!</p>
        </div>
      </body>
      </html>
    `;

    // Send the email using the SOS email configuration
    const subject = `Your Health Report for ${format(firstDay, "MMMM yyyy")}`;
    const sent = await sendEmail(emailAddress, subject, html);

    if (sent) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error sending monthly report:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
