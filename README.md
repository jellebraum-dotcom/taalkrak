# Taalkrak

Nederlandse spelling oefenen voor de lagere school — **per graad**, opgebouwd volgens de leerlijn spelling van het Vlaamse basisonderwijs (GO!-leerplan Nederlands, schriftelijke en mondelinge taalvaardigheid). Als installeerbare web-app (PWA) voor op iPads, met een aparte leerkracht-tool om oefeningen op maat te maken en te delen via QR-code of link.

Het broertje van [Rekenkrak](https://github.com/jellebraum-dotcom/rekenkrak).

## Twee toepassingen in één map

| Bestand           | Voor wie   | Wat                                                                                                          |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `index.html`      | Leerlingen | Zelf oefenen (kies je graad en onderwerpen) óf een QR-code van de juf/meester scannen. Installeerbaar als app-icoon, werkt offline. |
| `leerkracht.html` | Leerkracht | Oefeningen op maat samenstellen, QR-codes/links genereren, en klassikaal "samen oefenen" op het (touch)bord. |

De QR-codes en links uit de leerkracht-tool openen automatisch de leerlingapp met de juiste oefening — alle instellingen zitten in de link zelf, er is geen server of login nodig.

## Leerlijn per graad

**1e graad (L1–L2)** — hakwoorden (klankzuiver), tweetekenklanken (oe/eu/ui/ie), medeklinkerclusters, sch(r)-, ng/nk, aai/ooi/oei, eer/oor/eur, eeuw/ieuw, zinnen met hoofdletter en punt.

**2e graad (L3–L4)** — eind -d of -t (langer maken), verdubbelaar, verenkelaar, ei/ij, au/ou, verkleinwoorden, cht/gt, hoofdletters en leestekens.

**3e graad (L5–L6)** — werkwoordspelling (tegenwoordige tijd, verleden tijd met 't kofschip, voltooid deelwoord), c-woorden, leenwoorden, tussenletters -e(n)- en -s-, apostrof en accenten, -ig/-lijk, moeilijke uitgangen (-tie, -teit, -isch).

## Oefenvormen

- 🔊 **Luisterdictee** (mondeling → schriftelijk): de app leest het woord voor met de Nederlandse voorleesstem van het toestel, het kind typt het.
- **Invuloefening**: woord met een gaatje — kies de juiste letter(s), bv. ei/ij, d/t, kk/k.
- **Welk woord is juist?**: kies de juiste schrijfwijze uit 2–3 varianten (met voorleesknop).
- **Werkwoorden** (3e graad): vervoeg het werkwoord juist in de zin.

Verder: aantal oefeningen (5/10/15/20/∞), optionele tijdsdruk, sterren, confetti en een eindscherm met medaille. In de klassikale modus ("samen oefenen") staan er extra grote knoppen voor op het touch-/digibord: handen opsteken → antwoord tonen → volgende.

## Zelf hosten

Zet alle bestanden samen in één map op GitHub Pages (of eender welke https-host). De volledige stap-voor-stap uitleg staat in [LEESMIJ.md](LEESMIJ.md).

> Camera-scannen en de voorleesstem vereisen **https**; GitHub Pages levert dat automatisch.

## Technisch

Puur statisch: HTML/CSS/JavaScript zonder build-stap of server. Gedeelde spelling-engine (`engine.js`) voor beide pagina's, [qrcode-generator](https://www.npmjs.com/package/qrcode-generator) voor het maken en [jsQR](https://www.npmjs.com/package/jsqr) voor het scannen van QR-codes. Het luisterdictee gebruikt de Web Speech API (Nederlandse stem, voorkeur nl-BE). Service worker + manifest maken er een offline werkende, installeerbare PWA van.

## Licentie

[MIT](LICENSE)
