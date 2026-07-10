import { generatePostEndpoint } from "./firebase-config.js";

export function renderAiTab(container, getIdToken, showToast) {
  container.innerHTML = `
    <div class="card">
      <p class="title-lg">Describe the project or offer</p>
      <textarea class="field-input" id="ai-input" placeholder="e.g. 3 remaining land shares in Uttara Sector 17, 1450 sqft units, ready in 18 months"></textarea>
      <button class="btn-primary" id="ai-generate-btn" style="margin-top:14px">
        <span class="btn-label">Generate post</span>
        <span class="btn-spinner" hidden></span>
      </button>
      <div id="ai-error" class="form-error" hidden></div>
      <div id="ai-output" class="ai-output" hidden></div>
    </div>
  `;

  const btn = container.querySelector("#ai-generate-btn");
  const input = container.querySelector("#ai-input");
  const errorBox = container.querySelector("#ai-error");
  const output = container.querySelector("#ai-output");

  btn.addEventListener("click", async () => {
    const projectData = input.value.trim();
    errorBox.hidden = true;
    output.hidden = true;

    if (!projectData) {
      errorBox.textContent = "Please describe the project before generating a post.";
      errorBox.hidden = false;
      return;
    }

    btn.disabled = true;
    btn.querySelector(".btn-spinner").hidden = false;
    btn.querySelector(".btn-label").textContent = "Generating...";

    try {
      const idToken = await getIdToken();
      const res = await fetch(generatePostEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The Cloud Function verifies this token so only signed-in SLIP
          // users can trigger a (billable) generation request.
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ projectData }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `AI service returned an error (code ${res.status}).`);
      }

      const data = await res.json();
      output.textContent = data.post || "(empty response)";
      output.hidden = false;
    } catch (e) {
      errorBox.textContent = e.message || "Could not generate a post. Please try again.";
      errorBox.hidden = false;
    } finally {
      btn.disabled = false;
      btn.querySelector(".btn-spinner").hidden = true;
      btn.querySelector(".btn-label").textContent = "Generate post";
    }
  });
}
