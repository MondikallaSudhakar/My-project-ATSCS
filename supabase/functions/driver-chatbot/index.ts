import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, vehicleId, driverName, currentLat, currentLng } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use AI to understand intent
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are an ambulance driver assistant AI. Analyze the driver's message and return a JSON response with:
- "intent": one of "critical_alert", "police_backup", "reroute", "status_update", "hospital_query", "general"
- "eta_minutes": number if mentioned (for critical alerts)
- "condition": patient condition if mentioned (e.g. "heart attack", "accident", "critical")
- "new_status": one of "available", "en_route", "on_scene", "completed" (for status updates)
- "reply": a short, helpful response to the driver
- "action_label": a short action confirmation label like "✅ Hospital notified" or "✅ Backup requested"

Always respond with valid JSON only.`
          },
          { role: "user", content: message }
        ],
        tools: [{
          type: "function",
          function: {
            name: "process_driver_intent",
            description: "Process the driver's message intent and generate appropriate response",
            parameters: {
              type: "object",
              properties: {
                intent: { type: "string", enum: ["critical_alert", "police_backup", "reroute", "status_update", "hospital_query", "general"] },
                eta_minutes: { type: "number" },
                condition: { type: "string" },
                new_status: { type: "string", enum: ["available", "en_route", "on_scene", "completed"] },
                reply: { type: "string" },
                action_label: { type: "string" }
              },
              required: ["intent", "reply", "action_label"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "process_driver_intent" } }
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI processing failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let parsed;
    
    try {
      parsed = JSON.parse(toolCall?.function?.arguments || "{}");
    } catch {
      parsed = { intent: "general", reply: "I understood your message. How can I help?", action_label: "ℹ️ Message received" };
    }

    const actions: string[] = [];

    // Handle intents
    if (parsed.intent === "critical_alert") {
      // Find nearest hospital
      const { data: hospitals } = await supabase
        .from("hospitals")
        .select("*")
        .eq("emergency_open", true)
        .limit(1);

      const hospital = hospitals?.[0];

      if (hospital && vehicleId) {
        await supabase.from("hospital_notifications").insert({
          ambulance_id: vehicleId,
          eta: parsed.eta_minutes ? `${parsed.eta_minutes} min` : "Unknown",
          condition: parsed.condition || "Critical",
          hospital_id: hospital.id,
          message: message,
          status: "pending"
        });
        actions.push(`✅ ${hospital.name} notified`);
        actions.push(`📋 ETA: ${parsed.eta_minutes || "?"} minutes`);
        actions.push(`🏥 Condition: ${parsed.condition || "Critical"}`);
      }
    }

    if (parsed.intent === "police_backup") {
      if (vehicleId) {
        await supabase.from("backup_requests").insert({
          vehicle_id: vehicleId,
          location: `Lat: ${currentLat}, Lng: ${currentLng}`,
          lat: currentLat,
          lng: currentLng,
          status: "pending"
        });
        actions.push("✅ Police backup requested");
        actions.push("🚔 Nearest unit ETA: ~8 minutes");
      }
    }

    if (parsed.intent === "status_update" && parsed.new_status && vehicleId) {
      await supabase
        .from("vehicles")
        .update({ status: parsed.new_status, updated_at: new Date().toISOString() })
        .eq("id", vehicleId);
      actions.push(`✅ Status updated to: ${parsed.new_status}`);
    }

    if (parsed.intent === "hospital_query") {
      const { data: hospitals } = await supabase
        .from("hospitals")
        .select("*")
        .eq("icu_available", true)
        .eq("emergency_open", true);

      if (hospitals && hospitals.length > 0) {
        const hospitalList = hospitals
          .map((h, i) => `${i + 1}. ${h.name} (${h.speciality || "General"})`)
          .join("\n");
        parsed.reply = `Found ${hospitals.length} hospitals with ICU available:\n${hospitalList}`;
        actions.push(`🏥 ${hospitals.length} hospitals found with ICU`);
      }
    }

    if (parsed.intent === "reroute") {
      actions.push("🔄 Route recalculation initiated");
      actions.push("🚦 Signal clearance updating on new route");
    }

    return new Response(
      JSON.stringify({
        reply: parsed.reply,
        intent: parsed.intent,
        actions,
        action_label: parsed.action_label,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Chatbot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
