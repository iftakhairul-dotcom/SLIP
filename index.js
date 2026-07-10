/**
 * Firebase Cloud Function: generateFbPost
 * ---------------------------------------------------------------------
 * Purpose: keep the OpenAI API key on the server, never in the browser.
 * The web app sends the signed-in user's Firebase ID token plus the
 * project description; this function verifies the token, then calls
 * OpenAI itself and returns just the generated text.
 *
 * Deploy:
 *   1. cd functions
 *   2. npm install
 *   3. Set your OpenAI key as a secret (recommended) or config value:
 *        firebase functions:secrets:set OPENAI_API_KEY
 *   4. firebase deploy --only functions
 *   5. Copy the deployed HTTPS URL into js/firebase-config.js
 *      (generatePostEndpoint).
 * ---------------------------------------------------------------------
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

exports.generateFbPost = onRequest(
  { secrets: [OPENAI_API_KEY], cors: true, timeoutSeconds: 30 },
  (req, res) => {
    cors(req, res, async () => {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST." });
      }

      // ---- Verify the caller is a signed-in SLIP user ------------------
      const authHeader = req.headers.authorization || "";
      const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!idToken) {
        return res.status(401).json({ error: "Missing auth token." });
      }
      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (e) {
        return res.status(401).json({ error: "Invalid or expired session. Please sign in again." });
      }

      // ---- Validate input ----------------------------------------------
      const projectData = (req.body && req.body.projectData || "").trim();
      if (!projectData) {
        return res.status(400).json({ error: "Please describe the project before generating a post." });
      }

      // ---- Call OpenAI with the server-held key -------------------------
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert BD Real Estate Strategist writing trustworthy, " +
                  "compliant Facebook posts for a Bangladeshi land-share investment platform. " +
                  "Structure posts cleanly, incorporating call-to-actions, clear layout blocks, " +
                  "and suggest placeholders for high-conversion property imagery/visual mockups.",
              },
              { role: "user", content: `Create a high-trust FB post structure for: ${projectData}` },
            ],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          return res.status(502).json({ error: `AI service returned an error (code ${response.status}).` });
        }

        const data = await response.json();
        const post = data?.choices?.[0]?.message?.content?.trim();
        if (!post) {
          return res.status(502).json({ error: "Could not read the AI response." });
        }

        return res.status(200).json({ post });
      } catch (e) {
        return res.status(500).json({ error: "Network error contacting the AI service." });
      }
    });
  }
);
