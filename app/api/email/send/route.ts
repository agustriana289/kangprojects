import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/utils/supabase/server";
import { createDecipheriv } from "crypto";

export const maxDuration = 60;

const CIPHER_KEY = (process.env.EMAIL_CIPHER_KEY || "").padEnd(32, "0").slice(0, 32);
const CIPHER_IV = (process.env.EMAIL_CIPHER_IV || "").padEnd(16, "0").slice(0, 16);

function decryptPassword(encrypted: string): string {
  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(CIPHER_KEY), Buffer.from(CIPHER_IV));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function fillTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let to = "";
    let fromDomainId = "";
    let templateId = "";
    let placeholders: Record<string, string> = {};
    let attachmentBuffer: Buffer | null = null;
    let attachmentName = "";
    let isBroadcast = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      to = formData.get("to") as string;
      fromDomainId = formData.get("fromDomainId") as string;
      templateId = formData.get("templateId") as string;
      const rawPlaceholders = formData.get("placeholders") as string;
      if (rawPlaceholders) placeholders = JSON.parse(rawPlaceholders);
      isBroadcast = formData.get("isBroadcast") === "true";

      const attachment = formData.get("attachment") as File | null;
      if (attachment && attachment.size > 0) {
        const maxSize = 4 * 1024 * 1024; // 4MB
        if (attachment.size > maxSize) {
          return NextResponse.json({ error: `File terlalu besar. Maksimal 4MB, file Anda ${(attachment.size / (1024 * 1024)).toFixed(2)}MB` }, { status: 413 });
        }
        const arrayBuffer = await attachment.arrayBuffer();
        attachmentBuffer = Buffer.from(arrayBuffer);
        attachmentName = attachment.name;
      }
    } else {
      const body = await req.json();
      to = body.to;
      fromDomainId = body.fromDomainId;
      templateId = body.templateId;
      placeholders = body.placeholders || {};
      isBroadcast = body.isBroadcast === true || body.isBroadcast === "true";
    }

    if (!to || !templateId) {
      return NextResponse.json({ error: "Field 'to' dan 'templateId' wajib diisi." }, { status: 400 });
    }

    const supabase = await createClient();

    const [{ data: settings }, { data: domainRow }, { data: template }] = await Promise.all([
      supabase.from("email_settings").select("gmail_address, gmail_app_password_encrypted").eq("id", 1).single(),
      fromDomainId
        ? supabase.from("email_domains").select("domain, display_name").eq("id", fromDomainId).single()
        : supabase.from("email_domains").select("domain, display_name").eq("is_default", true).single(),
      supabase.from("email_templates").select("subject, body_html").eq("id", templateId).single(),
    ]);

    if (!settings?.gmail_address || !settings?.gmail_app_password_encrypted) {
      return NextResponse.json({ error: "Kredensial Gmail belum dikonfigurasi di pengaturan email." }, { status: 400 });
    }

    if (!template) {
      return NextResponse.json({ error: "Template email tidak ditemukan." }, { status: 404 });
    }

    const appPassword = decryptPassword(settings.gmail_app_password_encrypted);

    const fromAddress = domainRow?.domain
      ? `${domainRow.display_name || domainRow.domain} <${domainRow.domain}>`
      : `${settings.gmail_address} <${settings.gmail_address}>`;

    const subject = fillTemplate(template.subject, placeholders);
    const html = fillTemplate(template.body_html, placeholders);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: settings.gmail_address,
        pass: appPassword,
      },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: fromAddress,
      subject,
      html,
    };

    if (isBroadcast) {
      mailOptions.to = fromAddress;
      mailOptions.bcc = to;
    } else {
      mailOptions.to = to;
    }

    if (attachmentBuffer && attachmentName) {
      mailOptions.attachments = [
        {
          filename: attachmentName,
          content: attachmentBuffer,
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Email berhasil dikirim." });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal mengirim email." }, { status: 500 });
  }
}
