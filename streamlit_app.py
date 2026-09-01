"""
Self-Powered Edge-AI Rehabilitation Companion — Streamlit Dashboard
===================================================================
Standalone Streamlit version of the React analytics dashboard. Reads the same
sample CSV (public/data/rehabilitation_data.csv) and is structured so the data
source can later be swapped for live ESP32 telemetry (serial / MQTT / HTTP).

Run locally:
    pip install streamlit pandas numpy
    streamlit run streamlit_app.py
"""

from __future__ import annotations

import io
from pathlib import Path

import numpy as np
import pandas as pd
import streamlit as st

APP_NAME = "Self-Powered Edge-AI Rehabilitation Companion"
DEFAULT_CSV = Path(__file__).parent / "public" / "data" / "rehabilitation_data.csv"

st.set_page_config(
    page_title=APP_NAME,
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --------------------------------------------------------------------------- #
# Teal/blue healthcare theme
# --------------------------------------------------------------------------- #
st.markdown(
    """
    <style>
      :root { --teal: #0d9488; --ink: #0f172a; }
      h1, h2, h3 { color: var(--ink); }
      .block-container { padding-top: 1.6rem; }
      [data-testid="stMetric"] {
          background: #f0fdfa; border: 1px solid #99f6e4;
          border-radius: 14px; padding: 14px 16px;
      }
      .caption-note { color: #64748b; font-size: 0.85rem; }
    </style>
    """,
    unsafe_allow_html=True,
)


# --------------------------------------------------------------------------- #
# Data layer — swap this function for live ESP32 ingestion later
# --------------------------------------------------------------------------- #
@st.cache_data(show_spinner="Loading rehabilitation data…")
def load_data(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path, parse_dates=["date"])
    df["date"] = df["date"].dt.date
    num_cols = df.select_dtypes(include="object").columns.drop("patient_id", errors="ignore")
    df[num_cols] = df[num_cols].apply(pd.to_numeric, errors="coerce")
    return df


def load_uploaded(uploaded_file) -> pd.DataFrame:
    df = pd.read_csv(uploaded_file, parse_dates=["date"])
    df["date"] = df["date"].dt.date
    num_cols = df.select_dtypes(include="object").columns.drop("patient_id", errors="ignore")
    df[num_cols] = df[num_cols].apply(pd.to_numeric, errors="coerce")
    return df


def trend(series: pd.Series, days: int = 7) -> float:
    """Percent change between the mean of the last `days` rows and the previous block."""
    s = series.dropna()
    if len(s) < 2 * days:
        return 0.0
    recent, prior = s.iloc[-days:].mean(), s.iloc[-2 * days : -days].mean()
    if prior == 0:
        return 0.0
    return (recent - prior) / prior * 100.0


def trend_pill(value: float) -> str:
    arrow = "▲" if value >= 0 else "▼"
    color = "#0d9488" if value >= 0 else "#e11d48"
    return f"<span style='color:{color}'>{arrow} {abs(value):.1f}%</span>"


# --------------------------------------------------------------------------- #
# Sidebar — global filters (mirrors the web app's FilterContext)
# --------------------------------------------------------------------------- #
with st.sidebar:
    st.title("🩺 Edge-AI Companion")
    st.caption(APP_NAME)

    source = st.radio("Data source", ["Demo CSV", "Upload CSV"], horizontal=True)
    if source == "Demo CSV":
        if not DEFAULT_CSV.exists():
            st.error(f"Default CSV not found at {DEFAULT_CSV}")
            st.stop()
        df = load_data(DEFAULT_CSV)
    else:
        up = st.file_uploader("Upload rehabilitation CSV", type="csv")
        if up is None:
            st.info("Upload a CSV with the same columns as the demo dataset.")
            st.stop()
        df = load_uploaded(up)

    patients = sorted(df["patient_id"].unique())
    patient = st.selectbox("Patient", ["All patients"] + patients)

    dmin, dmax = df["date"].min(), df["date"].max()
    date_range = st.date_input("Date range", (dmin, dmax), min_value=dmin, max_value=dmax)

    metric_options = {
        "Steps": "steps",
        "Distance (km)": "distance_km",
        "Gait speed (m/s)": "gait_speed",
        "Stride length (cm)": "stride_length_cm",
        "Gait asymmetry (%)": "gait_asymmetry",
        "Activity (min)": "activity_minutes",
        "Harvested energy (mJ)": "energy_harvested_mj",
        "Stored energy (mJ)": "energy_stored_mj",
        "Consumed energy (mJ)": "energy_consumed_mj",
        "Data completeness (%)": "data_completeness",
一次    }
    st.multiselect("Chart metrics", list(metric_options), default=["Steps", "Gait speed (m/s)"], key="metrics")
    export = st.button("⬇️ Download filtered CSV")

    st.divider()
    st.caption("Hardware-ready: replace `load_data()` with an ESP32 serial/MQTT reader for live telemetry.")

filtered = df.copy()
if patient != "All patients":
    filtered = filtered[filtered["patient_id"] == patient]
if isinstance(date_range, tuple) and len(date_range) == 2:
    filtered = filtered[(filtered["date"] >= date_range[0]) & (filtered["date"] <= date_range[1])]

if export:
    st.download_button("Download filtered data (CSV)", filtered.to_csv(index=False), "filtered_rehabilitation_data.csv", "text/csv")

if filtered.empty:
    st.warning("No records match the selected filters.")
    st.stop()

# --------------------------------------------------------------------------- #
# Header
# --------------------------------------------------------------------------- #
st.title("🩺 Self-Powered Edge-AI Rehabilitation Companion")
latest = filtered.sort_values("date").iloc[-1]

# --------------------------------------------------------------------------- #
# KPI row
# --------------------------------------------------------------------------- #
c1, c2, c3, c4, c5 = st.columns(5)
with c1:
    st.metric("Avg steps / day", f"{filtered['steps'].mean():,.0f}", f"{trend(filtered['steps']):+.1f}%")
with c2:
    st.metric("Gait speed", f"{filtered['gait_speed'].mean():.2f} m/s", f"{trend(filtered['gait_speed']):+.1f}%")
with c3:
    st.metric("Stride length", f"{filtered['stride_length_cm'].mean():.1f} cm", f"{trend(filtered['stride_length_cm']):+.1f}%")
with c4:
    st.metric("Energy harvested", f"{filtered['energy_harvested_mj'].sum():,.0f} mJ", f"{trend(filtered['energy_harvested_mj']):+.1f}%")
with c5:
    st.metric("Data completeness", f"{filtered['data_completeness'].mean():.1f}%", f"{trend(filtered['data_completeness']):+.1f}%")

# --------------------------------------------------------------------------- #
# Tabs
# --------------------------------------------------------------------------- #
tab_overview, tab_gait, tab_energy, tab_reports, tab_quality = st.tabs(
    ["📈 Daily Analytics", "🚶 Gait Analysis", "⚡ Energy Harvesting", "📋 Patient Reports", "🛡️ Data Quality"]
)

with tab_overview:
    st.subheader("Daily activity trends")
    daily = filtered.groupby("date", as_index=False)[
        ["steps", "distance_km", "activity_minutes", "gait_speed"]
    ].mean()
    chart = daily.set_index("date")[["steps", "activity_minutes"]]
    st.line_chart(chart, height=280)
    st.caption("Steps and active minutes averaged across the current selection.")

    left, right = st.columns(2)
    with left:
        st.subheader("Distance walked (km)")
        st.area_chart(daily.set_index("date")["distance_km"], color="#0d9488")
    with right:
        st.subheader("Recent records")
        st.dataframe(
            filtered.sort_values("date", ascending=False)
            .head(10)[["patient_id", "date", "steps", "distance_km", "gait_speed", "data_completeness"]],
            use_container_width=True, hide_index=True,
        )

with tab_gait:
    st.subheader("Gait parameters")
    g1, g2, g3 = st.columns(3)
    with g1:
        st.metric("Mean gait speed", f"{filtered['gait_speed'].mean():.2f} m/s")
    with g2:
        st.metric("Mean stride length", f"{filtered['stride_length_cm'].mean():.1f} cm")
    with g3:
        st.metric("Mean asymmetry", f"{filtered['gait_asymmetry'].mean():.1f} %")

    gait_daily = filtered.groupby("date", as_index=False)[["gait_speed", "stride_length_cm", "gait_asymmetry"]].mean()
    norm = gait_daily.copy()
    for col in ["gait_speed", "stride_length_cm", "gait_asymmetry"]:
        rng = norm[col].max() - norm[col].min()
        norm[col] = (norm[col] - norm[col].min()) / rng if rng else 0.5
    st.line_chart(norm.set_index("date"), height=280)
    st.caption("Min–max normalised gait metrics for direct comparison.")

    st.subheader("Period comparison (first half vs second half)")
    mid = len(filtered.sort_values("date")) // 2
    ordered = filtered.sort_values("date")
    comp = pd.DataFrame(
        {
            "Period": ["First half", "Second half"],
            "Gait speed (m/s)": [ordered["gait_speed"].iloc[:mid].mean(), ordered["gait_speed"].iloc[mid:].mean()],
            "Stride length (cm)": [ordered["stride_length_cm"].iloc[:mid].mean(), ordered["stride_length_cm"].iloc[mid:].mean()],
            "Asymmetry (%)": [ordered["gait_asymmetry"].iloc[:mid].mean(), ordered["gait_asymmetry"].iloc[mid:].mean()],
        }
    ).set_index("Period")
    st.bar_chart(comp)

with tab_energy:
    st.subheader("Piezoelectric / triboelectric energy harvesting")
    e1, e2, e3 = st.columns(3)
    with e1:
        st.metric("Total harvested", f"{filtered['energy_harvested_mj'].sum():,.1f} mJ")
    with e2:
        eff = filtered["energy_stored_mj"].sum() / max(filtered["energy_harvested_mj"].sum(), 1e-9) * 100
        st.metric("Harvest → storage efficiency", f"{eff:.1f} %")
    with e3:
        st.metric("Total consumed", f"{filtered['energy_consumed_mj'].sum():,.1f} mJ")

    energy = filtered.groupby("date", as_index=False)[["energy_harvested_mj", "energy_stored_mj", "energy_consumed_mj"]].sum()
    st.line_chart(energy.set_index("date"), height=280)

    balance = pd.DataFrame(
        {
            "Flow": ["Harvested", "Stored", "Consumed"],
            "Energy (mJ)": [
                filtered["energy_harvested_mj"].sum(),
                filtered["energy_stored_mj"].sum(),
                filtered["energy_consumed_mj"].sum(),
            ],
        }
    ).set_index("Flow")
    st.bar_chart(balance, color="#0d9488")

with tab_reports:
    st.subheader("Patient-reported scores (0–100)")
    score_cols = ["pain_score", "anxiety_score", "depression_score", "appetite_score", "sleep_score", "general_condition_score"]
    scores = filtered.groupby("date", as_index=False)[score_cols].mean().set_index("date")
    st.line_chart(scores, height=280)

    st.subheader("Latest scores")
    cols = st.columns(len(score_cols))
    for col, name in zip(cols, score_cols):
        with col:
            label = name.replace("_score", "").replace("_", " ").title()
            st.metric(label, f"{latest[name]:.0f}")

    st.subheader("Multimodal fusion diagram")
    st.caption("Wearable IMU + piezo/triboelectric harvester → Edge-AI (ESP32) → Dashboard / clinician alerts")

with tab_quality:
    st.subheader("Data quality & sensor health")
    q1, q2, q3 = st.columns(3)
    with q1:
        st.metric("Avg completeness", f"{filtered['data_completeness'].mean():.1f} %")
    with q2:
        low = (filtered["data_completeness"] < 85).mean() * 100
        st.metric("Days below 90% completeness", f"{low:.1f} %")
    with q3:
        st.metric("Records monitored", f"{len(filtered):,}")

    st.line_chart(filtered.groupby("date", as_index=False)["data_completeness"].mean().set_index("date"), height=260)

    alerts = []
    if filtered["data_completeness"].mean() < 90:
        alerts.append("⚠️ Average completeness below 90% — check sensor wear position.")
    if filtered["gait_asymmetry"].mean() > 8:
        alerts.append("⚠️ Gait asymmetry elevated — review physiotherapy schedule.")
    if (filtered["data_completeness"] < 80).any():
        alerts.append("🔴 One or more days below 80% completeness — possible device dropout.")
    st.write("\n".join(alerts) if alerts else "✅ All monitoring indicators within normal range.")

st.caption("Demo dataset · fictional data · ready for ESP32 integration via the data-layer swap.")
