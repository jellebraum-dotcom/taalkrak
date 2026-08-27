/* ============================================================
   Krak — sessielaag voor Taalkrak en Rekenkrak
   ------------------------------------------------------------
   Praat met Supabase via gewone fetch-oproepen naar de RPC-functies.
   Geen SDK, geen CDN, geen build-stap: past bij de rest van de app en
   blijft offline werken (zonder net doen de oproepen gewoon niets).

   Laad dit NA krak-config.js:
       <script src="krak-config.js"></script>
       <script src="krak-sessie.js"></script>

   De sessiecode reist mee in de link als &ls=XXXX. Die sleutel is vrij in
   beide apps, en beide parseParams-functies negeren onbekende sleutels —
   buildHash en parseParams hoeven dus niet aangepast te worden.
   ============================================================ */

var KrakSessie = (function(){
"use strict";

var CFG = (typeof window!=="undefined" && window.KRAK_CONFIG) || null;
var SLEUTEL_BEHEER = "krak.beheer";        /* leerkracht, localStorage      */
var VOORVOEGSEL_DEELNAME = "krak.deelname."; /* leerling, per sessiecode    */

/* ---------- basis ---------- */

function ingesteld(){
  return !!(CFG && CFG.url && CFG.sleutel &&
            String(CFG.url).indexOf("VUL_HIER") < 0 &&
            String(CFG.sleutel).indexOf("VUL_HIER") < 0);
}

function rpc(naam, params){
  if(!ingesteld()){
    return Promise.reject(new Error("krak-config.js is nog niet ingevuld"));
  }
  var basis = String(CFG.url).replace(/\/+$/, "");
  return fetch(basis + "/rest/v1/rpc/" + naam, {
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
function zet(sleutel, waarde){
  try{ window.localStorage.setItem(sleutel, JSON.stringify(waarde)); }catch(e){}
}
function haal(sleutel){
  try{
    var s = window.localStorage.getItem(sleutel);
    return s ? JSON.parse(s) : null;
  }catch(e){ return null; }
}
function wis(sleutel){
  try{ window.localStorage.removeItem(sleutel); }catch(e){}
}

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

function overzicht(){
  var s = lopendeSessie();
  if(!s) return Promise.resolve(null);
  return rpc("sessie_overzicht", { p_beheer_token: s.beheer }).then(function(rijen){
    rijen = rijen || [];
    var eerste = rijen[0] || {};
    var leerlingen = rijen
      .filter(function(r){ return r.voornaam != null; })
      .map(function(r){
        return {
          voornaam: r.voornaam,
          juist: r.juist || 0,
          totaal: r.totaal || 0,
          klaar: !!r.klaar,
          bijgewerkt: r.bijgewerkt_op
        };
      });
    return {
      code: eerste.sessie_code || s.code,
      actief: !!eerste.sessie_actief,
      app: eerste.sessie_app || s.app,
      leerlingen: leerlingen
    };
  }).catch(function(f){
    /* De sessie is uit de database verdwenen (opgekuist): vergeet ze ook hier. */
    if(f && f.message === "sessie_niet_gevonden"){ vergeetSessie(); return null; }
    throw f;
  });
}

/* Blijft het overzicht ophalen tot je de teruggegeven functie aanroept. */
function volg(bij, fout, ms){
  var gestopt = false, timer = null;
  var pauze = ms || 2000;
  function ronde(){
    overzicht()
      .then(function(stand){ if(!gestopt && stand && bij) bij(stand); })
      .catch(function(f){ if(!gestopt && fout) fout(f); })
      .then(function(){ if(!gestopt) timer = setTimeout(ronde, pauze); });
  }
  ronde();
  return function stop(){
    gestopt = true;
    if(timer) clearTimeout(timer);
  };
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
   meld() en loopt() niet afhangen van wat er in de adresbalk staat. */
var actieveCode = null;

function deelname(code){
  var c = code || actieveCode || codeUitHash();
  if(!c) return null;
  var d = haal(VOORVOEGSEL_DEELNAME + String(c).toUpperCase());
  if(!d || !d.token) return null;
  actieveCode = String(c).toUpperCase();
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

/* Voortgang doorsturen. Faalt nooit hoorbaar: een leerling zonder net moet
   gewoon verder kunnen oefenen. Hoogstens één oproep per seconde, behalve de
   eindstand — die gaat meteen. */
var laatsteDuw = 0, wachtend = null, duwTimer = null;

function meld(juist, totaal, klaar){
  var d = deelname();
  if(!d) return Promise.resolve(false);
  wachtend = { juist: juist|0, totaal: totaal|0, klaar: !!klaar, token: d.token };
  if(wachtend.klaar){
    if(duwTimer){ clearTimeout(duwTimer); duwTimer = null; }
    return duw();
  }
  var sinds = Date.now() - laatsteDuw;
  if(sinds >= 1000) return duw();
  if(!duwTimer){
    duwTimer = setTimeout(function(){ duwTimer = null; duw(); }, 1000 - sinds);
  }
  return Promise.resolve(true);
}

function duw(){
  var p = wachtend;
  if(!p) return Promise.resolve(false);
  laatsteDuw = Date.now();
  return rpc("voortgang_bijwerken", {
    p_token: p.token, p_juist: p.juist, p_totaal: p.totaal, p_klaar: p.klaar
  }).catch(function(){ return false; });
}

/* Loopt de sessie nog? Bij netwerkproblemen geven we true terug — we willen
   een leerling niet uit een oefening gooien door één mislukte oproep. */
function loopt(){
  var d = deelname();
  if(!d) return Promise.resolve(false);
  return rpc("sessie_loopt", { p_token: d.token }).catch(function(){ return true; });
}

/* ============================================================ */

return {
  ingesteld: ingesteld,
  codeUitHash: codeUitHash,
  codeInLink: codeInLink,

  start: start,
  lopendeSessie: lopendeSessie,
  vergeetSessie: vergeetSessie,
  overzicht: overzicht,
  volg: volg,
  beeindig: beeindig,

  join: join,
  deelname: deelname,
  verlaat: verlaat,
  meld: meld,
  loopt: loopt
};
})();

if(typeof module !== "undefined" && module.exports) module.exports = KrakSessie;
