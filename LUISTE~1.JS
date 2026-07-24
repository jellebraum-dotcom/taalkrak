/* ============================================================================
   TAALKRAK — VERVANGING VAN HET TTS-BLOK IN engine.js
   ----------------------------------------------------------------------------
   Vervang het volledige blok tussen
       /* ===================== VOORLEESSTEM (dictee) ===================== *​/
   en
       function ttsAvailable(){ ... }
   door de code hieronder.

   Doel: onberispelijke Nederlandse uitspraak voor kinderen vanaf 6 jaar.
   ========================================================================== */

/* ===================== VOORLEESSTEM (dictee) ===================== */

var nlVoice      = null;   // gekozen Nederlandse stem
var voicesLoaded = false;  // getVoices() heeft iets teruggegeven
var voiceQueue   = [];     // speak()-verzoeken van vóór het laden
var voiceWarned  = false;  // waarschuwing al getoond?

/* Spreeksnelheid per graad. Graad 1 = L1–L2 = kinderen van 6–8 jaar:
   die hebben merkbaar meer tijd nodig om een klank te verwerken dan L5–L6.
   Eén vaste snelheid voor alle graden was de kern van het probleem. */
var BASE_RATE = { 1: 0.75, 2: 0.84, 3: 0.92 };

/* ---- Stemkeuze -------------------------------------------------------------
   Niet "de eerste de beste NL-stem", maar de béste. Compacte systeemstemmen
   klinken blikkerig en hakkelen op losse woorden; enhanced/neural-stemmen niet.
--------------------------------------------------------------------------- */
function scoreVoice(v){
  var lang = (v.lang || "").toLowerCase().replace("_", "-");
  if (lang.slice(0, 2) !== "nl") return -1;            // geen Nederlands → onbruikbaar

  var s = (lang === "nl-be") ? 100 : 60;               // Vlaams boven Nederlands-NL
  var n = (v.name || "").toLowerCase();

  if (/enhanced|premium|neural|natural|wavenet|siri/.test(n)) s += 25;
  if (/compact/.test(n))                                      s -= 20;
  if (v.localService)                                         s += 10;  // geen netwerkhapering
  return s;
}

function findVoice(){
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  var vs = speechSynthesis.getVoices() || [];
  if (!vs.length) return null;                         // nog niet geladen — wacht op event
  voicesLoaded = true;

  var best = null, bestScore = -1;
  vs.forEach(function(v){
    var s = scoreVoice(v);
    if (s > bestScore){ bestScore = s; best = v; }
  });

  /* KRITIEK: géén terugval op de standaardstem. Zonder NL-stem zwijgen we
     liever dan een Engelse stem "schrijven" of "boek" te laten uitspreken. */
  nlVoice = (bestScore >= 0) ? best : null;

  var q = voiceQueue; voiceQueue = [];                 // wachtrij afhandelen
  q.forEach(function(job){ speak(job.text, job.opts); });

  return nlVoice;
}

if (typeof window !== "undefined" && window.speechSynthesis){
  findVoice();
  speechSynthesis.onvoiceschanged = findVoice;
}

/* ---- Voorbereiding van de tekst -------------------------------------------
   Losse woorden zonder leesteken worden door veel engines afgekapt of gehaast
   uitgesproken. Een afsluitende punt dwingt zinsprosodie af: rustiger, voller,
   met een natuurlijke uitloop op de laatste klank.
--------------------------------------------------------------------------- */
function prepareTTS(text){
  var t = String(text == null ? "" : text).trim();
  if (!t) return "";
  if (!/[.!?…]$/.test(t)) t += ".";
  return t;
}

/* ---- Waarschuwing als er geen NL-stem is ---------------------------------- */
function warnNoVoice(){
  if (voiceWarned) return;
  voiceWarned = true;

  try { console.warn("Taalkrak: geen Nederlandse stem gevonden — luisterdictee zwijgt."); } catch(e){}

  if (typeof document === "undefined") return;
  var bar = document.createElement("div");
  bar.className = "ttswarn";
  bar.setAttribute("role", "status");
  bar.textContent = "Geen Nederlandse stem op dit toestel. " +
                    "Installeer een Nederlandse stem bij de taalinstellingen, " +
                    "of kies een andere oefenvorm dan luisterdictee.";
  bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:9999;" +
                      "padding:12px 16px;background:#E5566B;color:#fff;" +
                      "font:600 15px/1.35 system-ui,sans-serif;text-align:center";
  bar.onclick = function(){ bar.remove(); };
  document.body.appendChild(bar);
  setTimeout(function(){ if (bar.parentNode) bar.remove(); }, 12000);
}

/* ---- Spreken --------------------------------------------------------------
   speak(text)                → normale snelheid voor de huidige graad
   speak(text, {slow:true})   → ±0.15 trager, voor de herhaalknop
   speak(text, true)          → idem (oude aanroepvorm blijft werken)
--------------------------------------------------------------------------- */
function speak(text, opts){
  if (opts === true)  opts = { slow: true };
  if (!opts)          opts = {};

  if (typeof window === "undefined" || !window.speechSynthesis || !soundOn) return false;
  if (!text) return false;

  /* Stemmen nog niet geladen? Parkeer het verzoek i.p.v. het te laten vallen.
     Dít is waarom het eerste woord van een reeks vaak fout klonk. */
  if (!voicesLoaded){
    findVoice();
    if (!voicesLoaded){
      if (voiceQueue.length < 3) voiceQueue.push({ text: text, opts: opts });
      return false;
    }
  }

  if (!nlVoice){ warnNoVoice(); return false; }        // liever stil dan verkeerd

  var graad = (typeof game !== "undefined" && game && game.cfg && game.cfg.graad) || 1;
  var rate  = BASE_RATE[graad] || 0.8;
  if (opts.slow) rate = Math.max(0.60, rate - 0.15);

  try{
    speechSynthesis.cancel();

    var u = new SpeechSynthesisUtterance(prepareTTS(text));
    u.voice  = nlVoice;
    u.lang   = nlVoice.lang;
    u.rate   = rate;
    u.pitch  = 1;
    u.volume = 1;
    u.onerror = function(e){
      var err = e && e.error;
      if (err && err !== "canceled" && err !== "interrupted"){
        try { console.warn("Taalkrak TTS:", err); } catch(_){}
      }
    };

    /* Chrome/Edge: cancel() is asynchroon. speak() er direct achteraan wordt
       ingeslikt of halverwege afgekapt — precies het "te snel"-effect.
       Een korte adempauze lost dat op. */
    setTimeout(function(){ try { speechSynthesis.speak(u); } catch(e){} }, 70);
    return true;
  } catch(e){ return false; }
}

/* ---- iOS/Safari: spraak moet één keer door een gebruikersgebaar ontgrendeld
   worden. resumeAudio() draait al op een echte tik, dus haken we hier aan. --- */
function primeTTS(){
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try{
    var u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch(e){}
  findVoice();
}

function ttsAvailable(){
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

/* Geeft aan of luisterdictee écht kan (stem aanwezig), niet alleen of de
   browser de API kent. Bruikbaar om de oefenvorm te verbergen. */
function ttsUsable(){
  if (!ttsAvailable()) return false;
  if (!voicesLoaded) findVoice();
  return !!nlVoice;
}


/* ==========================================================================
   BIJKOMENDE WIJZIGINGEN ELDERS IN engine.js
   ========================================================================== */

/* -- 1. In resumeAudio(): voeg primeTTS() toe --------------------------------
function resumeAudio(){
  try{
    if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==="suspended") actx.resume();
  }catch(e){}
  primeTTS();                                    // <-- NIEUW
}
--------------------------------------------------------------------------- */

/* -- 2. Nieuwe "trager"-knop (naast speakerBtn) ------------------------------
   De parameter `slow` bestond al in speak(), maar werd nergens gebruikt: dode
   code. Voor zesjarigen is een herhaalknop op lagere snelheid juist essentieel.

function slowBtn(text){
  var b = el("button","speakbtn speakbtn--slow","🐢");
  b.type = "button";
  b.setAttribute("aria-label","Luister nog eens, trager");
  b.onclick = function(){ resumeAudio(); speak(text, {slow:true}); };
  return b;
}
--------------------------------------------------------------------------- */

/* -- 3. In renderBody(), tak ex.vorm==="dictee" ------------------------------
   Toon beide knoppen:

   box.appendChild(el("p","exlead", cls ? "Luister goed. Wie kan dit woord schrijven?"
                                        : "Luister en typ het woord"));
   var spk = el("div","speakrow");
   spk.appendChild(speakerBtn(ex.tts, true));
   spk.appendChild(slowBtn(ex.tts));             // <-- NIEUW
   box.appendChild(spk);
--------------------------------------------------------------------------- */

/* -- 4. In nextExercise(): iets meer lucht vóór het eerste woord -------------
   350 ms is krap als de render nog bezig is; het begin van het woord viel weg.

   if(ex.vorm==="dictee" && game.cfg.session!=="class")
     setTimeout(function(){ speak(ex.tts); }, 500);      // was 350
--------------------------------------------------------------------------- */

/* -- 5. In de export-lijst onderaan ------------------------------------------
   speak:speak, ttsAvailable:ttsAvailable, ttsUsable:ttsUsable, primeTTS:primeTTS
--------------------------------------------------------------------------- */

/* -- 6. CSS (taalkrak.css) ---------------------------------------------------
.speakrow{ display:flex; gap:12px; align-items:center; justify-content:center; }
.speakbtn--slow{ font-size:.8em; opacity:.85; }
.ttswarn{ cursor:pointer; }
--------------------------------------------------------------------------- */
