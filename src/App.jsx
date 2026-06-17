import { useMemo, useState } from "react";
import { migrationData } from "./data/migrationData.js";

const yearOptions = [2021, 2022, 2023, 2024, 2025];
const genderOptions = ["Totale", "Femmine", "Maschi"];
const cohortPresets = [10_000, 50_000, 100_000, 500_000, 1_000_000];

const storySteps = [
  {
    title: "La presenza è stabile, non episodica",
    body: "Nel 2025 i residenti stranieri censiti superano i 5,37 milioni. Il dato racconta famiglie, lavoro, scuola, anagrafe: non soltanto arrivi.",
    focus: 2025,
  },
  {
    title: "I permessi lunghi contano",
    body: "La quota di lungo periodo nei permessi mostra percorsi amministrativi e biografici già radicati.",
    focus: 2024,
  },
  {
    title: "Uscire dalle statistiche non significa sparire",
    body: "Ogni anno molte persone acquisiscono la cittadinanza italiana: cambiano categoria statistica, non necessariamente paese.",
    focus: 2022,
  },
];

const glossary = [
  ["Straniero residente", "Persona senza cittadinanza italiana iscritta stabilmente in anagrafe."],
  ["Immigrato", "Persona iscritta in anagrafe provenendo dall'estero."],
  ["Emigrato", "Persona cancellata dall'anagrafe per trasferimento all'estero."],
  ["Permesso di soggiorno", "Titolo amministrativo che consente la permanenza regolare."],
  ["Acquisizione di cittadinanza", "Quando una persona diventa cittadina italiana."],
  ["Remigrazione", "Categoria politica usata spesso in modo ambiguo: va distinta da rimpatri e ritorni volontari."],
];

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: digits }).format(value);
}

function formatCompact(value) {
  if (Math.abs(value) >= 1_000_000) return `${formatNumber(value / 1_000_000, 2)} mln`;
  if (Math.abs(value) >= 1_000) return `${formatNumber(value / 1_000, 0)} mila`;
  return formatNumber(value);
}

function formatEuro(value) {
  return `€ ${formatNumber(value, 0)}`;
}

function formatEuroCompact(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `€ ${formatNumber(value / 1_000_000_000, 2)} mld`;
  if (abs >= 1_000_000) return `€ ${formatNumber(value / 1_000_000, 0)} mln`;
  if (abs >= 1_000) return `€ ${formatNumber(value / 1_000, 0)} mila`;
  return `€ ${formatNumber(value, 0)}`;
}

function scaleLinear(domain, range) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value) => r0 + ((value - d0) / span) * (r1 - r0);
}

function extent(values, pad = 0.08) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const delta = (max - min || max || 1) * pad;
  return [Math.max(0, min - delta), max + delta];
}

/* ---------- Tooltip overlay (positioned in viewBox percentages) ---------- */

function PlotTooltip({ x, y, vbWidth, vbHeight, align = "center", children }) {
  const style = {
    left: `${(x / vbWidth) * 100}%`,
    top: `${(y / vbHeight) * 100}%`,
  };
  return (
    <div className={`plot-tooltip align-${align}`} style={style} role="status">
      {children}
    </div>
  );
}

/* ---------- Decorative section dividers ("grafiche di passaggio") ---------- */

function SectionDivider({ variant = "route", label }) {
  return (
    <div className="section-divider" role="presentation" aria-hidden="true">
      <DividerArt variant={variant} />
      {label ? <span className="divider-label">{label}</span> : null}
      <DividerArt variant={variant} mirror />
    </div>
  );
}

function DividerArt({ variant, mirror = false }) {
  const transform = mirror ? "scale(-1,1) translate(-240,0)" : undefined;
  return (
    <svg className="divider-art" viewBox="0 0 240 40" xmlns="http://www.w3.org/2000/svg">
      <g transform={transform}>
        {variant === "route" ? (
          <>
            <line x1="6" y1="20" x2="216" y2="20" className="divider-line" strokeDasharray="2 7" />
            {[28, 86, 150, 210].map((cx) => (
              <circle key={cx} cx={cx} cy="20" r="3.4" className="divider-dot" />
            ))}
            <path d="M204 13 L216 20 L204 27" className="divider-arrow" />
          </>
        ) : null}
        {variant === "people" ? (
          <>
            {Array.from({ length: 12 }).map((_, i) => {
              const cx = 14 + i * 18;
              const filled = i % 5 === 0;
              return (
                <g key={cx} className={filled ? "divider-figure filled" : "divider-figure"}>
                  <circle cx={cx} cy="14" r="3.1" />
                  <path d={`M${cx - 4} 30 q4 -9 8 0`} />
                </g>
              );
            })}
          </>
        ) : null}
        {variant === "flow" ? (
          <>
            {[14, 40, 66, 92, 118, 144, 170, 196].map((x, i) => {
              const h = 6 + ((i * 7) % 22);
              return <rect key={x} x={x} y={30 - h} width="8" height={h} className={i % 3 === 0 ? "divider-bar accent" : "divider-bar"} rx="1" />;
            })}
          </>
        ) : null}
      </g>
    </svg>
  );
}

/* ---------- Broadsheet lead illustration (original line art) ---------- */

function CityLeadIllustration() {
  const people = [
    [120, 356, 6], [168, 360, 6], [230, 356, 6], [276, 360, 5],
    [330, 356, 6], [392, 360, 6], [452, 356, 6], [506, 360, 5],
  ];
  return (
    <svg className="lead-illustration" viewBox="0 0 620 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustrazione: una città italiana abitata, con sole arancione, persone e una bancarella">
      <circle cx="120" cy="70" r="20" className="il-orange" />
      <g className="il-line thin faint">
        <path d="M250 60 l34 -8 M278 52 l10 6 -10 5" />
        <path d="M470 92 l24 -6 M490 84 l9 6 -9 5" />
      </g>
      <g className="il-line">
        <rect x="70" y="150" width="48" height="170" />
        <path d="M70 150 l24 -26 l24 26" />
        <rect x="82" y="170" width="10" height="14" />
        <rect x="98" y="170" width="10" height="14" />
        <rect x="82" y="196" width="10" height="14" />
        <rect x="98" y="196" width="10" height="14" />
        <rect x="88" y="280" width="14" height="40" />
        <rect x="130" y="120" width="40" height="200" />
        <path d="M150 120 v-22" />
        <circle cx="150" cy="94" r="5" className="il-orange" />
        <path d="M210 320 V210 q40 -46 80 0 v110" />
        <path d="M250 210 V150" />
        <circle cx="250" cy="146" r="5" />
        <path d="M250 141 l4 -10 l4 10" />
        <path d="M210 250 h80 M210 285 h80" />
        <rect x="318" y="170" width="34" height="150" />
        <rect x="356" y="140" width="30" height="180" />
        <rect x="392" y="190" width="34" height="130" />
        <rect x="430" y="160" width="30" height="160" />
        <g className="thin">
          <path d="M324 190 h22 M324 210 h22 M324 230 h22 M362 165 h18 M362 188 h18 M362 212 h18 M398 212 h22 M398 232 h22 M436 188 h18 M436 212 h18" />
        </g>
        <rect x="470" y="120" width="40" height="200" />
        <circle cx="490" cy="150" r="12" />
        <path d="M490 150 v-7 M490 150 l6 3" />
        <path d="M470 120 l20 -20 l20 20" />
        <rect x="520" y="200" width="34" height="120" />
        <g className="thin">
          <path d="M526 220 h22 M526 244 h22 M526 268 h22" />
        </g>
      </g>
      <line x1="40" y1="320" x2="600" y2="320" className="il-line" />
      <g className="il-line thin">
        <path d="M150 320 v-26 m-10 14 q10 -18 20 0" />
        <path d="M560 320 v-24 m-9 12 q9 -16 18 0" />
      </g>
      <g className="il-line thin">
        {people.map(([cx, cy, r], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} />
            <path d={`M${cx} ${cy + r} v18 m0 -12 l-8 8 m8 -8 l8 8 m-8 12 l-6 16 m6 -16 l6 16`} />
            {i === 4 ? <circle cx={cx + 15} cy={cy + 12} r="4" className="il-orange" /> : null}
          </g>
        ))}
        <rect x="196" y="392" width="60" height="6" />
        <path d="M196 392 v22 M256 392 v22" />
        <circle cx="212" cy="386" r="3" className="il-orange" />
        <circle cx="226" cy="386" r="3" className="il-orange" />
        <circle cx="240" cy="386" r="3" className="il-orange" />
      </g>
    </svg>
  );
}

function NumbersBox() {
  const residenti = migrationData.kpis.find((k) => k.label === "residenti stranieri");
  const net = migrationData.flowByYear.at(-1).net;
  const occ = migrationData.laborRates.find((r) => r.metric === "Occupazione" && r.citizenship === "Stranieri")?.value ?? 66.8;
  const ret = migrationData.returnEconomics;
  const retRate = (ret.returnsFollowingOrder2024 / ret.ordersToLeave2024) * 100;
  const rows = [
    { value: residenti?.display ?? "5,37 mln", label: "residenti stranieri (2025)", accent: false },
    { value: `+${formatNumber(net)}`, label: "saldo anagrafico con l'estero", accent: true },
    { value: `${formatNumber(occ, 1)}%`, label: "occupazione stranieri 20–64", accent: false },
    { value: `${formatNumber(retRate, 0)}%`, label: "ordini di rimpatrio eseguiti, 2024", accent: true },
  ];
  return (
    <aside className="numbers-box" aria-label="I numeri del giorno">
      <h3>I numeri del giorno</h3>
      <p className="numbers-sub">Italia, ultimi dati disponibili</p>
      {rows.map((row) => (
        <div className="number-row" key={row.label}>
          <span className={`number-big ${row.accent ? "accent" : ""}`}>{row.value}</span>
          <span className="number-label">{row.label}</span>
        </div>
      ))}
      <a className="numbers-sim" href="#costi">Apri il simulatore costi →</a>
    </aside>
  );
}

function ChartShell({ title, subtitle, source, sourceUrl, children, className = "", controls }) {
  return (
    <figure className={`chart-shell ${className}`}>
      <figcaption>
        <div className="chart-caption-head">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          {controls ? <div className="chart-controls">{controls}</div> : null}
        </div>
      </figcaption>
      {children}
      {source ? (
        <p className="source-note">
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="source-link">
              {source}
              <span aria-hidden="true"> ↗</span>
            </a>
          ) : (
            source
          )}
        </p>
      ) : null}
    </figure>
  );
}

function ResidentLineChart({ selectedYear = 2025, compact = false }) {
  const data = migrationData.residentSeries;
  const [hover, setHover] = useState(null);
  const width = compact ? 680 : 820;
  const height = compact ? 320 : 380;
  const margin = { top: 28, right: 92, bottom: 48, left: 64 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const x = scaleLinear([data[0].year, data[data.length - 1].year], [margin.left, margin.left + innerWidth]);
  const y = scaleLinear(extent(data.map((item) => item.value), 0.06), [margin.top + innerHeight, margin.top]);
  const path = data.map((item, index) => `${index ? "L" : "M"}${x(item.year)},${y(item.value)}`).join(" ");
  const focus = data.find((item) => item.year === selectedYear) || data[data.length - 1];
  const calloutLeft = x(focus.year) > width - 280;
  const calloutX = calloutLeft ? -214 : 34;
  const leaderX = calloutLeft ? -36 : 42;
  const yTicks = [5_000_000, 5_200_000, 5_400_000];
  const active = hover != null ? data[hover] : null;

  return (
    <div className="plot-wrap">
      <svg className="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Linea dei residenti stranieri in Italia dal 2021 al 2025">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={margin.left + innerWidth} y1={y(tick)} y2={y(tick)} className="grid" />
            <text x={margin.left - 12} y={y(tick) + 4} textAnchor="end" className="axis-label">
              {formatCompact(tick)}
            </text>
          </g>
        ))}
        <path d={path} className="line line-main" />
        {data.map((item, index) => (
          <g key={item.year}>
            <line x1={x(item.year)} x2={x(item.year)} y1={margin.top + innerHeight} y2={margin.top + innerHeight + 6} className="tick" />
            <text x={x(item.year)} y={height - 16} textAnchor="middle" className="axis-label">
              {item.year}
            </text>
            <circle cx={x(item.year)} cy={y(item.value)} r={item.year === selectedYear ? 6 : 4} className={item.year === selectedYear ? "dot selected" : "dot"} />
            <circle
              cx={x(item.year)}
              cy={y(item.value)}
              r="20"
              fill="transparent"
              className="hit"
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
        <g transform={`translate(${x(focus.year)},${y(focus.value)})`}>
          <line x1="0" x2={leaderX} y1="-38" y2="-12" className="annotation-line" />
          <rect x={calloutX} y="-66" width="188" height="50" rx="6" className="annotation-box" />
          <text x={calloutX + 14} y="-44" className="annotation-title">{focus.year}</text>
          <text x={calloutX + 14} y="-26" className="annotation-text">{formatCompact(focus.value)} residenti</text>
        </g>
        <text x={margin.left + innerWidth - 154} y={y(data[data.length - 1].value) + 28} className="direct-label">
          residenti stranieri
        </text>
      </svg>
      {active ? (
        <PlotTooltip x={x(active.year)} y={y(active.value)} vbWidth={width} vbHeight={height}>
          <strong>{active.year}</strong>
          <span>{formatNumber(active.value)} residenti</span>
        </PlotTooltip>
      ) : null}
    </div>
  );
}

function FlowChart() {
  const data = migrationData.flowByYear;
  const series = [
    { key: "entered", label: "iscritti dall'estero", className: "line-main", dot: "dot" },
    { key: "left", label: "cancellati per estero", className: "line-muted", dot: "dot muted" },
    { key: "net", label: "saldo", className: "line-net", dot: "dot net" },
  ];
  const [visible, setVisible] = useState({ entered: true, left: true, net: false });
  const [hover, setHover] = useState(null);
  const width = 820;
  const height = 370;
  const margin = { top: 24, right: 132, bottom: 48, left: 64 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const x = scaleLinear([data[0].year, data[data.length - 1].year], [margin.left, margin.left + innerWidth]);
  const activeKeys = series.filter((s) => visible[s.key]).map((s) => s.key);
  const yValues = data.flatMap((item) => activeKeys.map((k) => item[k]));
  const y = scaleLinear(extent(yValues.length ? yValues : [0, 1], 0.12), [margin.top + innerHeight, margin.top]);
  const line = (key) => data.map((item, index) => `${index ? "L" : "M"}${x(item.year)},${y(item[key])}`).join(" ");
  const yTicks = [0, 150_000, 300_000, 450_000];
  const last = data[data.length - 1];
  const hovered = hover != null ? data[hover] : null;

  const toggle = (key) => setVisible((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="plot-wrap">
      <div className="series-toggle" role="group" aria-label="Mostra o nascondi le serie">
        {series.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`series-chip ${s.key} ${visible[s.key] ? "on" : ""}`}
            onClick={() => toggle(s.key)}
            aria-pressed={visible[s.key]}
          >
            <span className="chip-swatch" />
            {s.label}
          </button>
        ))}
      </div>
      <svg className="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Ingressi, uscite e saldo anagrafico dall'estero tra 2016 e 2025">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={margin.left + innerWidth} y1={y(tick)} y2={y(tick)} className="grid" />
            <text x={margin.left - 12} y={y(tick) + 4} textAnchor="end" className="axis-label">{formatCompact(tick)}</text>
          </g>
        ))}
        {series.filter((s) => visible[s.key]).map((s) => (
          <path key={s.key} d={line(s.key)} className={`line ${s.className}`} />
        ))}
        {data.map((item, index) => (
          <g key={item.year}>
            {series.filter((s) => visible[s.key]).map((s) => (
              <circle key={s.key} cx={x(item.year)} cy={y(item[s.key])} r="3.5" className={s.dot} />
            ))}
            <rect
              x={x(item.year) - 14}
              y={margin.top}
              width="28"
              height={innerHeight}
              fill="transparent"
              className="hit"
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            />
            {item.year % 2 === 0 ? (
              <text x={x(item.year)} y={height - 16} textAnchor="middle" className="axis-label">{item.year}</text>
            ) : null}
          </g>
        ))}
        {visible.entered ? <text x={margin.left + innerWidth + 14} y={y(last.entered) + 4} className="direct-label">iscritti</text> : null}
        {visible.left ? <text x={margin.left + innerWidth + 14} y={y(last.left) + 4} className="direct-label muted">cancellati</text> : null}
        {visible.net ? <text x={margin.left + innerWidth + 14} y={y(last.net) + 4} className="direct-label net">saldo</text> : null}
      </svg>
      {hovered ? (
        <PlotTooltip x={x(hovered.year)} y={margin.top + 6} vbWidth={width} vbHeight={height}>
          <strong>{hovered.year}</strong>
          {visible.entered ? <span>Iscritti: {formatNumber(hovered.entered)}</span> : null}
          {visible.left ? <span>Cancellati: {formatNumber(hovered.left)}</span> : null}
          <span className="tooltip-net">Saldo: {hovered.net > 0 ? "+" : ""}{formatNumber(hovered.net)}</span>
        </PlotTooltip>
      ) : null}
    </div>
  );
}

function HorizontalBars({ data, labelKey, valueKey, selected, onSelect, color = "accent" }) {
  const max = Math.max(...data.map((item) => item[valueKey]));

  return (
    <div className="bar-list" role="img" aria-label="Classifica a barre orizzontali">
      {data.map((item, index) => {
        const active = selected === item[labelKey];
        return (
          <button
            key={item[labelKey]}
            className={`bar-row ${active ? "is-selected" : ""}`}
            onClick={() => onSelect?.(item[labelKey])}
            type="button"
          >
            <span className="bar-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="bar-name">{item[labelKey]}</span>
            <span className="bar-track">
              <span
                className={`bar-fill ${color}`}
                style={{ width: `${Math.max(4, (item[valueKey] / max) * 100)}%` }}
              />
            </span>
            <span className="bar-value">{formatCompact(item[valueKey])}</span>
          </button>
        );
      })}
    </div>
  );
}

function RegionBars({ year, gender, region, setRegion }) {
  const data = useMemo(() => {
    return migrationData.regionSeries
      .filter((item) => item.year === year && item.gender === gender)
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [year, gender]);

  return <HorizontalBars data={data} labelKey="region" valueKey="value" selected={region} onSelect={setRegion} color="accent" />;
}

function PermitStack() {
  const total = migrationData.permitTypes.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  return (
    <div className="permit-stack" aria-label="Permessi con scadenza e di lungo periodo">
      <div className="stack-track">
        {migrationData.permitTypes.map((item) => {
          const width = (item.value / total) * 100;
          const style = { left: `${cursor}%`, width: `${width}%` };
          cursor += width;
          return <span key={item.type} style={style} className={item.type === "Di lungo periodo" ? "long" : "short"} />;
        })}
      </div>
      <div className="stack-legend">
        {migrationData.permitTypes.map((item) => (
          <p key={item.type}>
            <strong>{item.type}</strong>
            <span>{formatCompact(item.value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function GroupedBars({ groups, shortLabels, rows, filterKey, domain, ticks, ariaLabel }) {
  const [hover, setHover] = useState(null);
  const width = 760;
  const height = 330;
  const margin = { top: 28, right: 28, bottom: 60, left: 58 };
  const x0 = scaleLinear([0, groups.length], [margin.left, width - margin.right]);
  const y = scaleLinear(domain, [height - margin.bottom, margin.top]);
  const barWidth = 38;

  return (
    <div className="plot-wrap">
      <svg className="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} className="grid" />
            <text x={margin.left - 10} y={y(tick) + 4} textAnchor="end" className="axis-label">{tick}%</text>
          </g>
        ))}
        {groups.map((group, index) => {
          const items = rows.filter((item) => item[filterKey] === group);
          const cx = x0(index + 0.5);
          return (
            <g key={group}>
              {items.map((item, itemIndex) => {
                const bx = cx + (itemIndex ? 6 : -barWidth - 6);
                const id = `${group}-${item.citizenship}`;
                const isHover = hover === id;
                return (
                  <g
                    key={item.citizenship}
                    onMouseEnter={() => setHover(id)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <rect x={bx} y={y(item.value)} width={barWidth} height={height - margin.bottom - y(item.value)} rx="2" className={`${item.citizenship === "Stranieri" ? "accent-bar" : "ink-bar"} ${isHover ? "is-hover" : ""}`} />
                    <text x={bx + barWidth / 2} y={y(item.value) - 8} textAnchor="middle" className="value-label">{formatNumber(item.value, 1)}</text>
                  </g>
                );
              })}
              <text x={cx} y={height - 22} textAnchor="middle" className="bar-label">{shortLabels ? shortLabels[group] : group}</text>
            </g>
          );
        })}
        <g className="inline-key" transform={`translate(${width - 230},18)`}>
          <rect width="12" height="12" className="ink-bar" />
          <text x="18" y="10">Italiani</text>
          <rect x="92" width="12" height="12" className="accent-bar" />
          <text x="110" y="10">Stranieri</text>
        </g>
      </svg>
    </div>
  );
}

function LaborChart() {
  return (
    <GroupedBars
      groups={["Attività", "Occupazione", "Disoccupazione"]}
      rows={migrationData.laborRates}
      filterKey="metric"
      domain={[0, 85]}
      ticks={[0, 20, 40, 60, 80]}
      ariaLabel="Tassi di attività, occupazione e disoccupazione per cittadinanza"
    />
  );
}

function EducationChart() {
  return (
    <GroupedBars
      groups={["Nessun titolo di studio, licenza di scuola elementare e media", "Diploma", "Laurea e post-laurea"]}
      shortLabels={{
        "Nessun titolo di studio, licenza di scuola elementare e media": "Base",
        Diploma: "Diploma",
        "Laurea e post-laurea": "Laurea",
      }}
      rows={migrationData.educationEmployment}
      filterKey="education"
      domain={[45, 88]}
      ticks={[50, 60, 70, 80]}
      ariaLabel="Tasso di occupazione per titolo di studio e cittadinanza"
    />
  );
}

function SelectControl({ label, value, onChange, options }) {
  return (
    <label className="select-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function EconomicsBar({ label, value, max, tone, caption }) {
  return (
    <div className="economics-bar-row">
      <div>
        <strong>{label}</strong>
        <span>{caption}</span>
      </div>
      <div className="economics-bar-track">
        <span className={`economics-bar ${tone}`} style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
      </div>
      <b>{formatEuroCompact(value)}</b>
    </div>
  );
}

/* ---------- Interactive simulator (medium gamification) ---------- */

function ReturnSimulator() {
  const a = migrationData.returnEconomics;
  const baselineEmployment = migrationData.laborRates.find((r) => r.metric === "Occupazione" && r.citizenship === "Stranieri")?.value ?? 66.8;

  const [people, setPeople] = useState(100_000);
  const [returnCost, setReturnCost] = useState(a.returnCostPerPersonDefault);
  const [employment, setEmployment] = useState(Math.round(baselineEmployment));
  const horizon = 10;

  const workers = people * (employment / 100);
  const insertionCost = people * a.insertionCostPerPerson;
  const deportationCost = people * returnCost;
  const annualContribution = workers * a.annualContributionPerWorker;
  const horizonInclusionValue = annualContribution * horizon - insertionCost;
  const paybackYears = annualContribution > 0 ? deportationCost / annualContribution : Infinity;
  const insertionPaybackMonths = annualContribution > 0 ? (insertionCost / annualContribution) * 12 : Infinity;
  const max = Math.max(deportationCost, insertionCost, annualContribution, 1);
  const swing = horizonInclusionValue + deportationCost; // public-finance gap over the horizon
  const returnExecutionRate = a.returnsFollowingOrder2024 / a.ordersToLeave2024;

  const verdict = useMemo(() => {
    if (annualContribution <= 0) {
      return {
        tone: "neutral",
        headline: "Senza lavoro regolare, nessuna delle due strade genera gettito",
        body: "Con un tasso di occupazione vicino allo zero, l'inserimento non produce entrate fiscali e il confronto perde senso: è il segnale che la variabile decisiva è il lavoro, non la categoria.",
      };
    }
    if (paybackYears <= horizon) {
      return {
        tone: "invest",
        headline: `In ${formatNumber(paybackYears, 1)} anni il gettito pareggia il costo di un rimpatrio equivalente`,
        body: `Con ${formatNumber(people)} persone, un'occupazione al ${employment}% e ${formatEuro(returnCost)} di costo medio per rimpatrio, su ${horizon} anni l'inclusione lascia alle casse pubbliche circa ${formatEuroCompact(horizonInclusionValue)} netti, mentre il rimpatrio resta una spesa secca di ${formatEuroCompact(deportationCost)}. Il divario complessivo è di ${formatEuroCompact(swing)}.`,
      };
    }
    return {
      tone: "cost",
      headline: "Con questi parametri il rimpatrio costa meno del gettito atteso nell'orizzonte scelto",
      body: `Se il costo per rimpatrio scende a ${formatEuro(returnCost)} e l'occupazione si ferma al ${employment}%, servono ${formatNumber(paybackYears, 1)} anni perché il gettito pareggi la spesa: oltre l'orizzonte di ${horizon} anni qui simulato. È il caso in cui le ipotesi, non la categoria, decidono il risultato.`,
    };
  }, [annualContribution, paybackYears, people, employment, returnCost, horizonInclusionValue, deportationCost, swing]);

  return (
    <section id="costi" className="economics-section">
      <SectionLabel index="06" text="Il simulatore" />
      <div className="economics-head">
        <div>
          <h2>Rimpatrio o inserimento? Muovi tu le leve</h2>
          <p>
            La domanda economica non è solo quanto costa mandare via una persona. È quanto valore pubblico si perde se la stessa persona,
            con un percorso regolare, lavora e contribuisce ogni anno. Cambia i parametri e leggi il verdetto in tempo reale.
          </p>
        </div>
        <div className="return-facts" aria-label="Dati Eurostat sui rimpatri">
          <article>
            <span>ordini 2024</span>
            <strong>{formatNumber(a.ordersToLeave2024)}</strong>
          </article>
          <article>
            <span>ritorni eseguiti</span>
            <strong>{formatNumber(a.returnsFollowingOrder2024)}</strong>
          </article>
          <article>
            <span>quota eseguita</span>
            <strong>{formatNumber(returnExecutionRate * 100, 1)}%</strong>
          </article>
        </div>
      </div>

      <div className="sim-grid">
        <div className="sim-controls">
          <div className="sim-field">
            <div className="sim-field-head">
              <span>Persone coinvolte</span>
              <strong>{formatNumber(people)}</strong>
            </div>
            <input
              type="range"
              min={5_000}
              max={1_000_000}
              step={5_000}
              value={people}
              onChange={(event) => setPeople(Number(event.target.value))}
              aria-label="Numero di persone coinvolte"
            />
            <div className="cohort-buttons">
              {cohortPresets.map((option) => (
                <button key={option} className={people === option ? "active" : ""} onClick={() => setPeople(option)} type="button">
                  {option >= 1_000_000 ? "1 mln" : formatNumber(option)}
                </button>
              ))}
            </div>
          </div>

          <div className="sim-field">
            <div className="sim-field-head">
              <span>Costo medio per rimpatrio</span>
              <strong>{formatEuro(returnCost)}</strong>
            </div>
            <input
              type="range"
              min={a.returnCostMin}
              max={a.returnCostMax}
              step={500}
              value={returnCost}
              onChange={(event) => setReturnCost(Number(event.target.value))}
              aria-label="Costo medio per rimpatrio"
            />
            <p className="sim-hint">Procedure, trattenimento, ricorsi, scorte, voli: lo scenario va da {formatEuro(a.returnCostMin)} a {formatEuro(a.returnCostMax)}.</p>
          </div>

          <div className="sim-field">
            <div className="sim-field-head">
              <span>Tasso di occupazione</span>
              <strong>{employment}%</strong>
            </div>
            <input
              type="range"
              min={20}
              max={90}
              step={1}
              value={employment}
              onChange={(event) => setEmployment(Number(event.target.value))}
              aria-label="Tasso di occupazione delle persone inserite"
            />
            <p className="sim-hint">
              Baseline ISTAT 2025 per gli stranieri: {formatNumber(baselineEmployment, 1)}%. Di {formatNumber(people)} persone, ne lavorerebbero {formatNumber(Math.round(workers))}.
            </p>
          </div>
        </div>

        <div className={`sim-verdict ${verdict.tone}`} aria-live="polite">
          <span className="sim-verdict-tag">Verdetto dello scenario · orizzonte {horizon} anni</span>
          <h3>{verdict.headline}</h3>
          <p>{verdict.body}</p>
          <div className="sim-verdict-figures">
            <div>
              <span>Pareggio rimpatrio</span>
              <strong>{Number.isFinite(paybackYears) ? `${formatNumber(paybackYears, 1)} anni` : "—"}</strong>
            </div>
            <div>
              <span>Valore inclusione su {horizon} anni</span>
              <strong>{formatEuroCompact(horizonInclusionValue)}</strong>
            </div>
            <div>
              <span>Divario complessivo</span>
              <strong>{formatEuroCompact(swing)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="economics-compare">
        <EconomicsBar label="Costo dei rimpatri" caption="spesa una tantum, scenario regolabile" value={deportationCost} max={max} tone="cost" />
        <EconomicsBar label="Inserimento e formazione" caption="spesa una tantum per rendere il lavoro possibile" value={insertionCost} max={max} tone="invest" />
        <EconomicsBar label="Gettito da lavoro regolare" caption="stima prudente, ogni anno" value={annualContribution} max={max} tone="return" />
      </div>

      <div className="economics-cards">
        <article>
          <span>Rimpatrio</span>
          <strong>{formatEuroCompact(deportationCost)}</strong>
          <p>costo amministrativo una tantum per {formatNumber(people)} persone</p>
        </article>
        <article>
          <span>Inserimento</span>
          <strong>{formatEuroCompact(insertionCost)}</strong>
          <p>formazione, orientamento e avvio al lavoro regolare</p>
        </article>
        <article>
          <span>Gettito annuo</span>
          <strong>{formatEuroCompact(annualContribution)}</strong>
          <p>si ripete ogni anno se il lavoro resta regolare</p>
        </article>
        <article>
          <span>Recupero inserimento</span>
          <strong>{Number.isFinite(insertionPaybackMonths) ? `${formatNumber(insertionPaybackMonths, 1)} mesi` : "—"}</strong>
          <p>per ripagare la spesa di inserimento col gettito generato</p>
        </article>
      </div>

      <div className="method-warning">
        <strong>Nota metodologica obbligatoria</strong>
        <p>
          Questo simulatore non dimostra automaticamente quale politica sia migliore. Il rimpatrio è una spesa amministrativa una tantum,
          con costi reali variabili per procedure, trattenimento, ricorsi, scorte, accordi e voli. L'inserimento costa anch'esso —
          in questo scenario {formatEuro(a.insertionCostPerPerson)} a persona — e produce gettito solo se genera lavoro regolare e duraturo.
          I valori sono stime di scenario, non previsioni: servono a rendere visibile il ragionamento, non a chiuderlo.
        </p>
      </div>
    </section>
  );
}

function SectionLabel({ index, text }) {
  return (
    <p className="section-label">
      <span className="section-label-num">{index}</span>
      <span className="section-label-rule" aria-hidden="true" />
      {text}
    </p>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-mark">Migrazioni in Italia</span>
          <p>Una lettura di data journalism oltre la retorica della remigrazione. Dati ISTAT ed Eurostat, aggiornati al {migrationData.updated}.</p>
        </div>
        <nav className="footer-social" aria-label="Profili social">
          <span className="footer-social-title">Seguimi</span>
          <a href="https://www.instagram.com/storyteller_sam/" target="_blank" rel="noreferrer">Instagram · @storyteller_sam ↗</a>
          <a href="https://substack.com/@samuelerea" target="_blank" rel="noreferrer">Substack · @samuelerea ↗</a>
        </nav>
      </div>
      <p className="footer-legal">© {new Date().getFullYear()} · Progetto editoriale indipendente · I dati sono di fonte pubblica e citati nella sezione Metodo.</p>
    </footer>
  );
}

function App() {
  const [year, setYear] = useState(2025);
  const [gender, setGender] = useState("Totale");
  const [region, setRegion] = useState("Lombardia");
  const [country, setCountry] = useState("Romania");
  const [step, setStep] = useState(0);
  const selectedRegionValue = migrationData.regionSeries.find((item) => item.year === Number(year) && item.gender === gender && item.region === region);
  const selectedCountryValue = migrationData.topCitizenships.find((item) => item.country === country);

  return (
    <main>
      <header className="site-header">
        <a href="#top" className="brand">Migrazioni in Italia</a>
        <nav aria-label="Sezioni principali">
          <a href="#parole">Parole</a>
          <a href="#flussi">Flussi</a>
          <a href="#lavoro">Lavoro</a>
          <a href="#permessi">Permessi</a>
          <a href="#costi">Costi</a>
          <a href="#metodo">Metodo</a>
        </nav>
        <a className="header-cta" href="#dashboard">Esplora i dati</a>
      </header>

      <section id="top" className="broadsheet">
        <div className="folio">
          <span>Anno I — N° 01</span>
          <span className="folio-mid">Edizione dei dati</span>
          <span>17 giugno 2026 · accesso libero</span>
        </div>
        <hr className="rule-thick" />
        <div className="bs-masthead">
          <h1>Migrazioni in Italia</h1>
          <p className="bs-tagline">Il foglio dei numeri sulla presenza straniera — oltre la retorica</p>
        </div>
        <hr className="rule-thick" />

        <div className="lead">
          <div className="lead-text">
            <p className="lead-kicker">L'inchiesta · dati 2021–2025</p>
            <h2 className="lead-head">Cosa raccontano davvero i numeri</h2>
            <p className="lead-deck">Una presenza stabile, fatta di anagrafe, lavoro e scuola. E una domanda economica che il dibattito evita: mandare via o includere?</p>
            <div className="lead-body">
              <p className="dropcap">Nel linguaggio pubblico la parola «migrazione» evoca quasi sempre uno sbarco. I dati ISTAT raccontano un'altra cosa: al 1° gennaio 2025 i residenti stranieri superano i 5,37 milioni, in crescita lenta e continua. Non un'ondata, ma una struttura.</p>
              <p>Più della metà dei permessi è ormai di lungo periodo: biografie radicate, non emergenza. Intanto ogni anno quasi 200 mila persone diventano cittadine italiane — cambiano categoria statistica, non necessariamente paese.</p>
              <p>Resta la domanda che pesa di più sui conti pubblici. Quanto costa rimpatriare? E quanto vale, invece, una persona che con un percorso regolare lavora e contribuisce ogni anno?</p>
            </div>
            <a className="lead-cta" href="#costi">Apri il simulatore costi →</a>
          </div>
          <div className="lead-art">
            <CityLeadIllustration />
            <p className="lead-caption">Illustrazione — una presenza che è già struttura: città, lavoro, vita quotidiana.</p>
          </div>
          <NumbersBox />
        </div>

        <hr className="rule-mid" />
        <div className="briefs">
          {[
            { k: "Presenza", h: "Dove si concentra", p: "Lombardia, Lazio, Emilia: la mappa regionale, filtrabile per anno e genere.", href: "#dashboard" },
            { k: "Flussi", h: "Entrate e uscite", p: "Iscrizioni e cancellazioni dall'estero: il saldo è solo una parte della storia.", href: "#flussi" },
            { k: "Lavoro", h: "Non se, ma come", p: "Occupazione e titoli di studio: italiani e stranieri davvero a confronto.", href: "#lavoro" },
            { k: "Costi", h: "Via o inclusi?", p: "Rimpatrio contro inserimento e gettito fiscale: il simulatore con le leve.", href: "#costi" },
          ].map((b) => (
            <a className="brief" key={b.k} href={b.href}>
              <span className="brief-kicker">{b.k}</span>
              <h3>{b.h}</h3>
              <p>{b.p}</p>
              <span className="brief-cont">Continua →</span>
            </a>
          ))}
        </div>
        <hr className="rule-mid" />
      </section>

      <SectionDivider variant="people" label="chi resta, chi parte" />

      <section id="parole" className="section-block">
        <SectionLabel index="01" text="Le parole" />
        <div className="section-intro">
          <h2>Prima dei numeri: le parole cambiano il fenomeno</h2>
          <p>La discussione pubblica confonde spesso categorie diverse. Separarle non risolve il conflitto politico, ma lo rende più onesto.</p>
        </div>
        <div className="glossary-grid">
          {glossary.map(([term, definition]) => (
            <article key={term} className="glossary-card">
              <h3>{term}</h3>
              <p>{definition}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="story-section">
        <div className="story-copy">
          <SectionLabel index="02" text="Il processo" />
          <h2>Leggere il processo, non solo l'evento</h2>
          <div className="story-steps" role="tablist" aria-label="Passaggi narrativi">
            {storySteps.map((item, index) => (
              <button key={item.title} className={step === index ? "active" : ""} onClick={() => setStep(index)} type="button">
                <span>0{index + 1}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="sticky-plot">
          <ChartShell
            title={storySteps[step].title}
            subtitle={storySteps[step].body}
            source="Fonte: ISTAT. Le categorie statistiche sono amministrative e non esauriscono i percorsi biografici."
            sourceUrl="https://demo.istat.it/"
          >
            <ResidentLineChart selectedYear={storySteps[step].focus} />
          </ChartShell>
        </div>
      </section>

      <SectionDivider variant="route" label="dove vivono" />

      <section id="dashboard" className="dashboard-section">
        <SectionLabel index="03" text="Esplora" />
        <div className="dashboard-head">
          <div>
            <h2>Esplora i dati</h2>
            <p>Filtra anno, territorio e genere. Clicca le barre per cambiare il fuoco; passa sul grafico per i valori esatti.</p>
          </div>
          <div className="control-row">
            <SelectControl label="Anno" value={year} onChange={(value) => setYear(Number(value))} options={yearOptions} />
            <SelectControl label="Genere" value={gender} onChange={setGender} options={genderOptions} />
          </div>
        </div>

        <div className="dashboard-grid">
          <ChartShell
            title={`Dove si concentra la presenza straniera nel ${year}`}
            subtitle={`${region}: ${selectedRegionValue ? formatCompact(selectedRegionValue.value) : "dato non disponibile"} residenti stranieri.`}
            source="Fonte: ISTAT, popolazione straniera residente per territorio."
            sourceUrl="https://demo.istat.it/"
          >
            <RegionBars year={Number(year)} gender={gender} region={region} setRegion={setRegion} />
          </ChartShell>

          <ChartShell
            title="Le cittadinanze più numerose"
            subtitle={`${country}: ${selectedCountryValue ? formatCompact(selectedCountryValue.value) : "seleziona una cittadinanza"} residenti nel 2025.`}
            source="Fonte: ISTAT, popolazione straniera residente per cittadinanza."
            sourceUrl="https://demo.istat.it/"
          >
            <HorizontalBars data={migrationData.topCitizenships} labelKey="country" valueKey="value" selected={country} onSelect={setCountry} color="teal" />
          </ChartShell>
        </div>
      </section>

      <section id="flussi" className="section-grid wide">
        <div className="section-intro">
          <SectionLabel index="04" text="I flussi" />
          <h2>Entra ed esci: il saldo è solo una parte della storia</h2>
          <p>Nel 2025 le iscrizioni dall'estero superano le cancellazioni per l'estero. Attiva la serie «saldo» per vedere la differenza, anno per anno.</p>
          <div className="callout">
            <strong>{formatCompact(migrationData.flowByYear.at(-1).net)}</strong>
            <span>saldo anagrafico estero nel 2025</span>
          </div>
        </div>
        <ChartShell
          title="Ingressi, uscite e saldo dall'anagrafe"
          subtitle="Iscritti dall'estero e cancellati per l'estero, totale cittadinanze. Usa i pulsanti per accendere o spegnere le serie."
          source="Fonte: ISTAT, iscrizioni e cancellazioni anagrafiche."
          sourceUrl="https://demo.istat.it/"
        >
          <FlowChart />
        </ChartShell>
      </section>

      <SectionDivider variant="flow" label="il lavoro" />

      <section id="lavoro" className="labor-section">
        <SectionLabel index="05" text="Lavoro e istruzione" />
        <div className="section-intro">
          <h2>La domanda utile non è se le persone ci sono, ma come vengono inserite</h2>
          <p>Le differenze tra italiani e stranieri cambiano a seconda dell'indicatore. Passa sulle barre per i valori esatti: le politiche pubbliche dovrebbero guardare a competenze, titoli, barriere e fabbisogni.</p>
        </div>
        <div className="dashboard-grid">
          <ChartShell
            title="Partecipazione al mercato del lavoro"
            subtitle="Tassi 20-64 anni, Italia, 2025."
            source="Fonte: ISTAT, indicatori del lavoro per cittadinanza."
            sourceUrl="http://dati.istat.it/"
          >
            <LaborChart />
          </ChartShell>
          <ChartShell
            title="Occupazione per titolo di studio"
            subtitle="Il titolo conta, ma non cancella tutte le differenze di inserimento."
            source="Fonte: ISTAT, tasso di occupazione per cittadinanza e titolo di studio."
            sourceUrl="http://dati.istat.it/"
          >
            <EducationChart />
          </ChartShell>
        </div>
      </section>

      <section id="permessi" className="section-grid">
        <div>
          <h2>Permessi: la stabilità amministrativa è già dentro i numeri</h2>
          <p>Nel 2025 i permessi di lungo periodo superano quelli con scadenza. È una misura imperfetta, ma utile: indica percorsi che non sono riducibili a emergenza.</p>
        </div>
        <ChartShell
          title="Permessi di soggiorno al 1° gennaio 2025"
          subtitle="Con scadenza e di lungo periodo, Italia."
          source="Fonte: ISTAT, permessi di soggiorno."
          sourceUrl="http://dati.istat.it/"
        >
          <PermitStack />
        </ChartShell>
      </section>

      <SectionDivider variant="route" label="quanto costa" />

      <ReturnSimulator />

      <section id="metodo" className="method-section">
        <div>
          <SectionLabel index="07" text="Metodo" />
          <h2>Fonti e metodo</h2>
          <p>Questa pagina usa dati ISTAT ed Eurostat. I grafici distinguono fatti misurati, categorie amministrative e interpretazioni narrative. Clicca ogni fonte per aprire il portale ufficiale.</p>
        </div>
        <div className="method-list">
          {migrationData.sources.map((source) => (
            <div key={source.text} className="method-source">
              <p>{source.text}</p>
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer" className="source-pill">
                  {source.label} ↗
                </a>
              ) : (
                <span className="source-pill is-static">{source.label}</span>
              )}
            </div>
          ))}
        </div>
        <p className="ethics-note">
          Il punto non è negare i problemi: è evitare che categorie diverse vengano fuse in una sola parola politica. Una buona politica ha bisogno di dati leggibili, caveat visibili e domande migliori.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}

export default App;
