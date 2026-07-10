import csv
import re
from datetime import datetime
import requests
from bs4 import BeautifulSoup

URL = "https://lpf2.ro/html/etape_arhiva_2010_2011"
OUT = "liga1_2010_2011_meciuri.csv"

MONTHS = {
    "Ianuarie": "01", "Februarie": "02", "Martie": "03", "Aprilie": "04",
    "Mai": "05", "Iunie": "06", "Iulie": "07", "August": "08",
    "Septembrie": "09", "Octombrie": "10", "Noiembrie": "11", "Decembrie": "12",
}

STADIUM = {
    "Otelul Galati": "Stadionul Oțelul",
    "Sportul Studentesc": "Stadionul Regie",
    "Pandurii Tg Jiu": "Stadionul Municipal Tudor Vladimirescu",
    "Rapid Bucuresti": "Stadionul Giulești-Valentin Stănescu",
    "FC Vaslui": "Stadionul Municipal Vaslui",
    "FC U Craiova 1948": "Stadionul Ion Oblemenco",
    "CFR Cluj": "Stadionul Dr. Constantin Rădulescu",
    "Poli Timisoara": "Stadionul Dan Păltinișanu",
    "Gloria Bistrita": "Stadionul Gloria",
    "Universitatea Cluj": "Stadionul Cetate",
    "FCSB": "Stadionul Steaua",
    "Astra Giurgiu": "Stadionul Astra",
    "Dinamo Bucuresti": "Stadionul Dinamo",
    "FCM Tg. Mures": "Stadionul Trans-Sil",
    "FC Brasov": "Stadionul Silviu Ploeșteanu",
    "Victoria Branesti": "Stadionul Victoria Brănești",
    "Gaz Metan Medias": "Stadionul Gaz Metan",
    "Unirea Urziceni": "Stadionul Tineretului",
}

# Names as they appear in LPF links plus common missing text fallback.
TEAMS = sorted(STADIUM.keys(), key=len, reverse=True)
SCORE_RE = re.compile(r"\b(\d+)\s*-\s*(\d+)\b")
DATE_RE = re.compile(r"(\d{1,2})\s+([A-Za-zăâîșțĂÂÎȘȚ]+)\s+(20\d{2}),\s*(\d{1,2}:\d{2})")


def ro_date_to_iso(date_text):
    m = DATE_RE.search(date_text)
    if not m:
        return ""
    day, month_name, year, time = m.groups()
    month = MONTHS.get(month_name)
    if not month:
        raise ValueError(f"Unknown month: {month_name}")
    hh, mm = time.split(":")
    return f"{year}-{month}-{int(day):02d}T{int(hh):02d}:{mm}"


def clean_team(t):
    t = re.sub(r"\s+", " ", t).strip()
    return t


def extract_team_names(row_text, anchors_text):
    score = SCORE_RE.search(row_text)
    if not score:
        return None
    before = row_text[:score.start()]
    after = row_text[score.end():]

    # Prefer anchor text because LPF sometimes omits Unirea Urziceni text in plain extraction.
    anchors = [clean_team(a) for a in anchors_text if clean_team(a) in STADIUM]
    if len(anchors) >= 2:
        return anchors[0], anchors[1]

    def find_team(fragment, reverse=False):
        found = []
        for team in TEAMS:
            if team in fragment:
                found.append(team)
        if found:
            return found[0]
        return "Unirea Urziceni"  # only team often blank/missing in LPF rendering

    home = find_team(before)
    away = find_team(after)
    return home, away


def main():
    html = requests.get(URL, timeout=30).text
    soup = BeautifulSoup(html, "html.parser")
    text_lines = soup.get_text("\n").splitlines()

    # LPF layout is not a semantic table, so parse by visible lines containing dates and scores.
    current_stage = None
    rows = []

    # Use elements split by <br> / rendered text. Safer approach: search all text windows that contain a date.
    page_text = re.sub(r"\s+", " ", soup.get_text(" "))
    # Convert every occurrence from Etapa marker to next Etapa marker into a block.
    blocks = re.split(r"(?=Etapa\s+\d+)", page_text)
    for block in blocks:
        sm = re.match(r"Etapa\s+(\d+)", block)
        if not sm:
            continue
        stage = f"Etapa {sm.group(1)}"
        # Split block before every Romanian date.
        pieces = re.split(r"(?=\d{1,2}\s+(?:" + "|".join(MONTHS.keys()) + r")\s+20\d{2},\s*\d{1,2}:\d{2})", block)
        for p in pieces:
            dm = DATE_RE.search(p)
            score = SCORE_RE.search(p)
            if not dm or not score:
                continue
            match_dt = ro_date_to_iso(dm.group(0))
            # Extract team names from text around score.
            start = dm.end()
            useful = p[start:]
            teams = []
            for team in TEAMS:
                if team in useful:
                    teams.append((useful.find(team), team))
            teams = [t for _, t in sorted(teams)]
            if len(teams) >= 2:
                home, away = teams[0], teams[1]
            elif len(teams) == 1:
                # One side is missing in LPF text; infer Unirea Urziceni.
                if useful.find(teams[0]) < useful.find(score.group(0)):
                    home, away = teams[0], "Unirea Urziceni"
                else:
                    home, away = "Unirea Urziceni", teams[0]
            else:
                continue
            rows.append({
                "League": "Liga 1",
                "teamHome": home,
                "teamAway": away,
                "matchDate": match_dt,
                "location": STADIUM.get(home, ""),
                "stage": stage,
                "Scor": f"{score.group(1)}:{score.group(2)}",
            })

    # Remove duplicates while preserving order.
    seen = set()
    unique = []
    for r in rows:
        key = (r["stage"], r["matchDate"], r["teamHome"], r["teamAway"], r["Scor"])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    with open(OUT, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["League", "teamHome", "teamAway", "matchDate", "location", "stage", "Scor"])
        writer.writeheader()
        writer.writerows(unique)

    print(f"Scrise {len(unique)} meciuri in {OUT}")
    if len(unique) not in (305, 306):
        print("ATENȚIE: verifică numărul de rânduri. Wikipedia indică 305 meciuri pentru sezon.")

if __name__ == "__main__":
    main()
