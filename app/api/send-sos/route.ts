import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const { patientName, location, condition, contactNumber } = await request.json();

    if (!process.env.EMERGENCY_EMAIL_TO) {
      throw new Error('Emergency email recipient not configured');
    }

    // Create email content
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.EMERGENCY_EMAIL_TO,
      subject: `🚨 MEDICAL EMERGENCY: ${patientName}`,
      html: `
        <h1 style="color: #ff0000;">MEDICAL EMERGENCY ALERT</h1>
        <div style="font-size: 16px; margin: 20px 0;">
          <p><strong>Patient:</strong> ${patientName}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Condition:</strong> ${condition}</p>
          <p><strong>Contact Number:</strong> ${contactNumber}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p style="color: #ff0000; font-weight: bold;">
          This is an emergency alert. Please respond immediately.
        </p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Emergency alert sent successfully',
    });
  } catch (error) {
    console.error('Failed to send emergency alert:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send emergency alert',
      },
      { status: 500 }
    );
  }
}
