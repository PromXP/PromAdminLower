// app/api/send/route.js
import { Resend } from 'resend'
console.log("✅ RESEND_API_KEY available:", !!process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY); // ✅ best practice

export async function POST(req) {
  try {
    const { email, subject, message } = await req.json();

    const data = await resend.emails.send({
      from: 'Xolabs Health <ronaldshawv@thewad.co>',
      to: email, // ✅ dynamic recipient
      subject,
      html: `<div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <tr>
      <td style="background-color: #4f46e5; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">🏥 Welcome to Parvathy Hospital</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <p style="font-size: 16px; color: #333;">Dear Patient,</p>
        <p style="font-size: 16px; color: #333;">
          ${message}
        </p>
        <p style="margin-top: 30px; text-align: center;">
          <a href="https://promwebforms.onrender.com" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px;">
            Click here to Open The Questionaire
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #777;">
        ©2024 <a href="https://thexolabs.in" style="color: #777; text-decoration: none;">XoLabs.in</a>. All rights reserved.
      </td>
    </tr>
  </table>
</div>
`, // ✅ dynamic message
    });
    console.log("DATA",data)

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}