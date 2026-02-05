 // @deno-types="npm:@types/node"
 import { Resend } from "https://esm.sh/resend@4.0.0";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface EmailRequest {
   candidateEmail: string;
   candidateName: string;
   jobTitle: string;
   status: "shortlisted" | "hired" | "rejected";
   companyName?: string;
 }
 
 const getEmailContent = (
   candidateName: string,
   jobTitle: string,
   status: string,
   companyName: string
 ) => {
   const statusMessages = {
     shortlisted: {
       subject: `Great news! You've been shortlisted for ${jobTitle}`,
       heading: "You've Been Shortlisted! 🎉",
       message: `We're excited to inform you that your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has been shortlisted.`,
       nextSteps: "Our hiring team will be in touch soon with next steps. Please keep an eye on your inbox for further communication.",
       color: "#f59e0b",
     },
     hired: {
       subject: `Congratulations! You've been hired for ${jobTitle}`,
       heading: "Congratulations, You're Hired! 🎊",
       message: `We are thrilled to offer you the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>!`,
       nextSteps: "Our team will reach out shortly with onboarding details and your offer letter. Welcome to the team!",
       color: "#10b981",
     },
     rejected: {
       subject: `Update on your application for ${jobTitle}`,
       heading: "Application Update",
       message: `Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>. After careful consideration, we have decided to move forward with other candidates.`,
       nextSteps: "We encourage you to apply for future openings that match your skills. We wish you the best in your job search.",
       color: "#6b7280",
     },
   };
 
   const content = statusMessages[status as keyof typeof statusMessages];
 
   return {
     subject: content.subject,
     html: `
       <!DOCTYPE html>
       <html>
         <head>
           <meta charset="utf-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
         </head>
         <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
           <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">TalentFlow</h1>
           </div>
           
           <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none;">
             <h2 style="color: ${content.color}; margin-top: 0; font-size: 22px;">${content.heading}</h2>
             
             <p style="color: #475569; font-size: 16px;">Hi ${candidateName},</p>
             
             <p style="color: #475569; font-size: 16px;">${content.message}</p>
             
             <div style="background: #f8fafc; border-left: 4px solid ${content.color}; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
               <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Next Steps:</strong></p>
               <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">${content.nextSteps}</p>
             </div>
             
             <p style="color: #475569; font-size: 16px;">Best regards,<br><strong>The ${companyName} Hiring Team</strong></p>
           </div>
           
           <div style="background: #f1f5f9; padding: 20px 30px; border-radius: 0 0 12px 12px; text-align: center;">
             <p style="color: #94a3b8; font-size: 12px; margin: 0;">
               This email was sent via TalentFlow. Please do not reply directly to this email.
             </p>
           </div>
         </body>
       </html>
     `,
   };
 };
 
 Deno.serve(async (req) => {
   // Handle CORS preflight
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
 
   try {
     // Verify authentication
     const authHeader = req.headers.get("Authorization");
     if (!authHeader?.startsWith("Bearer ")) {
       console.error("Missing or invalid authorization header");
       return new Response(
         JSON.stringify({ error: "Unauthorized" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const supabase = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_ANON_KEY")!,
       { global: { headers: { Authorization: authHeader } } }
     );
 
     const token = authHeader.replace("Bearer ", "");
     const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
     
     if (claimsError || !claimsData?.user) {
       console.error("Auth error:", claimsError);
       return new Response(
         JSON.stringify({ error: "Unauthorized" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const { candidateEmail, candidateName, jobTitle, status, companyName = "Our Company" }: EmailRequest = await req.json();
 
     console.log(`Sending ${status} email to ${candidateEmail} for job: ${jobTitle}`);
 
     // Validate required fields
     if (!candidateEmail || !candidateName || !jobTitle || !status) {
       console.error("Missing required fields:", { candidateEmail, candidateName, jobTitle, status });
       return new Response(
         JSON.stringify({ error: "Missing required fields" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Validate status
     if (!["shortlisted", "hired", "rejected"].includes(status)) {
       console.error("Invalid status:", status);
       return new Response(
         JSON.stringify({ error: "Invalid status. Must be shortlisted, hired, or rejected" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const emailContent = getEmailContent(candidateName, jobTitle, status, companyName);
 
     const { data, error } = await resend.emails.send({
       from: "TalentFlow <onboarding@resend.dev>", // Replace with your verified domain
       to: [candidateEmail],
       subject: emailContent.subject,
       html: emailContent.html,
     });
 
     if (error) {
       console.error("Resend error:", error);
       return new Response(
         JSON.stringify({ error: error.message }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     console.log("Email sent successfully:", data);
 
     return new Response(
       JSON.stringify({ success: true, id: data?.id }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error: any) {
     console.error("Error in send-candidate-email:", error);
     return new Response(
       JSON.stringify({ error: error.message || "Failed to send email" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });