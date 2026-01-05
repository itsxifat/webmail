import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const body = await req.json();
    const { fromUser, fromDomain, password, to, subject, html } = body;

    // 1. Validation
    if (!fromUser || !fromDomain || !password || !to || !subject) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    // 2. Configure Transporter for Remote VPS
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // Uses the IP from .env
      port: 587,
      secure: false, // False for port 587 (uses STARTTLS)
      auth: {
        user: `${fromUser}@${fromDomain}`, 
        pass: password,
      },
      tls: {
        // Crucial for connecting to VPS via IP address
        rejectUnauthorized: false 
      }
    });

    // 3. Verify connection
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error("SMTP Connection Failed:", verifyError);
      return NextResponse.json(
        { success: false, error: "Could not connect to VPS SMTP. Check Port 587." },
        { status: 502 }
      );
    }

    // 4. Send the email
    const info = await transporter.sendMail({
      from: `"${fromUser}" <${fromUser}@${fromDomain}>`, 
      to: to,
      subject: subject,
      html: html || "<p>No content</p>",
    });

    console.log("Message sent: %s", info.messageId);

    return NextResponse.json({ 
      success: true, 
      message: "Email sent successfully", 
      messageId: info.messageId 
    });

  } catch (error) {
    console.error("API Send Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}