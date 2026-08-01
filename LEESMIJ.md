# Taalkrak online zetten — stap voor stap

Taalkrak werkt precies zoals Rekenkrak: alle bestanden in één map op GitHub Pages.

## 1. Nieuwe repository maken

1. Ga naar [github.com/new](https://github.com/new).
2. Naam: **taalkrak** · Public · geen extra bestanden aanvinken.
3. Klik **Create repository**.

## 2. Bestanden uploaden

1. Klik in de nieuwe repo op **uploading an existing file**.
2. Sleep álle bestanden uit deze map erin (niet de map zelf, wel de inhoud):
   `index.html`, `leerkracht.html`, `engine.js`, `taalkrak.css`, `qrcode.js`, `jsqr.js`, `sw.js`, `manifest.webmanifest`, de vier `.png`-iconen, `README.md`, `LEESMIJ.md`, `LICENSE`.
3. Klik **Commit changes**.

## 3. GitHub Pages aanzetten

1. Repo → **Settings** → **Pages** (linkermenu).
2. Bij *Source*: **Deploy from a branch** → branch **main**, map **/ (root)** → **Save**.
3. Na een minuutje staat de site op:
   - Leerlingen: `https://jellebraum-dotcom.github.io/taalkrak/`
   - Leerkracht: `https://jellebraum-dotcom.github.io/taalkrak/leerkracht.html`

## 4. Op de iPads zetten

1. Open de leerlingen-link in Safari.
2. Deel-knop → **Zet op beginscherm**. Er verschijnt een Taalkrak-icoon; de app werkt daarna ook offline.

## 5. Zo gebruik je het in de klas

- **Leerkracht**: open `leerkracht.html`, kies graad, onderwerpen en oefenvormen → er verschijnt meteen een QR-code. Leerlingen komen langs en scannen, of je drukt de QR af.
- **Klassikaal**: kies "👩‍🏫 Samen oefenen" en klik "▶ Start klasoefening" op het digibord.
- **Zelfstandig**: leerlingen openen de app en kiezen via "Zelf oefenen" hun eigen graad en onderwerpen.


## 6. Optioneel: een Vlaamse stem meeleveren

Standaard leest de app voor met de stem van het toestel zelf. Op een iPad is dat prima (Ellen, nl-BE), op een Windows-pc krijg je vaak een Hollandse stem. Je kunt de woorden ook één keer laten inspreken door een Vlaamse stem van Azure en die opnames meeleveren — dan klinkt het overal hetzelfde en werkt het ook zonder internet.

**Wat je nodig hebt:** een gratis Azure-account met een Speech-resource. Je hoeft niets te betalen: de hele Taalkrak is samen 3.614 tekens en de gratis laag geeft er 500.000 per maand.

1. Maak op [portal.azure.com](https://portal.azure.com) een resource *Speech Services* aan (regio bv. West Europe).
2. Kopieer bij **Keys and Endpoint** je sleutel en je regio.
3. Open een terminal in deze map en draai (Node 18 of nieuwer):

   PowerShell:
   ```
   $env:AZURE_SPEECH_KEY="jouw-sleutel"
   $env:AZURE_SPEECH_REGION="westeurope"
   node genereer-audio.js
   ```

   macOS of Linux:
   ```
   AZURE_SPEECH_KEY=jouw-sleutel AZURE_SPEECH_REGION=westeurope node genereer-audio.js
   ```

4. Er verschijnt een map **audio** met 421 mp3'jes en een `manifest.json`. Upload die map mee naar GitHub (naast `index.html`).

De app merkt vanzelf dat de opnames er zijn en gebruikt ze. Ontbreken ze, dan valt ze terug op de stem van het toestel — je kunt dus niets stukmaken.

Liever een mannenstem? Zet `AZURE_VOICE=nl-BE-ArnaudNeural` erbij. Te snel of te traag? Pas `AZURE_RATE` aan, bijvoorbeeld `-15%`.

> Je sleutel blijft op je eigen computer: hij wordt alleen gebruikt om de mp3's te maken en komt nooit in de app of op GitHub terecht.

## Tips

- Het **luisterdictee** gebruikt de voorleesstem van het toestel. Op een iPad: Instellingen → Toegankelijkheid → Gesproken materiaal → Stemmen → Nederlands, kies eventueel een Vlaamse stem (Ellen).
- De QR-code verandert live mee met de instellingen — je hoeft niets op te slaan.
- Werkt het scannen niet (geen camera-toestemming)? Deel dan gewoon de link.
