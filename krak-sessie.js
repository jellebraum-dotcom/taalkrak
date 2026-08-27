/* ============================================================
   Krak — sessielaag voor Taalkrak en Rekenkrak   (versie 2)
   ------------------------------------------------------------
   Praat met Supabase via gewone fetch-oproepen naar de RPC-functies.
   Geen SDK, geen CDN, geen build-stap: past bij de rest van de app en
   blijft offline werken (zonder net doen de oproepen gewoon niets).

   Laad dit NA krak-config.js:
       <script src="krak-config.js"></script>
       <script src="krak-sessie.js"></script>

   Een sessie loopt een les lang en bevat RONDES. Elke ronde is één
   oefening die de leerkracht start. Leerlingtoestellen vragen elke paar
   seconden wat ze moeten doen en schakelen mee over.

   De sessiecode reist mee in de link als &ls=XXXX. Die sleutel is vrij in
   beide apps, en beide parseParams-functies negeren onbekende sleutels —
   buildHash en parseParams hoeven dus niet aangepast te worden.
   ============================================================ */

var KrakSessie = (function(){
"use strict";

var CFG = (typeof window!=="undefined" && window.KRAK_CONFIG) || null;
var SLEUTEL_BEHEER = "krak.beheer";
var VOORVOEGSEL_DEELNAME = "krak.deelname.";

/* ---------- basis ---------- */

function ingesteld(){
  return !!(CFG && CFG.url && CFG.sleutel &&
            String(CFG.url).indexOf("VUL_HIER") < 0 &&
            String(CFG.sleutel).indexOf("VUL_HIER") < 0);
}

/* De "Connect"-knop van Supabase geeft de URL soms mét /rest/v1 erachter.
   Dat stuk plakken we zelf, dus halen we het er hier af — anders krijg je
   "Invalid path specified in request URL". */
function basisUrl(){
  return String(CFG.url || "").trim()
    .replace(/\/+$/, "").replace(/\/rest\/v1$/i, "").replace(/\/+$/, "");
}

function rpc(naam, params){
  if(!ingesteld()) return Promise.reject(new Error("krak-config.js is nog niet ingevuld"));
  return fetch(basisUrl() + "/rest/v1/rpc/" + naam, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "apikey": CFG.sleutel,
      "Authorization": "Bearer " + CFG.sleutel
    },
    body: JSON.stringify(params || {})
  }).then(function(r){
    return r.text().then(function(tekst){
      var data = null;
      try{ data = tekst ? JSON.parse(tekst) : null; }catch(e){}
      if(!r.ok){
        var reden = (data && (data.message || data.hint)) || ("http_" + r.status);
        var f = new Error(reden); f.status = r.status; f.data = data;
        throw f;
      }
      return data;
    });
  });
}

/* Opslag mag altijd falen (privémodus, geblokkeerde cookies): nooit crashen. */
function zet(s, w){ try{ window.localStorage.setItem(s, JSON.stringify(w)); }catch(e){} }
function haal(s){ try{ var v=window.localStorage.getItem(s); return v?JSON.parse(v):null; }catch(e){ return null; } }
function wis(s){ try{ window.localStorage.removeItem(s); }catch(e){} }

/* ---------- sessiecode in de link ---------- */

function codeUitHash(bron){
  var str = bron;
  if(str == null) str = (typeof location !== "undefined" ? location.hash : "");
  if(!str) return null;
  var i = String(str).indexOf("#");
  if(i > -1) str = String(str).slice(i + 1);
  var gevonden = null;
  String(str).split("&").forEach(function(deel){
    var m = deel.split("=");
    if(m[0] === "ls" && m[1]) gevonden = decodeURIComponent(m[1]).toUpperCase();
  });
  return (gevonden && /^[A-Z0-9]{4}$/.test(gevonden)) ? gevonden : null;
}

function codeInLink(url, code){
  if(!code) return url;
  if(String(url).indexOf("ls=") > -1) return url;
  return url + (String(url).indexOf("#") > -1 ? "&" : "#") + "ls=" + code;
}

/* ============================================================
   Leerkracht
   ============================================================ */

function start(app, titel){
  return rpc("sessie_start", { p_app: app, p_titel: titel || null })
    .then(function(rijen){
      var r = rijen && rijen[0];
      if(!r || !r.code) throw new Error("sessie_niet_aangemaakt");
      var s = { code: r.code, beheer: r.beheer_token, app: app };
      zet(SLEUTEL_BEHEER, s);
      return s;
    });
}

function lopendeSessie(){
  var s = haal(SLEUTEL_BEHEER);
  return (s && s.beheer && s.code) ? s : null;
}

function vergeetSessie(){ wis(SLEUTEL_BEHEER); }

/* Volgende oefening starten. config is de instellingenhash van de app zelf,
   bv. "#g=1&th=hak&v=dictee&n=10&t=0&m=s". Geeft het rondenummer terug. */
function rondeStart(config){
  var s = lopendeSessie();
  if(!s) return Promise.reject(new Error("geen_sessie"));
  return rpc("ronde_start", { p_beheer_token: s.beheer, p_config: config });
}

function overzicht(){
  var s = lopendeSessie();
  if(!s) return Promise.resolve(null);
  return rpc("sessie_overzicht", { p_beheer_token: s.beheer })
    .catch(function(f){
      /* De sessie is uit de database verdwenen (opgekuist): vergeet ze ook hier. */
      if(f && f.message === "sessie_niet_gevonden"){ vergeetSessie(); return null; }
      throw f;
    });
}

/* Blijft het overzicht ophalen tot je de teruggegeven functie aanroept. */
function volg(bij, fout, ms){
  var gestopt = false, timer = null, pauze = ms || 2000;
  function ronde(){
    overzicht()
      .then(function(stand){ if(!gestopt && stand && bij) bij(stand); })
      .catch(function(f){ if(!gestopt && fout) fout(f); })
      .then(function(){ if(!gestopt) timer = setTimeout(ronde, pauze); });
  }
  ronde();
  return function stop(){ gestopt = true; if(timer) clearTimeout(timer); };
}

function beeindig(){
  var s = lopendeSessie();
  if(!s) return Promise.resolve(false);
  return rpc("sessie_beeindigen", { p_beheer_token: s.beheer });
}

/* ============================================================
   Leerling
   ============================================================ */

/* Welke sessie deze leerling bezig is. Normaal staat de code in de link, maar
   ze kan ook ingetypt zijn — daarom onthouden we ze zodra ze bekend is, zodat
   de rest niet afhangt van wat er in de adresbalk staat. */
var actieveCode = null;

function deelname(code){
  var c = code || actieveCode || codeUitHash();
  if(!c) return null;
  c = String(c).toUpperCase();
  var d = haal(VOORVOEGSEL_DEELNAME + c);
  if(!d || !d.token) return null;
  actieveCode = c;
  return d;
}

function join(code, voornaam){
  var c = String(code || "").toUpperCase();
  return rpc("sessie_join", { p_code: c, p_voornaam: voornaam })
    .then(function(token){
      if(!token) throw new Error("geen_token");
      var d = { token: token, code: c, voornaam: voornaam };
      zet(VOORVOEGSEL_DEELNAME + c, d);
      actieveCode = c;
      return d;
    });
}

function verlaat(code){
  var c = code || actieveCode || codeUitHash();
  if(c) wis(VOORVOEGSEL_DEELNAME + String(c).toUpperCase());
  actieveCode = null;
  wachtend = null;
  if(duwTimer){ clearTimeout(duwTimer); duwTimer = null; }
}

/* Wat moet ik nu doen? Geeft {gevonden, actief, nummer, config}.
   nummer 0 betekent: aangesloten, maar de juf zette nog geen oefening klaar. */
function stand(){
  var d = deelname();
  if(!d) return Promise.resolve(null);
  return rpc("leerling_stand", { p_token: d.token })
    .catch(function(){ return null; });   /* netwerkhik: niets veranderen */
}

/* Roept bij() aan zodra er iets verandert: een nieuwe ronde, of de sessie die
   stopt. Niet bij elke poging — alleen bij een echte wijziging. */
function volgOpdracht(bij, ms){
  var gestopt = false, timer = null, vorige = null, pauze = ms || 2000;
  function ronde(){
    stand().then(function(st){
      if(gestopt || !st) return;
      var sleutel = !st.gevonden ? "weg" : (!st.actief ? "stop" : "r" + st.nummer);
      if(sleutel !== vorige){ vorige = sleutel; if(bij) bij(st); }
    }).catch(function(){}).then(function(){
      if(!gestopt) timer = setTimeout(ronde, pauze);
    });
  }
  ronde();
  return function stop(){ gestopt = true; if(timer) clearTimeout(timer); };
}

/* Voortgang doorsturen voor één ronde. Faalt nooit hoorbaar: een leerling
   zonder net moet gewoon verder kunnen oefenen. Hoogstens één oproep per
   seconde, behalve de eindstand en het wisselen van ronde — die gaan meteen. */
var laatsteDuw = 0, wachtend = null, duwTimer = null;

function meld(ronde, juist, totaal, klaar){
  var d = deelname();
  if(!d) return Promise.resolve(false);
  var nieuw = { token: d.token, ronde: ronde|0, juist: juist|0, totaal: totaal|0, klaar: !!klaar };

  /* Nog iets open staan van een andere ronde? Dat eerst wegschrijven,
     anders gaat de stand van de vorige oefening verloren. */
  if(wachtend && wachtend.ronde !== nieuw.ronde){
    if(duwTimer){ clearTimeout(duwTimer); duwTimer = null; }
    duw();
  }
  wachtend = nieuw;

  if(nieuw.klaar){
    if(duwTimer){ clearTimeout(duwTimer); duwTimer = null; }
    return duw();
  }
  var sinds = Date.now() - laatsteDuw;
  if(sinds >= 1000) return duw();
  if(!duwTimer) duwTimer = setTimeout(function(){ duwTimer = null; duw(); }, 1000 - sinds);
  return Promise.resolve(true);
}

function duw(){
  var p = wachtend;
  if(!p) return Promise.resolve(false);
  laatsteDuw = Date.now();
  return rpc("voortgang_bijwerken", {
    p_token: p.token, p_ronde: p.ronde,
    p_juist: p.juist, p_totaal: p.totaal, p_klaar: p.klaar
  }).catch(function(){ return false; });
}

/* ============================================================ */

return {
  ingesteld: ingesteld,
  codeUitHash: codeUitHash,
  codeInLink: codeInLink,

  start: start,
  rondeStart: rondeStart,
  lopendeSessie: lopendeSessie,
  vergeetSessie: vergeetSessie,
  overzicht: overzicht,
  volg: volg,
  beeindig: beeindig,

  join: join,
  deelname: deelname,
  verlaat: verlaat,
  stand: stand,
  volgOpdracht: volgOpdracht,
  meld: meld
};
})();

if(typeof module !== "undefined" && module.exports) module.exports = KrakSessie;
