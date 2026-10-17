/**
 * Generates the 112-record v4 synthetic dataset used for exploratory analysis.
 *
 * Output: test-data/v4-synthetic-2026-10.json — { "records": [ ... ] }, the exact
 * shape `scripts/import-synthetic.mjs` expects. This script does NOT touch the
 * database; it only writes the review file.
 *
 * Every question id and answer option is taken from the canonical instrument
 * (`src/data/survey/v4.ts`) and the programme list from `profile.ts`, so the
 * dataset can never drift from the shipped questionnaire. Records are built from
 * a small latent-trait model (perceived infrastructure, campaign awareness,
 * engagement, knowledge, social confidence) with deliberate noise and a handful
 * of injected inconsistencies, so profiles are coherent but not deterministic.
 *
 * Run: node scripts/generate-v4-synthetic-dataset.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { V4_INSTRUMENT } from "../src/data/survey/v4.ts";
import {
  SURVEY_PROFILE_FIELDS,
  SURVEY_CONSENT_ID,
  getProfileFieldOptions,
} from "../src/data/survey/profile.ts";

const BATCH_ID = "v4-synthetic-2026-10";
const OUT_URL = new URL("../test-data/v4-synthetic-2026-10.json", import.meta.url);

const Q = Object.fromEntries(V4_INSTRUMENT.questions.map((q) => [q.id, q]));
const QUESTION_IDS = V4_INSTRUMENT.questions.map((q) => q.id);
function opts(id) {
  return Q[id].options.map((o) => o.value);
}
function optsEx(id, exclude) {
  return opts(id).filter((v) => !exclude.includes(v));
}

const CONSENT = SURVEY_CONSENT_ID === "consent" ? "consent" : SURVEY_CONSENT_ID;
const programmeField = SURVEY_PROFILE_FIELDS.find(
  (f) => f.id === "profile_programme",
);
const PROGRAMMES = getProfileFieldOptions(programmeField).map((o) => o.value);

/* ------------------------------------------------------------------ RNG --- */
let seed = 0x9e3779b9 ^ 20261015;
function rnd() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const clamp01 = (x) => Math.max(0, Math.min(1, x));
function band(score, edges, values) {
  for (let i = 0; i < edges.length; i++) if (score < edges[i]) return values[i];
  return values[values.length - 1];
}
function pickWeighted(values, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < values.length; i++) {
    r -= weights[i];
    if (r <= 0) return values[i];
  }
  return values[values.length - 1];
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------------------------------------------------------------- names --- */
const NAMES = {
  "South Sudanese-inspired": [
    ["Nyakuoth Deng", "f"], ["Ajak Mabior", "f"], ["Nyandeng Garang", "f"],
    ["Achol Bol", "f"], ["Abuk Ayuel", "f"], ["Awut Manyang", "f"],
    ["Yar Arou", "f"], ["Nyaboth Kuol", "f"], ["Adut Chan", "f"],
    ["Deng Majok", "m"], ["Mabior Kiir", "m"], ["Bol Ajak", "m"],
    ["Chol Amum", "m"], ["Gatluak Ruot", "m"], ["Wani Lado", "m"],
  ],
  "Zimbabwean-inspired": [
    ["Rudo Chikafu", "f"], ["Tendai Moyo", "f"], ["Nyasha Dube", "f"],
    ["Chiedza Ncube", "f"], ["Rumbidzai Sibanda", "f"], ["Vimbai Chirwa", "f"],
    ["Tawanda Mutasa", "m"], ["Simbarashe Ndlovu", "m"], ["Farai Mabhena", "m"],
    ["Kudakwashe Banda", "m"],
  ],
  "Liberian-inspired": [
    ["Gbessay Kollie", "f"], ["Massa Sirleaf", "f"], ["Fatu Kamara", "f"],
    ["Musu Johnson", "f"], ["Deddeh Gaye", "f"], ["Korto Beh", "f"],
    ["Varney Toe", "m"], ["Sekou Kromah", "m"], ["Abraham Dolo", "m"],
    ["Prince Flomo", "m"],
  ],
  "Other African-background": [
    ["Amara Okonkwo", "f"], ["Zanele Dlamini", "f"], ["Wanjiru Kamau", "f"],
    ["Abena Mensah", "f"], ["Fatoumata Diallo", "f"], ["Naledi Molefe", "f"],
    ["Chiamaka Eze", "f"], ["Aisha Bakari", "f"], ["Thandiwe Nkosi", "f"],
    ["Akinyi Otieno", "f"], ["Lombe Chanda", "f"], ["Esnath Phiri", "f"],
    ["Selam Tesfaye", "f"], ["Hodan Warsame", "f"], ["Yasmin Nur", "f"],
    ["Adaeze Nwosu", "f"], ["Mwende Musyoka", "f"], ["Nadia Bangura", "f"],
    ["Isatou Ceesay", "f"], ["Riziki Mwangi", "f"], ["Kelechi Obi", "f"],
    ["Tumelo Sithole", "f"], ["Bintou Traore", "f"], ["Chipo Nyathi", "f"],
    ["Grace Achieng", "f"],
    ["Kwame Boateng", "m"], ["Chikondi Mbewe", "m"], ["Emeka Nwachukwu", "m"],
    ["Baraka Mushi", "m"], ["Tinashe Zvobgo", "m"], ["Sipho Khumalo", "m"],
    ["Ousman Jallow", "m"], ["Jean-Claude Habimana", "m"], ["Mubanga Chileshe", "m"],
    ["Kojo Asante", "m"], ["Abdi Farah", "m"], ["Lekan Adeyemi", "m"],
    ["Kagiso Tau", "m"], ["Moussa Coulibaly", "m"], ["Peter Okello", "m"],
    ["Themba Mokoena", "m"],
  ],
  "Indian-background": [
    ["Simran Kaur", "f"], ["Anjali Sharma", "f"], ["Priya Patel", "f"],
    ["Neha Verma", "f"], ["Kavya Reddy", "f"], ["Riya Gupta", "f"],
    ["Aditi Nair", "f"], ["Pooja Yadav", "f"], ["Sneha Joshi", "f"],
    ["Meera Menon", "f"], ["Divya Rao", "f"], ["Aarti Chauhan", "f"],
    ["Navdeep Kaur", "f"], ["Gurleen Bajwa", "f"], ["Jaspreet Gill", "f"],
    ["Simarjit Sandhu", "f"], ["Rupinder Bains", "f"], ["Harleen Dhaliwal", "f"],
    ["Manpreet Sidhu", "f"], ["Ekamjot Aulakh", "f"], ["Amandeep Brar", "f"],
    ["Rajwinder Sekhon", "f"], ["Kiran Bala", "f"],
    ["Arjun Singh", "m"], ["Rohan Mehta", "m"], ["Karan Malhotra", "m"],
    ["Vikram Bhatia", "m"], ["Aditya Kumar", "m"], ["Rahul Iyer", "m"],
    ["Siddharth Joshi", "m"], ["Harshit Agarwal", "m"], ["Nikhil Chawla", "m"],
    ["Gurpreet Dhillon", "m"], ["Manjit Randhawa", "m"], ["Jaskaran Cheema", "m"],
    ["Amritpal Grewal", "m"],
  ],
};
const NAME_TARGETS = {
  "South Sudanese-inspired": 15,
  "Zimbabwean-inspired": 10,
  "Liberian-inspired": 10,
  "Other African-background": 41,
  "Indian-background": 36,
};

/* ----------------------------------------------------------- programmes --- */
const PROGRAMME_WEIGHTS = {
  "computer-science-engineering": 12,
  "btech-cse-cyber-security": 6,
  "artificial-intelligence-ml": 8,
  "mechanical-engineering": 8,
  "civil-engineering": 6,
  bca: 12,
  bba: 8,
  "bcom-hons": 7,
  bpharm: 7,
  "bsc-fashion-designing": 5,
  bhmct: 5,
  bajmc: 6,
  bttm: 4,
  "bsc-mls": 5,
  mba: 6,
  "mba-international-business": 3,
  "mba-fintech": 3,
  dpharm: 4,
};
const programmeWeights = PROGRAMMES.map((p) => PROGRAMME_WEIGHTS[p] ?? 4);

/* ------------------------------------------------------------- answers --- */
function buildAnswers() {
  const vis = rnd(); // notices what happens around them
  const infra = rnd(); // perceives weak bins / infrastructure
  const awareness = rnd(); // rules + campaign awareness
  const eng = rnd(); // personal engagement / responsibility
  const knowledge = rnd(); // sorting knowledge
  const socialNorm = rnd();
  const peerBelief = rnd();
  const socialConf = rnd();
  const comm = clamp01(0.65 * awareness + 0.35 * rnd());

  const a = { [CONSENT]: true };

  a.q1 = band(clamp01(0.45 * vis + 0.45 * infra + 0.1 * rnd()),
    [0.2, 0.38, 0.58, 0.78], opts("q1"));

  a.q2 = pickWeighted(opts("q2"),
    [0.34 + infra * 0.18, 0.22, 0.3, 0.14 + (1 - vis) * 0.28]);

  const q3 = clamp01(0.72 * (1 - infra) + 0.28 * vis + 0.1 * (rnd() - 0.5));
  a.q3 = rnd() < 0.05 + (1 - vis) * 0.12
    ? "f"
    : band(q3, [0.18, 0.36, 0.56, 0.76], optsEx("q3", ["f"]));

  const q4 = clamp01(0.68 * infra + 0.32 * rnd());
  a.q4 = rnd() < 0.06 + (1 - vis) * 0.1
    ? "f"
    : band(q4, [0.18, 0.36, 0.56, 0.76], optsEx("q4", ["f"]));

  const q5 = clamp01(0.6 * (1 - infra) + 0.25 * knowledge + 0.15 * rnd());
  if (q5 > 0.7) a.q5 = "a";
  else if (q5 > 0.45) a.q5 = "b";
  else if (q5 > 0.3) a.q5 = "c";
  else a.q5 = rnd() < 0.5 ? "d" : "e";

  a.q6 = band(clamp01(0.55 * eng + 0.25 * socialNorm + 0.2 * rnd()),
    [0.34, 0.66], opts("q6"));

  const q7 = clamp01(0.5 * eng + 0.3 * (1 - infra) + 0.2 * rnd());
  if (q7 > 0.72) a.q7 = rnd() < 0.5 ? "c" : "d";
  else if (q7 > 0.42) a.q7 = "b";
  else a.q7 = "a";

  a.q8 = rnd() < 0.1 + (1 - vis) * 0.12
    ? "f"
    : band(clamp01(0.6 * peerBelief + 0.4 * rnd()),
        [0.18, 0.36, 0.56, 0.76], optsEx("q8", ["f"]));

  a.q9 = band(clamp01(0.45 * eng + 0.35 * socialConf + 0.2 * rnd()),
    [0.2, 0.38, 0.58, 0.78], opts("q9"));

  const q10 = clamp01(0.7 * awareness + 0.3 * rnd());
  a.q10 = q10 > 0.62 ? "a" : q10 > 0.34 ? "b" : "c";

  const q11 = clamp01(0.75 * comm + 0.25 * rnd());
  a.q11 = q11 > 0.72 ? "d" : q11 > 0.46 ? "c" : q11 > 0.24 ? "b" : "a";

  const q12 = clamp01(0.5 * awareness + 0.3 * comm + 0.2 * rnd());
  a.q12 = q12 > 0.66 ? "c" : q12 > 0.36 ? "b" : "a";

  const q13 = clamp01(0.75 * knowledge + 0.25 * rnd());
  a.q13 = q13 > 0.66 ? "c" : q13 > 0.36 ? "b" : "a";

  a.q15 = pickWeighted(["a", "b", "c", "d", "e"], [
    0.25 + infra * 0.6,
    0.25 + (1 - awareness) * 0.6,
    0.15 + (1 - eng) * 0.35,
    0.12,
    0.1 + (1 - vis) * 0.15,
  ]);

  a.q16 = pickWeighted(["a", "b", "c", "d"], [
    0.2 + infra * 0.7,
    0.2 + (knowledge < 0.5 ? 0.4 : 0.1) + (1 - awareness) * 0.2,
    0.15 + eng * 0.3,
    0.15 + (1 - eng) * 0.25,
  ]);

  a.q17 = pickWeighted(["a", "b", "c", "d"],
    [0.3 + eng * 0.1, 0.3, 0.22, 0.18]);

  a.q18 = pickWeighted(["a", "b", "c", "d"],
    [0.3, 0.28, 0.22 + (1 - awareness) * 0.1, 0.2 + eng * 0.1]);

  const q19 = clamp01(0.7 * eng + 0.3 * rnd());
  a.q19 = q19 > 0.75 ? "d" : q19 > 0.5 ? "c" : q19 > 0.25 ? "b" : "a";

  // Deliberate inconsistencies: knowledge, habits and opinions need not align.
  if (rnd() < 0.14) {
    const kind = Math.floor(rnd() * 4);
    if (kind === 0 && a.q13 === "c") a.q7 = "a";
    else if (kind === 1 && a.q10 === "a") a.q15 = rnd() < 0.5 ? "d" : "e";
    else if (kind === 2 && a.q11 === "a") a.q6 = "c";
    else if (kind === 3) a.q9 = "c";
  }

  return a;
}

/* ----------------------------------------------------------- timestamps --- */
// Asia/Kolkata (UTC+05:30) local hour windows per day.
const DAY_PLAN = {
  "2026-10-13": [[7, 9, 2], [10, 12, 2], [12, 14, 3], [14, 17, 2], [17, 19, 2], [19, 22, 1]],
  "2026-10-14": [[7, 9, 1], [10, 12, 3], [12, 14, 3], [14, 17, 4], [17, 19, 3], [19, 22, 2]],
  "2026-10-15": [[7, 9, 3], [10, 12, 6], [12, 14, 8], [14, 17, 20], [17, 19, 10], [19, 22, 9]],
  "2026-10-16": [[7, 9, 2], [10, 12, 5], [12, 14, 5], [14, 17, 8], [17, 19, 5], [19, 22, 3]],
};
const pad = (n) => String(n).padStart(2, "0");

function buildTimeline() {
  const times = [];
  for (const [date, windows] of Object.entries(DAY_PLAN)) {
    for (const [startHour, endHour, count] of windows) {
      for (let i = 0; i < count; i++) {
        const hour = startHour + Math.floor(rnd() * (endHour - startHour));
        const minute = Math.floor(rnd() * 60);
        const second = Math.floor(rnd() * 60);
        times.push(`${date}T${pad(hour)}:${pad(minute)}:${pad(second)}+05:30`);
      }
    }
  }
  return times.sort();
}

/* --------------------------------------------------------------- build --- */
const nameSlots = [];
for (const [category, target] of Object.entries(NAME_TARGETS)) {
  const pool = NAMES[category];
  if (pool.length !== target) {
    throw new Error(`Name pool "${category}" has ${pool.length}, expected ${target}`);
  }
  for (const [name, gender] of pool) nameSlots.push({ name, gender, category });
}
shuffle(nameSlots);

const names = new Set();
for (const slot of nameSlots) {
  if (names.has(slot.name)) throw new Error(`Duplicate name: ${slot.name}`);
  names.add(slot.name);
}

const timeline = buildTimeline();
if (timeline.length !== nameSlots.length) {
  throw new Error(`Timeline ${timeline.length} != profiles ${nameSlots.length}`);
}

const seenProfiles = new Set();
const records = timeline.map((createdAt, index) => {
  const { name } = nameSlots[index];
  let answers = buildAnswers();
  let guard = 0;
  while (seenProfiles.has(JSON.stringify(answers)) && guard++ < 50) {
    answers = buildAnswers();
  }
  seenProfiles.add(JSON.stringify(answers));
  return {
    schemaVersion: "v4",
    createdAt,
    answers: {
      consent: answers[CONSENT],
      profile_full_name: name,
      profile_programme: pickWeighted(PROGRAMMES, programmeWeights),
      profile_phone: "",
      ...Object.fromEntries(QUESTION_IDS.map((id) => [id, answers[id]])),
    },
  };
});

mkdirSync(new URL("../test-data/", import.meta.url), { recursive: true });
writeFileSync(OUT_URL, JSON.stringify({ records }, null, 2) + "\n", "utf8");

/* -------------------------------------------------------------- summary --- */
const byDay = {};
for (const r of records) {
  const d = r.createdAt.slice(0, 10);
  byDay[d] = (byDay[d] ?? 0) + 1;
}
const byCategory = {};
for (const slot of nameSlots) {
  byCategory[slot.category] = (byCategory[slot.category] ?? 0) + 1;
}
const female = nameSlots.filter((s) => s.gender === "f").length;
const unique = new Set(records.map((r) => JSON.stringify(r.answers))).size;

console.log(`Wrote ${records.length} records to test-data/v4-synthetic-2026-10.json`);
console.log(`Batch id: ${BATCH_ID}`);
console.log("By day:", JSON.stringify(byDay));
console.log("By category:", JSON.stringify(byCategory));
console.log(`Female-sounding names: ${female} (${((female / records.length) * 100).toFixed(1)}%)`);
console.log(`Unique answer profiles: ${unique}/${records.length}`);
