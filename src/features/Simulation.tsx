import { congestion, type Scenario } from "../lib/intelligence";
import { Badge, dateTime } from "../components/common";
import scenarios from "../data/ferry_scenarios.json";
export function Simulation({
  scenario,
  setScenario,
}: {
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
}) {
  const result = congestion(scenario);
  return (
    <section className="card simulation">
      <div className="row between">
        <div>
          <span className="eyebrow">CAPACITY, EXPLAINED</span>
          <h2>Explore a different scenario</h2>
        </div>
        <Badge tone="warning">DEMO / SIMULATED</Badge>
      </div>
      <p>
        Assumed tourism demand, not live visitor counts or an official ferry
        schedule.
      </p>
      <div className="filter-chips">
        {scenarios.map((sc) => (
          <button key={sc.name} onClick={() => setScenario({ ...sc })}>
            {sc.name}
          </button>
        ))}
      </div>
      <div className="scenario-inputs">
        {(
          [
            ["baselineDemand", "Baseline demand"],
            ["seasonalMultiplier", "Seasonal multiplier"],
            ["extraVisitors", "Additional visitors"],
            ["assumedCapacity", "Assumed capacity"],
            ["availableServiceFraction", "Service fraction"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min="0"
              max={key === "availableServiceFraction" ? 1 : 100000}
              step={
                key === "availableServiceFraction" ||
                key === "seasonalMultiplier"
                  ? 0.1
                  : 1
              }
              value={scenario[key]}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (
                  Number.isFinite(n) &&
                  n >= 0 &&
                  (key !== "availableServiceFraction" || n <= 1)
                )
                  setScenario({ ...scenario, [key]: n });
              }}
            />
          </label>
        ))}
      </div>
      <div className="metric-grid">
        <div>
          <small>Modeled demand</small>
          <strong>{result.modeledDemand.toFixed(0)}</strong>
        </div>
        <div>
          <small>Available capacity</small>
          <strong>{result.availableCapacity.toFixed(0)}</strong>
        </div>
        <div>
          <small>Utilization</small>
          <strong>{result.utilizationPercent.toFixed(1)}%</strong>
        </div>
        <div>
          <small>Congestion</small>
          <Badge
            tone={
              result.category === "HIGH"
                ? "danger"
                : result.category === "LOW"
                  ? "success"
                  : "warning"
            }
          >
            {result.category}
          </Badge>
        </div>
      </div>
      <small>
        Demand = baseline × seasonal multiplier + additional visitors. Capacity
        = assumed capacity × service fraction. LOW &lt;70%; MODERATE 70–100%;
        HIGH &gt;100%. Assumptions are user-editable. Scenario evaluated{" "}
        {dateTime(new Date().toISOString())}.
      </small>
    </section>
  );
}
