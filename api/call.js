import twilio from "twilio";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    const { to } = req.body;

    if (!to) {
        return res.status(400).json({ error: "Missing number" });
    }

    try {
        const client = twilio(
            process.env.TWILIO_SID,
            process.env.TWILIO_TOKEN
        );

        const call = await client.calls.create({
            to: to,
            from: process.env.TWILIO_FROM,
            url: "https://handler.twilio.com/twiml/EH3cc6fe5e47bd99f2f4b62cee9f2ac85c"
        });

        return res.json({ success: true, sid: call.sid });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
