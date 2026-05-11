import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email service config
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
const fromEmail =
  Deno.env.get("RESEND_FROM_EMAIL") || "ElevenFinance <noreply@elevenfinance.com>";

// Retry configuration for email sending
const EMAIL_MAX_RETRIES = 3;
const EMAIL_RETRY_DELAY_MS = 1000;

/**
 * Send email with retry logic (3 attempts)
 * Tries Resend first, falls back to SendGrid if Resend fails or is unavailable
 */
async function sendEmailWithRetry(
  to: string,
  ticker: string,
  targetPrice: number,
  currentPrice: number,
  direction: string
): Promise<boolean> {
  for (let attempt = 1; attempt <= EMAIL_MAX_RETRIES; attempt++) {
    console.log(`Email attempt ${attempt}/${EMAIL_MAX_RETRIES} to ${to} for ${ticker}`);

    try {
      // Try Resend first if API key is available
      if (resendApiKey) {
        const resendResult = await sendViaResend(
          to,
          ticker,
          targetPrice,
          currentPrice,
          direction
        );
        if (resendResult) {
          console.log(`Email sent via Resend to ${to}`);
          return true;
        }
        console.warn(
          `Resend attempt ${attempt} failed, ${
            sendgridApiKey ? "trying SendGrid" : "no fallback available"
          }`
        );
      }

      // Fallback to SendGrid if Resend failed or not configured
      if (sendgridApiKey) {
        const sendgridResult = await sendViaSendGrid(
          to,
          ticker,
          targetPrice,
          currentPrice,
          direction
        );
        if (sendgridResult) {
          console.log(`Email sent via SendGrid to ${to}`);
          return true;
        }
        console.warn(`SendGrid attempt ${attempt} failed`);
      }

      // If no email service is configured
      if (!resendApiKey && !sendgridApiKey) {
        console.error(
          "No email service configured (RESEND_API_KEY or SENDGRID_API_KEY missing)"
        );
        return false;
      }
    } catch (error) {
      console.error(`Email attempt ${attempt} error:`, error);
    }

    // Wait before retrying (exponential backoff)
    if (attempt < EMAIL_MAX_RETRIES) {
      await new Promise((resolve) =>
        setTimeout(resolve, EMAIL_RETRY_DELAY_MS * attempt)
      );
    }
  }

  console.error(`Failed to send email to ${to} after ${EMAIL_MAX_RETRIES} attempts`);
  return false;
}

async function sendViaResend(
  to: string,
  ticker: string,
  targetPrice: number,
  currentPrice: number,
  direction: string
): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `⚠️ Price Alert Triggered: ${ticker}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Price Alert Triggered</h2>
            <p>Your price alert for <strong>${ticker}</strong> has been triggered.</p>
            <ul>
              <li><strong>Current Price:</strong> R$ ${currentPrice.toFixed(2)}</li>
              <li><strong>Target Price:</strong> R$ ${targetPrice.toFixed(2)}</li>
              <li><strong>Direction:</strong> ${
          direction === "above" ? "Above target" : "Below target"
        }</li>
            </ul>
            <p>This alert is now marked as triggered and will no longer be active.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Resend API error: ${response.status} ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Resend request failed:", error);
    return false;
  }
}

async function sendViaSendGrid(
  to: string,
  ticker: string,
  targetPrice: number,
  currentPrice: number,
  direction: string
): Promise<boolean> {
  try {
    const response = await fetch(
      "https://api.sendgrid.com/v3/mail/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: {
            email: fromEmail.replace(/.*<(.+)>/, "$1"),
          },
          subject: `⚠️ Price Alert Triggered: ${ticker}`,
          content: [
            {
              type: "text/html",
              value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Price Alert Triggered</h2>
              <p>Your price alert for <strong>${ticker}</strong> has been triggered.</p>
              <ul>
                <li><strong>Current Price:</strong> R$ ${currentPrice.toFixed(2)}</li>
                <li><strong>Target Price:</strong> R$ ${targetPrice.toFixed(2)}</li>
                <li><strong>Direction:</strong> ${
              direction === "above" ? "Above target" : "Below target"
            }</li>
              </ul>
              <p>This alert is now marked as triggered and will no longer be active.</p>
            </div>
          `,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SendGrid API error: ${response.status} ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("SendGrid request failed:", error);
    return false;
  }
}

/**
 * Get current price for a ticker using Yahoo Finance API
 * Reuses the same data source as the rest of the project (yahoo-finance2 equivalent via direct API)
 */
async function getTickerPrice(ticker: string): Promise<number | null> {
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const response = await fetch(yahooUrl);

    if (!response.ok) {
      console.error(
        `Failed to fetch price for ${ticker}: ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    const currentPrice =
      data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (!currentPrice) {
      console.error(`No price data found for ${ticker}`);
      return null;
    }

    return Number(currentPrice);
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    return null;
  }
}

serve(async () => {
  const startTime = new Date();
  console.log(
    `[${startTime.toISOString()}] Starting send-price-alert Edge Function`
  );

  try {
    // 1. Fetch all active (non-triggered) price alerts (idempotent: only triggered_at IS NULL)
    console.log("Fetching active price alerts...");
    const { data: alerts, error: alertsError } = await supabase
      .from("price_alerts")
      .select(
        `
        id,
        user_id,
        ticker,
        target_price,
        direction,
        user:auth.users ( email )
      `
      )
      .is("triggered_at", null);

    if (alertsError) {
      throw new Error(
        `Failed to fetch alerts: ${alertsError.message}`
      );
    }

    if (!alerts || alerts.length === 0) {
      console.log("No active alerts to process");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active alerts to process",
          processed: 0,
          timestamp: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${alerts.length} active alerts to process`);

    let processedCount = 0;
    let triggeredCount = 0;
    let emailSuccessCount = 0;
    let emailFailCount = 0;

    // 2. Process each alert
    for (const alert of alerts) {
      try {
        console.log(
          `Processing alert ${alert.id} for ticker ${alert.ticker}`
        );

        // Get current price
        const currentPrice = await getTickerPrice(alert.ticker);
        if (currentPrice === null) {
          console.warn(
            `Skipping alert ${alert.id}: could not fetch price for ${alert.ticker}`
          );
          continue;
        }

        // Check if alert condition is met
        let shouldTrigger = false;
        if (
          alert.direction === "above" &&
          currentPrice >= alert.target_price
        ) {
          shouldTrigger = true;
        } else if (
          alert.direction === "below" &&
          currentPrice <= alert.target_price
        ) {
          shouldTrigger = true;
        }

        if (!shouldTrigger) {
          console.log(
            `Alert ${alert.id} not triggered: current price ${currentPrice} does not meet ${alert.direction} ${alert.target_price}`
          );
          continue;
        }

        triggeredCount++;
        console.log(
          `Alert ${alert.id} triggered! Current price: ${currentPrice}, Target: ${alert.target_price}`
        );

        // Get user email
        const userEmail = alert.user?.email;
        if (!userEmail) {
          console.error(
            `Skipping alert ${alert.id}: no email found for user ${alert.user_id}`
          );
          continue;
        }

        // Send email with retry logic
        const emailSent = await sendEmailWithRetry(
          userEmail,
          alert.ticker,
          Number(alert.target_price),
          currentPrice,
          alert.direction
        );

        if (!emailSent) {
          emailFailCount++;
          console.error(
            `Failed to send email for alert ${alert.id}, skipping triggered_at update`
          );
          continue;
        }

        emailSuccessCount++;

        // Update alert as triggered (idempotent: only update if still not triggered)
        const { error: updateError } = await supabase
          .from("price_alerts")
          .update({ triggered_at: new Date().toISOString() })
          .eq("id", alert.id)
          .is("triggered_at", null); // Extra idempotency check

        if (updateError) {
          console.error(
            `Failed to update triggered_at for alert ${alert.id}:`,
            updateError.message
          );
        } else {
          console.log(`Alert ${alert.id} marked as triggered`);
        }

        processedCount++;
      } catch (alertError) {
        console.error(`Error processing alert ${alert.id}:`, alertError);
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(
      `
      [${endTime.toISOString()}] Completed send-price-alert Edge Function
      Duration: ${duration}ms
      Alerts processed: ${processedCount}
      Alerts triggered: ${triggeredCount}
      Emails sent successfully: ${emailSuccessCount}
      Email failures: ${emailFailCount}
    `
    );

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        triggered: triggeredCount,
        emailSuccess: emailSuccessCount,
        emailFail: emailFailCount,
        durationMs: duration,
        timestamp: endTime.toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});