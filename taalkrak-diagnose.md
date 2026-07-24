# Luisterdictee — diagnose en verbeterplan

Bron: `jellebraum-dotcom/taalkrak` → `engine.js`, blok "VOORLEESSTEM (dictee)".
Vergeleken met `jellebraum-dotcom/rekenkrak` voor de architectuurpunten.

---

## De kern: het is geen snelheidsprobleem

De klacht is "de spraak gaat te snel". De code zet `u.rate = .88`, wat op zich
niet extreem is. Er zitten vier fouten onder die samen het effect veroorzaken —
en de belangrijkste is een uitspraakprobleem, geen tempoprobleem.

### Bug 1 — stille terugval op een Engelse stem *(grootste impact)*

```js
nlVoice = be || nl;          // kan null zijn
...
if (nlVoice) u.voice = nlVoice;   // niet gezet als null
u.lang = (nlVoice && nlVoice.lang) || "nl-BE";
```

Staat er geen Nederlandse stem op het toestel, dan blijft `u.voice` leeg en kiest
de browser de **standaardstem** — meestal Engels. `u.lang = "nl-BE"` zetten
verandert daar niets aan; `lang` is een hint, `voice` is de beslissing.

Het resultaat: een Engelse stem die Nederlandse woorden leest. "schrijven" wordt
"skrijven", "boek" wordt "boak", "ui" wordt onherkenbaar. Een Engelse stem legt
ook andere klemtoon en heeft een kortere klinkeraanhoud → het *klinkt* gehaast,
terwijl de rate identiek is.

Voor een dictee is dit fataal: het kind schrijft wat het hoort, en wat het hoort
klopt niet. **Fix: geen terugval. Geen NL-stem = niet spreken + de leerkracht
waarschuwen.** Zwijgen is beter dan verkeerd voordoen.

### Bug 2 — race condition bij het laden van stemmen

```js
findVoice();                                  // getVoices() is hier vaak leeg
speechSynthesis.onvoiceschanged = findVoice;
```

`getVoices()` geeft in Chrome bij de eerste aanroep een lege array terug; stemmen
komen asynchroon binnen. `nextExercise()` spreekt na 350 ms. Is de lijst dan nog
niet geladen, dan valt `speak()` terug op Bug 1 — voor het eerste woord van de
reeks. Dat verklaart het intermitterende karakter ("sóms gaat het te snel").

**Fix: verzoeken parkeren in een wachtrij tot de stemmen geladen zijn.**

### Bug 3 — `cancel()` direct gevolgd door `speak()`

```js
speechSynthesis.cancel();
...
speechSynthesis.speak(u);
```

`cancel()` is asynchroon. In Chrome en Edge wordt een `speak()` die er direct op
volgt regelmatig ingeslikt of halverwege afgekapt. Een afgekapt woord klinkt
precies als een te snel woord.

**Fix: ~70 ms tussen `cancel()` en `speak()`.**

### Bug 4 — één snelheid voor alle leeftijden

`BASE_RATE` bestaat niet: graad 1 (L1–L2, 6–8 jaar) krijgt exact dezelfde `.88`
als graad 3 (L5–L6, 10–12 jaar). Voor een zesjarige die klank-voor-klank
verwerkt, is dat te snel.

**Fix: tempo per graad — 0.75 / 0.84 / 0.92.**

### Bonus — dode code

```js
u.rate = slow ? .72 : .88;
```

De parameter `slow` wordt **nergens in het bestand doorgegeven**. De trage modus
is nooit bereikbaar. Juist voor zesjarigen is "nog eens, maar trager" de meest
gevraagde knop. Hij zat er al half in.

### Bonus — losse woorden worden afgekapt

Veel engines geven een woord zonder leesteken geen zinsprosodie: de laatste klank
wordt ingekort. `"vis"` → `"vis."` levert een rustiger, vollere uitspraak.

---

## Wat er in de patch zit

`luisterdictee-tts-fix.js` vervangt het TTS-blok en voegt toe:

| # | Wijziging | Effect |
|---|-----------|--------|
| 1 | Geen Engelse terugval + waarschuwingsbalk | Nooit meer foute uitspraak |
| 2 | Stemkeuze op kwaliteit (`nl-BE` > `nl-NL`, enhanced > compact) | Natuurlijker klank |
| 3 | Wachtrij tot stemmen geladen zijn | Eerste woord klopt ook |
| 4 | 70 ms tussen `cancel()` en `speak()` | Geen afgekapte woorden |
| 5 | Tempo per graad | 6-jarigen krijgen 0.75 |
| 6 | 🐢-knop die `{slow:true}` gebruikt | Herhalen op eigen tempo |
| 7 | Punt achter losse woorden | Volle laatste klank |
| 8 | `primeTTS()` vanuit `resumeAudio()` | Werkt op iOS/Safari |
| 9 | `ttsUsable()` | Luisterdictee verbergen als het niet kan |

---

## Testen — dit kan ik niet voor je verifiëren

Spraaksynthese heeft een echte browser met geluid nodig. Handmatige checklist:

1. **Chrome desktop, NL-stem geïnstalleerd** — graad 1, luisterdictee. Eerste
   woord moet correct en rustig klinken (niet alleen het tweede).
2. **Chrome zónder NL-stem** (verwijder alle NL-stemmen) — er mag *geen* geluid
   komen; de rode balk moet verschijnen.
3. **iPad/Safari** — spraak moet werken na de eerste tik op "Start".
4. **Snel doorklikken** — 5× achter elkaar op 🔊: geen overlap, geen afkapping.
5. **Graad 1 vs graad 3** — hoorbaar verschil in tempo.
6. **🐢-knop** — merkbaar trager dan 🔊.

Kritieke woorden om op te testen (hier gaat een Engelse stem de mist in):
`schrijven` · `ui` · `geeuw` · `chocolade` · `journaal` · `horloge` · `cadeau`

---

## Groter beeld: wat de skills hier verder zien

### Gedeelde kern (`/architecture`, `/tech-debt`)

`rekenkrak` en `taalkrak` zijn architectonisch identieke tweelingen: `engine.js`,
`index.html`, `leerkracht.html`, `qrcode.js`, `jsqr.js`, `sw.js`, PWA-manifest,
dezelfde instellingen-UI, dezelfde QR-deellink, dezelfde confetti en geluiden.

`jsqr.js` en `qrcode.js` hebben in beide repo's **dezelfde SHA** — letterlijk
gedupliceerde bestanden. Elke bugfix in gedeelde code moet je nu twee keer doen.
Precies wat er met deze TTS-fix zou gebeuren als rekenkrak ooit spraak krijgt.

Een `krak-core` met UI-chrome, QR, PWA, geluid, TTS en spelverloop — waarbij
elke app alleen zijn eigen leerlijn en oefengeneratie meebrengt — is de logische
volgende stap. Dat sluit ook aan bij je doel om omgevingen te centraliseren.

### Tests (`/testing-strategy`)

In `engine.js` staat letterlijk:

```js
/* compatibele helper (o.a. voor tests): trekt uit een meegegeven staat */
```

Er zijn geen tests. De pure functies lenen zich er uitstekend voor —
`parseWord`, `mutate`, `buildDeck`, `drawEntry`, `parseParams`/`buildHash`
(round-trip), en de garantie dat een woord niet twee keer na elkaar komt. Geen
build nodig; de module exporteert al via `module.exports`.

### Toegankelijkheid

Een dictee-app voor zesjarigen leunt volledig op audio. `ttsUsable()` is een
begin, maar een leerkracht die de app op een schooltoestel opent, wil vóóraf
weten of luisterdictee daar werkt — niet halverwege een klasoefening.

---

*Onderzocht via de publieke repo's; de TTS-fix is geschreven maar niet in een
browser gedraaid.*
