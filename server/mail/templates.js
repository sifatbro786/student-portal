import "server-only";

// Plain HTML + inline CSS, brand colours. Every dynamic value goes through esc().
const esc = (v) =>
    String(v ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

function layout({ preheader, title, body }) {
    return `<!doctype html><html><body style="margin:0;background:#f6f2ea;font-family:Georgia,'Times New Roman',serif;color:#1f1a17">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f2ea;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbf9f4;border:1px solid #ddd3c3">
<tr><td style="background:#7a1e2b;padding:20px 28px;color:#f6f2ea;font-size:18px;font-weight:bold">Tauhid Mostafa
<div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#e9c98a;font-weight:bold;margin-top:4px">O-LEVEL ENGLISH LANGUAGE</div></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 6px;font-size:24px;font-weight:normal">${esc(title)}</h1>
<div style="width:48px;height:2px;background:#b8893a;margin:14px 0 20px"></div>
<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f1a17">${body}</div>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #ddd3c3;font-family:Arial,sans-serif;font-size:12px;color:#6b625a">
This is an automated message. Please don't reply to it directly.</td></tr>
</table></td></tr></table></body></html>`;
}

const row = (k, v) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#6b625a;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:4px 0">${esc(v)}</td></tr>`;

/** @type {Record<string, (d: any) => { subject: string, html: string, text: string }>} */
export const templates = {
    "admission.received.admin": (d) => ({
        subject: `New admission: ${d.fullName} (${d.className}) — ${d.refNo}`,
        html: layout({
            preheader: `${d.fullName} applied for ${d.className}`,
            title: "New admission application",
            body: `<table role="presentation" style="border-collapse:collapse">${row("Reference", d.refNo)}${row("Name", d.fullName)}${row("Class", d.className)}${row("Preferred batch", d.batchName || "—")}${row("WhatsApp", d.whatsapp)}${row("Test score", `${d.score}%`)}</table>
<p style="margin-top:20px"><a href="${esc(d.link)}" style="background:#7a1e2b;color:#f6f2ea;padding:10px 18px;text-decoration:none;display:inline-block">Review application</a></p>`,
        }),
        text: `New admission ${d.refNo}\n${d.fullName} — ${d.className}\nWhatsApp: ${d.whatsapp}\nScore: ${d.score}%\nReview: ${d.link}`,
    }),

    "admission.received.applicant": (d) => ({
        subject: `We received your application — ${d.refNo}`,
        html: layout({
            preheader: `Your reference number is ${d.refNo}`,
            title: `Thank you, ${d.firstName}.`,
            body: `<p>We have received your admission application for <strong>${esc(d.className)}</strong>.</p>
<p style="font-size:13px;color:#6b625a;margin-bottom:4px">Your reference number</p>
<p style="font-family:'Courier New',monospace;font-size:20px;margin-top:0;color:#7a1e2b">${esc(d.refNo)}</p>
<p>The office will review it and contact you on WhatsApp or by email to confirm your batch. Please keep the reference number for any questions.</p>
${d.phone ? `<p style="color:#6b625a">Questions? Call or WhatsApp ${esc(d.phone)}.</p>` : ""}`,
        }),
        text: `Thank you, ${d.firstName}. We received your application for ${d.className}. Reference: ${d.refNo}. The office will contact you to confirm your batch.`,
    }),

    // PRD §9 [DEFAULT]: never includes the password.
    "student.account.created": (d) => ({
        subject: "Your student account is ready",
        html: layout({
            preheader: "Sign in to see your batch notices, notes and results",
            title: `Welcome, ${d.firstName}.`,
            body: `<p>Your student account has been created.</p>
<table role="presentation" style="border-collapse:collapse">${row("Student ID", d.studentId)}${row("Class", d.className)}${row("Sign-in email", d.email)}</table>
<p>Collect your temporary password from the office. You will be asked to choose your own password the first time you sign in.</p>
<p style="margin-top:20px"><a href="${esc(d.loginUrl)}" style="background:#7a1e2b;color:#f6f2ea;padding:10px 18px;text-decoration:none;display:inline-block">Sign in</a></p>`,
        }),
        text: `Welcome, ${d.firstName}. Student ID: ${d.studentId}. Sign in with ${d.email} at ${d.loginUrl}. Collect your temporary password from the office.`,
    }),
};
