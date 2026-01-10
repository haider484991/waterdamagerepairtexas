import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.CONTACT_EMAIL || process.env.GMAIL_USER;

  if (!user || !pass || !to) {
    return NextResponse.json(
      { error: "Email configuration missing on server" },
      { status: 500 }
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const emailSubject = subject && subject.trim().length > 0 ? subject : "Contact Form Submission";
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Water Damage Repair USA";

    // HTML template for business owner
    const ownerEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Contact Form Submission</h1>
                    <p style="margin: 10px 0 0; color: #d4af37; font-size: 14px;">${siteName}</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">You have received a new message through your contact form:</p>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #d4af37; margin-bottom: 15px;">
                          <p style="margin: 0 0 8px; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Name</p>
                          <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">${name}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #d4af37; margin-bottom: 15px;">
                          <p style="margin: 0 0 8px; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Email</p>
                          <p style="margin: 0; color: #1a1a1a; font-size: 16px;">
                            <a href="mailto:${email}" style="color: #d4af37; text-decoration: none;">${email}</a>
                          </p>
                        </td>
                      </tr>
                      ${subject && subject.trim().length > 0 ? `
                      <tr>
                        <td style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #d4af37; margin-bottom: 15px;">
                          <p style="margin: 0 0 8px; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Subject</p>
                          <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">${subject}</p>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 15px; background-color: #f9f9f9; border-left: 4px solid #d4af37;">
                          <p style="margin: 0 0 8px; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Message</p>
                          <p style="margin: 0; color: #1a1a1a; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                      <a href="mailto:${email}" style="display: inline-block; padding: 12px 30px; background-color: #d4af37; color: #1a1a1a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Reply to ${name}</a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #1a1a1a; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">This email was sent from your contact form on ${siteName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // HTML template for confirmation email to sender
    const confirmationEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Contacting Us</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Thank You, ${name}!</h1>
                    <p style="margin: 15px 0 0; color: #d4af37; font-size: 16px;">We've received your message</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">Thank you for reaching out to us through ${siteName}. We have successfully received your message and will get back to you as soon as possible.</p>
                    
                    <div style="background-color: #f9f9f9; border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      <p style="margin: 0 0 10px; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Your Message</p>
                      <p style="margin: 0; color: #1a1a1a; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                    </div>
                    
                    <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">We typically respond within 24-48 hours. If your inquiry is urgent, please feel free to contact us directly.</p>
                    
                    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e5e5; text-align: center;">
                      <p style="margin: 0 0 15px; color: #999999; font-size: 12px;">Need immediate assistance?</p>
                      <a href="mailto:${to}" style="display: inline-block; padding: 12px 30px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Contact Us Directly</a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #1a1a1a; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">This is an automated confirmation email from ${siteName}</p>
                    <p style="margin: 10px 0 0; color: #666666; font-size: 11px;">Please do not reply to this email. If you need to contact us, use the button above.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Plain text versions for email clients that don't support HTML
    const ownerEmailText = `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}${subject ? `\nSubject: ${subject}` : ''}\n\nMessage:\n${message}`;
    const confirmationEmailText = `Thank you, ${name}!\n\nWe've received your message and will get back to you as soon as possible.\n\nYour message:\n${message}\n\nThank you for contacting ${siteName}.`;

    // Send email to business owner
    await transporter.sendMail({
      from: `"${siteName}" <${user}>`,
      to,
      replyTo: email,
      subject: `New Contact: ${emailSubject}`,
      text: ownerEmailText,
      html: ownerEmailHtml,
    });

    // Send confirmation email to the sender
    await transporter.sendMail({
      from: `"${siteName}" <${user}>`,
      to: email,
      subject: `Thank you for contacting ${siteName}`,
      text: confirmationEmailText,
      html: confirmationEmailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email failed:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}

