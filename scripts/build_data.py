import csv
import json
from pathlib import Path

SOURCE_DIR = Path("/Users/samuelerea/Downloads/CSV_migranti ")
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "migrationData.js"


def read_csv(name):
    with (SOURCE_DIR / name).open(newline="", encoding="utf-8-sig", errors="replace") as handle:
        return list(csv.DictReader(handle, quotechar="'"))


def to_num(value):
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None


def int_num(value):
    number = to_num(value)
    return int(round(number)) if number is not None else None


def year_rows(rows):
    return [row for row in rows if str(row.get("TIME_PERIOD", "")).isdigit()]


def pick(rows, **criteria):
    for row in rows:
        if all(row.get(key) == value for key, value in criteria.items()):
            return row
    return None


def series(rows, value_key="Osservazione", **criteria):
    data = []
    for row in year_rows(rows):
        if all(row.get(key) == value for key, value in criteria.items()):
            value = to_num(row.get(value_key))
            if value is not None:
                data.append({"year": int(row["TIME_PERIOD"]), "value": value})
    return sorted(data, key=lambda item: item["year"])


def latest_value(data):
    return data[-1]["value"] if data else None


def pct(part, total):
    if not part or not total:
        return None
    return round((part / total) * 100, 1)


def clean_country(name):
    block = [
        "Africa",
        "America",
        "Asia",
        "Europa",
        "Unione europea",
        "Altri paesi",
        "Mondo",
        "Totale",
        "Paesi",
        "Oceania",
        "Apolide",
    ]
    return name and not any(token in name for token in block)


foreign_population = read_csv("Italia Regioni Province (1).csv")
population_by_citizenship = read_csv("Italia Regioni Province Cittadinanza.csv")
permits = read_csv("Tipo di permesso e provincia.csv")
immigration = read_csv("Immigrati Cittadinanza.csv")
emigration = read_csv("Emigrati Cittadinanza.csv")
activity = read_csv("Titolo di studio e cittadinanza.csv")
employment = read_csv("Titolo di studio e cittadinanza (1).csv")
unemployment = read_csv("Titolo di studio e cittadinanza (2).csv")
labor_counts = read_csv("Occupati Disoccupati Inattivi per Cittadinanza.csv")

regions = [
    "Piemonte",
    "Liguria",
    "Lombardia",
    "Veneto",
    "Friuli-Venezia Giulia",
    "Emilia-Romagna",
    "Toscana",
    "Umbria",
    "Marche",
    "Lazio",
    "Abruzzo",
    "Molise",
    "Campania",
    "Puglia",
    "Basilicata",
    "Calabria",
    "Sicilia",
    "Sardegna",
]

resident_series = series(
    foreign_population,
    Territorio="Italia",
    Sesso="Totale",
    Indicatore="Popolazione censita straniera al 1° gennaio",
)

citizenship_series = series(
    foreign_population,
    Territorio="Italia",
    Sesso="Totale",
    Indicatore="Acquisizioni della cittadinanza italiana",
)

immigration_series = series(
    immigration,
    Sesso="Totale",
    Età="Totale",
    Cittadinanza="Totale",
)

emigration_series = series(
    emigration,
    Sesso="Totale",
    Età="Totale",
    Cittadinanza="Totale",
)

permit_series = series(
    permits,
    Territorio="Italia",
    Sesso="Totale",
    **{"Tipo di permesso di residenza": "Totale"},
)

permit_types = []
for row in year_rows(permits):
    if row.get("Territorio") == "Italia" and row.get("Sesso") == "Totale" and row.get("TIME_PERIOD") == "2025":
        label = row.get("Tipo di permesso di residenza")
        if label in {"Con scadenza", "Di lungo periodo"}:
            permit_types.append({"type": label, "value": int_num(row.get("Osservazione"))})

region_series = []
for row in year_rows(foreign_population):
    if (
        row.get("Indicatore") == "Popolazione censita straniera al 1° gennaio"
        and row.get("Territorio") in regions
        and row.get("Sesso") in {"Totale", "Maschi", "Femmine"}
    ):
        region_series.append(
            {
                "region": row["Territorio"],
                "gender": row["Sesso"],
                "year": int(row["TIME_PERIOD"]),
                "value": int_num(row["Osservazione"]),
            }
        )

top_citizenships = []
for row in year_rows(population_by_citizenship):
    if (
        row.get("Territorio") == "Italia"
        and row.get("Sesso") == "Totale"
        and row.get("TIME_PERIOD") == "2025"
        and clean_country(row.get("Cittadinanza"))
    ):
        value = int_num(row.get("Osservazione"))
        if value:
            top_citizenships.append({"country": row["Cittadinanza"], "value": value})
top_citizenships = sorted(top_citizenships, key=lambda item: item["value"], reverse=True)[:12]

flow_by_year = []
years = sorted({item["year"] for item in immigration_series} | {item["year"] for item in emigration_series})
for year in years:
    entered = next((item["value"] for item in immigration_series if item["year"] == year), None)
    left = next((item["value"] for item in emigration_series if item["year"] == year), None)
    if entered is not None and left is not None:
        flow_by_year.append({"year": year, "entered": entered, "left": left, "net": entered - left})

labor_rates = []
metric_files = [
    ("Attività", activity),
    ("Occupazione", employment),
    ("Disoccupazione", unemployment),
]
for metric, rows in metric_files:
    for citizenship in ["Italiano-a", "Straniero-a"]:
        row = pick(
            rows,
            Territorio="Italia",
            Sesso="Totale",
            Età="20-64 anni",
            TIME_PERIOD="2025",
            **{"Titolo di studio": "Totale", "Cittadinanza": citizenship},
        )
        if row:
            labor_rates.append(
                {
                    "metric": metric,
                    "citizenship": "Italiani" if citizenship == "Italiano-a" else "Stranieri",
                    "value": to_num(row.get("Osservazione")),
                }
            )

education_employment = []
for row in employment:
    if (
        row.get("Territorio") == "Italia"
        and row.get("Sesso") == "Totale"
        and row.get("Età") == "20-64 anni"
        and row.get("TIME_PERIOD") == "2025"
        and row.get("Cittadinanza") in {"Italiano-a", "Straniero-a"}
        and row.get("Titolo di studio") != "Totale"
    ):
        education_employment.append(
            {
                "education": row["Titolo di studio"],
                "citizenship": "Italiani" if row["Cittadinanza"] == "Italiano-a" else "Stranieri",
                "value": to_num(row.get("Osservazione")),
            }
        )

work_counts = []
for row in labor_counts:
    if row.get("Sesso") == "Totale" and row.get("Età") == "15 anni e più" and row.get("Cittadinanza") in {"Italiano-a", "Straniero-a"}:
        work_counts.append(
            {
                "indicator": row["Indicatore"],
                "citizenship": "Italiani" if row["Cittadinanza"] == "Italiano-a" else "Stranieri",
                "value": to_num(row.get("Osservazione")),
                "unit": "migliaia",
            }
        )

latest_residents = latest_value(resident_series)
latest_permits = latest_value(permit_series)
latest_entries = flow_by_year[-1]["entered"]
latest_exits = flow_by_year[-1]["left"]
latest_citizenships = latest_value(citizenship_series)
long_term = next((item["value"] for item in permit_types if item["type"] == "Di lungo periodo"), None)

data = {
    "updated": "2026-06-16",
    "kpis": [
        {
            "label": "residenti stranieri",
            "value": latest_residents,
            "display": f"{latest_residents / 1_000_000:.2f} mln".replace(".", ","),
            "note": "Popolazione censita straniera al 1° gennaio 2025",
        },
        {
            "label": "permessi di soggiorno",
            "value": latest_permits,
            "display": f"{latest_permits / 1_000_000:.2f} mln".replace(".", ","),
            "note": f"{pct(long_term, latest_permits)}% di lungo periodo",
        },
        {
            "label": "saldo ingressi/uscite",
            "value": latest_entries - latest_exits,
            "display": f"+{int(latest_entries - latest_exits):,}".replace(",", "."),
            "note": "Iscritti dall'estero meno cancellati per l'estero, 2025",
        },
        {
            "label": "nuovi cittadini italiani",
            "value": latest_citizenships,
            "display": f"{int(latest_citizenships):,}".replace(",", "."),
            "note": "Acquisizioni di cittadinanza italiana, 2025",
        },
    ],
    "residentSeries": resident_series,
    "citizenshipSeries": citizenship_series,
    "permitSeries": permit_series,
    "permitTypes": permit_types,
    "regionSeries": region_series,
    "topCitizenships": top_citizenships,
    "flowByYear": flow_by_year,
    "laborRates": labor_rates,
    "educationEmployment": education_employment,
    "workCounts": work_counts,
    "returnEconomics": {
        "ordersToLeave2024": 27970,
        "returnsFollowingOrder2024": 4480,
        "returnCostPerPersonDefault": 5000,
        "returnCostMin": 4000,
        "returnCostMax": 12000,
        "insertionCostPerPerson": 1500,
        "annualContributionPerWorker": 4200,
        "methodNote": "Stime scenario: il costo medio di rimpatrio non ha un prezzo pubblico unico; il gettito annuo usa una soglia conservativa di contributi e imposte generate da lavoro regolare.",
    },
    "sources": [
        "ISTAT, popolazione straniera residente e acquisizioni di cittadinanza, serie 2021-2025.",
        "ISTAT, iscrizioni e cancellazioni anagrafiche per cittadinanza, serie 2016-2025.",
        "ISTAT, permessi di soggiorno al 1° gennaio, serie 2016-2025.",
        "ISTAT, indicatori del lavoro per cittadinanza e titolo di studio, 2025.",
        "Eurostat MIGR_EIORD, cittadini di Paesi terzi destinatari di ordine di lasciare il territorio: Italia 2024, 27.970.",
        "Eurostat MIGR_EIRTN, cittadini di Paesi terzi rimpatriati dopo un ordine di lasciare il territorio: Italia 2024, 4.480.",
        "Scenario economico: costo rimpatrio regolabile 4.000-12.000 euro; inserimento/formazione 1.500 euro una tantum; gettito fiscale-contributivo prudenziale 4.200 euro annui per lavoro regolare.",
    ],
}

OUT.write_text(
    "export const migrationData = "
    + json.dumps(data, ensure_ascii=False, indent=2)
    + ";\n",
    encoding="utf-8",
)
print(f"Wrote {OUT}")
