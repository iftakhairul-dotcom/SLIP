// Mirrors SLIPFinance.calculateComparison from the mobile app's
// roi_engine.dart: A = P * (1 + r/n)^(n*t)
function calculateComparison({ principal, years, bankRate, slipRate, compounding }) {
  if (principal <= 0) throw new Error("Principal must be greater than zero.");
  if (years <= 0) throw new Error("Years must be greater than zero.");

  const bankFinal = principal * Math.pow(1 + bankRate / compounding, compounding * years);
  const slipFinal = principal * Math.pow(1 + slipRate / compounding, compounding * years);

  return {
    bankResult: bankFinal,
    slipResult: slipFinal,
    surplus: slipFinal - bankFinal,
  };
}

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
}).format;

const state = {
  principal: 1000000,
  years: 5,
  bankRate: 0.085,
  slipRate: 0.15,
  compounding: 1,
};

export function renderRoiTab(container) {
  container.innerHTML = `
    <div class="hero-card">
      <div class="row-between">
        <p class="title-lg">Investment Amount</p>
        <strong id="principal-label" style="color:var(--gold-light)"></strong>
      </div>
      <input type="range" id="principal-slider" min="100000" max="20000000" step="100000" />

      <hr class="divider-line" />
      <p class="title-lg" id="years-label"></p>
      <input type="range" id="years-slider" min="1" max="20" step="1" />

      <hr class="divider-line" />
      <p class="title-lg" id="bank-rate-label"></p>
      <input type="range" id="bank-rate-slider" min="0.04" max="0.15" step="0.001" />

      <hr class="divider-line" />
      <p class="title-lg" id="slip-rate-label"></p>
      <input type="range" id="slip-rate-slider" min="0.05" max="0.30" step="0.001" />

      <hr class="divider-line" />
      <p class="title-lg">Amortization / Compounding</p>
      <div class="chip-row">
        <div class="chip" data-freq="1">Annual</div>
        <div class="chip" data-freq="12">Monthly</div>
      </div>
    </div>

    <div id="roi-results"></div>
  `;

  const els = {
    principalSlider: container.querySelector("#principal-slider"),
    principalLabel: container.querySelector("#principal-label"),
    yearsSlider: container.querySelector("#years-slider"),
    yearsLabel: container.querySelector("#years-label"),
    bankSlider: container.querySelector("#bank-rate-slider"),
    bankLabel: container.querySelector("#bank-rate-label"),
    slipSlider: container.querySelector("#slip-rate-slider"),
    slipLabel: container.querySelector("#slip-rate-label"),
    chips: container.querySelectorAll(".chip"),
    results: container.querySelector("#roi-results"),
  };

  function sync() {
    els.principalSlider.value = state.principal;
    els.principalLabel.textContent = currency(state.principal);
    els.yearsSlider.value = state.years;
    els.yearsLabel.textContent = `Time Horizon: ${state.years} years`;
    els.bankSlider.value = state.bankRate;
    els.bankLabel.textContent = `Bank FDR Rate: ${(state.bankRate * 100).toFixed(1)}%`;
    els.slipSlider.value = state.slipRate;
    els.slipLabel.textContent = `SLIP Return Rate: ${(state.slipRate * 100).toFixed(1)}%`;
    els.chips.forEach((c) => c.classList.toggle("selected", Number(c.dataset.freq) === state.compounding));
    renderResults();
  }

  function renderResults() {
    try {
      const r = calculateComparison({
        principal: state.principal,
        years: state.years,
        bankRate: state.bankRate,
        slipRate: state.slipRate,
        compounding: state.compounding,
      });
      els.results.innerHTML = `
        <div class="result-card">
          <div class="result-icon">🏦</div>
          <div class="result-label">Bank FDR Result</div>
          <div class="result-value">${currency(r.bankResult)}</div>
        </div>
        <div class="result-card highlight">
          <div class="result-icon">🗺️</div>
          <div class="result-label">SLIP Land Share Result</div>
          <div class="result-value">${currency(r.slipResult)}</div>
        </div>
        <div class="result-card">
          <div class="result-icon">📈</div>
          <div class="result-label">Projected Surplus vs. Bank</div>
          <div class="result-value">${currency(r.surplus)}</div>
        </div>
        <p class="disclaimer">ⓘ Figures are projections based on chosen rate inputs and structural
          compounding choices. All investments possess risk.</p>
      `;
    } catch (e) {
      els.results.innerHTML = `<div class="form-error" style="margin-top:12px">${e.message}</div>`;
    }
  }

  els.principalSlider.addEventListener("input", (e) => { state.principal = Number(e.target.value); sync(); });
  els.yearsSlider.addEventListener("input", (e) => { state.years = Number(e.target.value); sync(); });
  els.bankSlider.addEventListener("input", (e) => { state.bankRate = Number(e.target.value); sync(); });
  els.slipSlider.addEventListener("input", (e) => { state.slipRate = Number(e.target.value); sync(); });
  els.chips.forEach((chip) => chip.addEventListener("click", () => {
    state.compounding = Number(chip.dataset.freq);
    sync();
  }));

  sync();
}
