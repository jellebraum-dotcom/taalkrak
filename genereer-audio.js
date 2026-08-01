#!/usr/bin/env node
/* =====================================================================
   Taalkrak — audio aanmaken met een Vlaamse stem van Azure AI Speech.

   Dit script leest alle woorden en zinnen uit engine.js, laat ze inspreken
   door Azure en zet het resultaat in de map "audio". De app gebruikt die
   opnames daarna automatisch; ontbreken ze, dan valt ze terug op de stem
   van het toestel.

   GEBRUIK (Node 18 of nieuwer, geen extra pakketten nodig):

     Windows PowerShell:
       $env:AZURE_SPEECH_KEY="jouw-sleutel"
       $env:AZURE_SPEECH_REGION="westeurope"
       node genereer-audio.js

     macOS / Linux:
       AZURE_SPEECH_KEY=jouw-sleutel AZURE_SPEECH_REGION=westeurope node genereer-audio.js

   Het script kan veilig opnieuw gedraaid worden: bestaande bestanden
   worden overgeslagen. Voeg --opnieuw toe om alles te vernieuwen.

   Stem wisselen? Zet VOICE hieronder op "nl-BE-ArnaudNeural" (man).
   ===================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const VOICE  = process.env.AZURE_VOICE  || "nl-BE-DenaNeural";  // Vlaams, vrouw
const RATE   = process.env.AZURE_RATE   || "-8%";               // ietsje trager voor kinderen
const KEY    = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION || "westeurope";
const OPNIEUW = process.argv.indexOf("--opnieuw") > -1;

const UIT = path.join(__dirname, "audio");
const FORMAT = "audio-24khz-48kbitrate-mono-mp3";

if (!KEY) {
  console.error("\n  Geen sleutel gevonden.\n" +
    "  Zet eerst AZURE_SPEECH_KEY (en eventueel AZURE_SPEECH_REGION).\n" +
    "  Zie de uitleg bovenaan dit bestand.\n");
  process.exit(1);
}

/* ---------- alle uit te spreken items uit engine.js halen ---------- */
const TK = require(path.join(__dirname, "engine.js"));
function verzamel() {
  const set = new Set();
  [1, 2, 3].forEach(g => {
    TK.themesFor(g).forEach(t => {
      (t.words || []).forEach(w => set.add(TK.parseWord(w, t.alts).word));
      (t.items || []).forEach(it => {
        if (it.z) set.add(it.z.replace("___", it.a).replace(/ \./g, "."));
        else set.add(it.a);
      });
    });
  });
  return [...set];
}

/* ---------- bestandsnaam maken die leesbaar blijft ---------- */
function slug(s) {
  return s.toLowerCase()
    .replace(/[àáâä]/g, "a").replace(/[éèêë]/g, "e").replace(/[íìîï]/g, "i")
    .replace(/[óòôö]/g, "o").replace(/[úùûü]/g, "u").replace(/ç/g, "c")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "item";
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/* ---------- één zin laten inspreken ---------- */
async function spreek(tekst) {
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="nl-BE">` +
      `<voice name="${VOICE}"><prosody rate="${RATE}">${esc(tekst)}</prosody></voice>` +
    `</speak>`;
  const url = `https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
  for (let poging = 1; poging <= 4; poging++) {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": FORMAT,
        "User-Agent": "taalkrak"
      },
      body: ssml
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status === 429 || r.status >= 500) {           // even wachten en opnieuw
      await new Promise(res => setTimeout(res, 800 * poging));
      continue;
    }
    throw new Error(`Azure gaf ${r.status} ${r.statusText} bij "${tekst}"`);
  }
  throw new Error(`Te veel pogingen bij "${tekst}"`);
}

/* ---------- hoofdprogramma ---------- */
(async function () {
  const items = verzamel();
  const tekens = items.reduce((n, s) => n + s.length, 0);
  console.log(`\n  Taalkrak — audio aanmaken`);
  console.log(`  stem      : ${VOICE}  (regio ${REGION})`);
  console.log(`  items     : ${items.length}`);
  console.log(`  tekens    : ${tekens}  — de gratis laag van Azure geeft 500.000 per maand\n`);

  if (!fs.existsSync(UIT)) fs.mkdirSync(UIT);

  const manifest = {};
  const gebruikt = new Set();
  let nieuw = 0, over = 0;

  for (let i = 0; i < items.length; i++) {
    const tekst = items[i];
    let naam = slug(tekst), n = 2;
    while (gebruikt.has(naam)) naam = slug(tekst) + "-" + n++;   // nooit twee keer dezelfde naam
    gebruikt.add(naam);
    const bestand = naam + ".mp3";
    const pad = path.join(UIT, bestand);

    if (!OPNIEUW && fs.existsSync(pad) && fs.statSync(pad).size > 500) {
      over++;
    } else {
      const buf = await spreek(tekst);
      fs.writeFileSync(pad, buf);
      nieuw++;
      await new Promise(res => setTimeout(res, 120));           // rustig aan met de API
    }
    manifest[tekst] = bestand;

    const klaar = i + 1;
    if (klaar % 25 === 0 || klaar === items.length) {
      process.stdout.write(`  ${klaar}/${items.length} verwerkt\r`);
    }
  }

  fs.writeFileSync(path.join(UIT, "manifest.json"),
    JSON.stringify({ voice: VOICE, rate: RATE, files: manifest }, null, 1));

  const mb = fs.readdirSync(UIT)
    .reduce((n, f) => n + fs.statSync(path.join(UIT, f)).size, 0) / 1048576;
  console.log(`\n\n  Klaar. ${nieuw} nieuw ingesproken, ${over} overgeslagen.`);
  console.log(`  Map "audio": ${fs.readdirSync(UIT).length} bestanden, ${mb.toFixed(1)} MB\n`);
  console.log(`  Zet de map "audio" mee online (naast index.html) en de app`);
  console.log(`  gebruikt hem vanzelf.\n`);
})().catch(e => { console.error("\n  Fout:", e.message, "\n"); process.exit(1); });
