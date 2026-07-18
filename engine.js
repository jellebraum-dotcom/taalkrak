/* ============================================================
   Taalkrak — gedeelde spelling-engine voor leerling en leerkracht
   Leerlijn spelling Nederlands, basisonderwijs Vlaanderen (GO!),
   per graad. Puur statisch, geen server nodig.
   ============================================================ */
var TK = (function(){
"use strict";

/* ===================== LEERLIJN & WOORDENLIJSTEN =====================
   Per graad een reeks thema's. Elk thema:
   id, label, sub (voorbeeld), vormen (welke oefenvormen kunnen),
   alts (keuzemogelijkheden voor invuloefening), words (met {gap}),
   of items (werkwoordzinnen / zinnen).
   Notatie: "ri{ng}"  → gat = "ng", keuzes uit theme.alts
            "dorp{s|}straat" → gat = "s", eigen alternatieven na "|"
   ==================================================================== */

var THEMES = {
1:[
 {id:"hak", label:"Hakwoorden", sub:"vis · boom · kat", vormen:["dictee","keuze"],
  mut:[["v","f"],["f","v"],["z","s"],["s","z"],["aa","a"],["oo","o"],["ee","e"],["uu","u"],["b","p"],["k","g"]],
  words:["vis","maan","boom","roos","vuur","bus","pen","kat","sok","bal","jas","mes","tak","pot","muur","boot","zon","kip","net","doos","wip","vel","bak","zak","pit","neef"]},
 {id:"twee", label:"Woorden met oe, eu, ui, ie", sub:"boek · deur · huis", vormen:["dictee","invul","keuze"], alts:["oe","eu","ui","ie"],
  words:["b{oe}k","v{oe}t","n{eu}s","d{eu}r","r{eu}s","h{ui}s","m{ui}s","t{ui}n","t{ie}n","r{ie}m","b{ui}k","h{oe}d","d{oe}k","z{oe}n","v{ie}s","d{ui}f","st{oe}p","kl{eu}r"]},
 {id:"cluster", label:"Twee medeklinkers", sub:"stoel · kast · bril", vormen:["dictee","keuze"],
  mut:[["tr","t"],["st","s"],["kl","k"],["br","b"],["fl","f"],["pl","p"],["kr","k"],["bl","b"],["vl","f"],["dr","d"],["gr","g"],["kn","n"],["lk","k"],["rg","g"],["nt","t"],["sp","s"],["zw","z"]],
  words:["stoel","klas","trap","kast","fles","bril","spin","snoep","kroon","bloem","vlag","drop","gras","knie","plant","wolk","melk","berg","step","zwaan","vlot","klok"]},
 {id:"sch", label:"Woorden met sch en schr", sub:"school · schrift", vormen:["dictee","invul","keuze"], alts:["sch","sg","sh"],
  words:["{sch}ool","{sch}oen","{sch}aap","{sch}ip","{sch}elp","{sch}at","{sch}aar","{sch}ort","{sch}uur","{sch}rift","{sch}rik","{sch}roef","{sch}ram","{sch}op","{sch}il"]},
 {id:"ngnk", label:"Woorden met ng en nk", sub:"ring · bank", vormen:["dictee","invul","keuze"], alts:["ng","nk"],
  words:["ri{ng}","ba{ng}","la{ng}","jo{ng}","di{ng}","to{ng}","sla{ng}","za{ng}","ba{nk}","pi{nk}","pla{nk}","fli{nk}","vo{nk}","dra{nk}","kla{nk}","we{nk}"]},
 {id:"aai", label:"Woorden met aai, ooi, oei", sub:"haai · kooi · boei", vormen:["dictee","invul","keuze"], alts:["aai","ooi","oei"],
  words:["h{aai}","kr{aai}","vl{aai}","dr{aai}","zw{aai}","k{ooi}","m{ooi}","g{ooi}","h{ooi}","d{ooi}","b{oei}","gr{oei}","bl{oei}","r{oei}","f{oei}","kn{oei}"]},
 {id:"eer", label:"Woorden met eer, oor, eur", sub:"beer · door · kleur", vormen:["dictee","invul","keuze"], alts:["eer","oor","eur"],
  words:["b{eer}","p{eer}","m{eer}","k{eer}","v{eer}","{oor}","d{oor}","b{oor}","sp{oor}","k{oor}","kl{eur}","g{eur}","d{eur}","z{eur}","sch{eur}"]},
 {id:"eeuw", label:"Woorden met eeuw en ieuw", sub:"leeuw · nieuw", vormen:["dictee","invul","keuze"], alts:["eeuw","ieuw"],
  words:["l{eeuw}","m{eeuw}","sn{eeuw}","spr{eeuw}","g{eeuw}","schr{eeuw}","n{ieuw}","k{ieuw}","ben{ieuw}d"]},
 {id:"zin1", label:"Zinnen: hoofdletter en punt", sub:"De kat slaapt.", vormen:["keuze"],
  items:[
   {a:"De kat slaapt.", w:["de kat slaapt.","De kat slaapt"]},
   {a:"Ik speel buiten.", w:["ik speel buiten.","Ik speel buiten"]},
   {a:"De zon schijnt.", w:["de zon schijnt","De zon schijnt"]},
   {a:"Mama bakt een taart.", w:["mama bakt een taart.","Mama bakt een taart"]},
   {a:"De hond blaft luid.", w:["de hond blaft luid.","De hond blaft luid"]},
   {a:"Wij lezen een boek.", w:["wij lezen een boek.","Wij lezen een boek"]},
   {a:"Het regent vandaag.", w:["het regent vandaag","Het regent vandaag"]},
   {a:"De juf schrijft op het bord.", w:["de juf schrijft op het bord.","De juf schrijft op het bord"]},
   {a:"Opa leest de krant.", w:["opa leest de krant.","Opa leest de krant"]},
   {a:"De vogel zingt mooi.", w:["de vogel zingt mooi","De vogel zingt mooi"]}]}
],
2:[
 {id:"dt", label:"Eind -d of -t (langer maken)", sub:"hond → honden", vormen:["dictee","invul","keuze"], alts:["d","t"],
  words:["hon{d}","han{d}","mon{d}","lan{d}","broo{d}","paar{d}","woor{d}","be{d}","pa{d}","draa{d}","bran{d}","win{d}","zan{d}","stran{d}","vrien{d}","avon{d}","hel{d}","gel{d}","beel{d}","kran{t}","mun{t}","ten{t}","wan{t}","kan{t}","poor{t}","kas{t}"]},
 {id:"verdubbel", label:"Verdubbelaar", sub:"bakker · zitten", vormen:["dictee","invul","keuze"],
  words:["ba{kk|k}er","zi{tt|t}en","be{ll|l}en","ki{pp|p}en","ma{nn|n}en","pe{nn|n}en","so{kk|k}en","be{dd|d}en","ka{tt|t}en","vi{ss|s}en","wa{kk|k}er","le{kk|k}er","a{pp|p}el","mi{dd|d}en","le{tt|t}er","bru{gg|g}en","tra{pp|p}en","po{tt|t}en"]},
 {id:"verenkel", label:"Verenkelaar", sub:"boom → bomen", vormen:["dictee","invul","keuze"],
  words:["b{o|oo}men","{u|uu}ren","m{u|uu}ren","j{a|aa}ren","{o|oo}gen","{o|oo}ren","{a|aa}pen","p{e|ee}ren","v{u|uu}ren","h{a|aa}ren","n{a|aa}men","sch{o|oo}len","g{a|aa}ten","str{a|aa}ten","b{o|oo}ten","dr{o|oo}men"]},
 {id:"eiij", label:"ei of ij", sub:"trein · ijs", vormen:["dictee","invul","keuze"], alts:["ei","ij"],
  words:["tr{ei}n","pl{ei}n","kl{ei}n","g{ei}t","m{ei}sje","z{ei}l","{ei}nde","kon{ij}n","p{ij}n","v{ij}f","w{ij}n","pr{ij}s","gr{ij}s","k{ij}ken","schr{ij}ven","bl{ij}","{ij}sje","f{ij}n","{ij}zer"]},
 {id:"auou", label:"au of ou", sub:"auto · koud", vormen:["dictee","invul","keuze"], alts:["au","ou"],
  words:["{au}to","{au}gustus","p{au}w","s{au}s","bl{au}w","g{au}w","k{ou}d","{ou}d","g{ou}d","h{ou}t","f{ou}t","z{ou}t","m{ou}w","t{ou}w","b{ou}wen","vr{ou}w","sch{ou}der","h{ou}den"]},
 {id:"klein", label:"Verkleinwoorden", sub:"boompje · ringetje", vormen:["dictee","invul","keuze"], alts:["je","tje","pje","etje"],
  words:["boom{pje}","huis{je}","bloem{etje}","stoel{tje}","vis{je}","brood{je}","kat{je}","muis{je}","tafel{tje}","ring{etje}","jas{je}","boek{je}","deur{tje}","raam{pje}","been{tje}","duim{pje}","ster{retje}","bal{letje}"]},
 {id:"cht", label:"cht of gt", sub:"nacht · hij vliegt", vormen:["dictee","invul","keuze"], alts:["cht","gt"],
  words:["na{cht}","lu{cht}","za{cht}","li{cht}","re{cht}","a{cht}","vlu{cht}","bo{cht}","vo{cht}","di{cht}","kra{cht}","pli{cht}","hij vlie{gt}","zij ze{gt}","hij li{gt}","zij draa{gt}","hij vraa{gt}","zij zor{gt}"]},
 {id:"zin2", label:"Hoofdletters en leestekens", sub:"namen · ? · !", vormen:["keuze"],
  items:[
   {a:"Wij wonen in Gent.", w:["Wij wonen in gent.","wij wonen in Gent."]},
   {a:"Lies en Tom spelen buiten.", w:["Lies en tom spelen buiten.","lies en Tom spelen buiten."]},
   {a:"Kom je morgen ook?", w:["Kom je morgen ook.","kom je morgen ook?"]},
   {a:"Wat een mooie tekening!", w:["Wat een mooie tekening?","wat een mooie tekening!"]},
   {a:"Anna woont in Brugge.", w:["anna woont in Brugge.","Anna woont in brugge."]},
   {a:"Hoe laat is het?", w:["Hoe laat is het.","hoe laat is het?"]},
   {a:"Pas op voor de auto!", w:["pas op voor de auto!","Pas op voor de auto."]},
   {a:"Milan gaat naar Antwerpen.", w:["milan gaat naar Antwerpen.","Milan gaat naar antwerpen."]},
   {a:"Wanneer begint de film?", w:["Wanneer begint de film.","wanneer begint de film?"]},
   {a:"Noor heeft een rode fiets.", w:["noor heeft een rode fiets.","Noor heeft een rode Fiets."]}]}
],
3:[
 {id:"wwtt", label:"Werkwoorden: tegenwoordige tijd", sub:"hij loopt · antwoordt", vormen:["werkwoord"],
  items:[
   {z:"Elke dag ___ hij naar school.", inf:"lopen", a:"loopt", w:["lopt","loopd"]},
   {z:"Ik ___ graag een boek.", inf:"lezen", a:"lees", w:["leest","leez"]},
   {z:"Zij ___ elke woensdag.", inf:"zwemmen", a:"zwemt", w:["zwemd","zwem"]},
   {z:"___ jij morgen mee?", inf:"gaan", a:"ga", w:["gaat","gat"]},
   {z:"Hij ___ zijn tanden.", inf:"poetsen", a:"poetst", w:["poets","poetsd"]},
   {z:"Jij ___ heel mooi.", inf:"zingen", a:"zingt", w:["zing","zingd"]},
   {z:"Mijn zus ___ een brief.", inf:"schrijven", a:"schrijft", w:["schrijfd","schrijf"]},
   {z:"De hond ___ in de tuin.", inf:"blaffen", a:"blaft", w:["blafd","blaf"]},
   {z:"Ik ___ een hoge toren.", inf:"bouwen", a:"bouw", w:["bouwt","bouwd"]},
   {z:"Hij ___ het antwoord.", inf:"weten", a:"weet", w:["weett","wet"]},
   {z:"Zij ___ de zware deur.", inf:"openen", a:"opent", w:["opend","opened"]},
   {z:"Papa ___ de soep.", inf:"proeven", a:"proeft", w:["proefd","proevt"]},
   {z:"Hij ___ zich elke ochtend.", inf:"wassen", a:"wast", w:["wasd","was"]},
   {z:"Het meisje ___ heel hard.", inf:"rennen", a:"rent", w:["rend","rentt"]},
   {z:"Oma ___ een spannend verhaal.", inf:"vertellen", a:"vertelt", w:["verteld","verteltd"]},
   {z:"Hij ___ altijd beleefd.", inf:"antwoorden", a:"antwoordt", w:["antwoord","antwoort"]},
   {z:"Zij ___ het raam.", inf:"sluiten", a:"sluit", w:["sluitt","sluid"]},
   {z:"De leraar ___ de toetsen uit.", inf:"delen", a:"deelt", w:["deeld","delt"]}]},
 {id:"wwvt", label:"Werkwoorden: verleden tijd", sub:"'t kofschip: -te of -de", vormen:["werkwoord"],
  items:[
   {z:"Gisteren ___ ik mijn fiets.", inf:"poetsen", a:"poetste", w:["poetsde","poeste"]},
   {z:"Oma ___ gisteren koekjes.", inf:"bakken", a:"bakte", w:["bakde","bakkte"]},
   {z:"De hond ___ heel luid.", inf:"blaffen", a:"blafte", w:["blafde","blaftte"]},
   {z:"Wij ___ ons huiswerk.", inf:"maken", a:"maakten", w:["maakden","makten"]},
   {z:"Hij ___ een mooi lied.", inf:"zingen", a:"zong", w:["zingde","zang"]},
   {z:"Ik ___ lang op de bus.", inf:"wachten", a:"wachtte", w:["wachte","wachtde"]},
   {z:"Hij ___ zijn kamer.", inf:"verven", a:"verfde", w:["verfte","vervde"]},
   {z:"Zij ___ met de trein naar zee.", inf:"reizen", a:"reisde", w:["reiste","reizde"]},
   {z:"De juf ___ de les nog eens.", inf:"herhalen", a:"herhaalde", w:["herhaalte","herhalde"]},
   {z:"Ik ___ me heel snel aan.", inf:"kleden", a:"kleedde", w:["klede","kleede"]},
   {z:"Wij ___ de taart samen.", inf:"versieren", a:"versierden", w:["versierten","versierde"]},
   {z:"Het ___ de hele dag.", inf:"regenen", a:"regende", w:["regenden","reegende"]},
   {z:"Hij ___ de bal naar mij.", inf:"gooien", a:"gooide", w:["gooidde","goide"]},
   {z:"Zij ___ vroeger in Gent.", inf:"wonen", a:"woonde", w:["woonte","wonde"]}]},
 {id:"wwvd", label:"Voltooid deelwoord", sub:"gehaald · geverfd", vormen:["werkwoord"],
  items:[
   {z:"Ik heb mijn boek ___ .", inf:"halen", a:"gehaald", w:["gehaalt","gehald"]},
   {z:"Hij heeft de kaart ___ .", inf:"posten", a:"gepost", w:["gepostd","geposd"]},
   {z:"Wij hebben een lied ___ .", inf:"zingen", a:"gezongen", w:["gezingd","gezonge"]},
   {z:"Zij heeft haar kamer ___ .", inf:"verven", a:"geverfd", w:["geverft","geverved"]},
   {z:"De taart is goed ___ .", inf:"bakken", a:"gebakken", w:["gebakt","gebaken"]},
   {z:"Ik heb heel lang ___ .", inf:"wachten", a:"gewacht", w:["gewachtt","gewachd"]},
   {z:"Hij heeft het raam ___ .", inf:"openen", a:"geopend", w:["geopent","geopened"]},
   {z:"Wij zijn naar zee ___ .", inf:"reizen", a:"gereisd", w:["gereist","gereizd"]},
   {z:"Het feest is goed ___ .", inf:"lukken", a:"gelukt", w:["gelukd","geluktt"]},
   {z:"Zij heeft een foto ___ .", inf:"maken", a:"gemaakt", w:["gemaakd","gemakt"]},
   {z:"De hond heeft de hele nacht ___ .", inf:"blaffen", a:"geblaft", w:["geblafd","geblaftt"]},
   {z:"Ik heb me al ___ .", inf:"wassen", a:"gewassen", w:["gewast","gewasen"]},
   {z:"Hij heeft zijn toets ___ .", inf:"verbeteren", a:"verbeterd", w:["verbetert","geverbeterd"]},
   {z:"Zij heeft de deur ___ .", inf:"sluiten", a:"gesloten", w:["gesluit","geslooten"]}]},
 {id:"cwoord", label:"c-woorden (c als k of s)", sub:"cadeau · citroen", vormen:["dictee","keuze"],
  mut:[["c","k"],["c","s"]],
  words:["cadeau","circus","citroen","cactus","camera","december","precies","concert","centrum","cijfer","succes","medicijn","computer","directeur","chocolade","contact"]},
 {id:"leen", label:"Leenwoorden", sub:"bureau · douche", vormen:["dictee","keuze"],
  mut:[["eau","o"],["ch","sj"],["g","zj"],["ou","oe"],["y","ie"],["x","ks"],["ee","ie"],["au","o"],["aa","a"]],
  words:["bureau","chauffeur","douche","etage","garage","horloge","machine","paraplu","portemonnee","restaurant","weekend","baby","taxi","pyjama","shampoo","niveau","cabine","journaal"]},
 {id:"tussen", label:"Tussenletters -e(n)- en -s-", sub:"pannenkoek · dorpsstraat", vormen:["dictee","invul","keuze"],
  words:["pann{en|e}koek","boek{en|e}kast","kipp{en|e}hok","ball{en|e}bak","krant{en|e}winkel","bloem{en|e}winkel","zonn{e|en}bril","zonn{e|en}schijn","dorp{s|}straat","station{s|}plein","verkeer{s|}bord","leven{s|}gevaar","stad{s|}park","koning{s|}dag"]},
 {id:"apo", label:"Apostrof en accenten", sub:"baby's · café", vormen:["dictee","invul","keuze"],
  words:["baby{'s|s}","oma{'s|s}","opa{'s|s}","paraplu{'s|s}","menu{'s|s}","foto{'s|s}","auto{'s|s}","piano{'s|s}","caf{é|e}","id{ee|é}"]},
 {id:"iglijk", label:"-ig en -lijk", sub:"prachtig · eerlijk", vormen:["dictee","invul","keuze"],
  words:["pracht{ig|ug|eg}","gelukk{ig|ug|eg}","aard{ig|ug|eg}","nod{ig|ug|eg}","eer{lijk|luk|lik}","moei{lijk|luk|lik}","gevaar{lijk|luk|lik}","einde{lijk|luk|lik}","vriende{lijk|luk|lik}","duide{lijk|luk|lik}","le{lijk|luk|lik}","rust{ig|ug|eg}","geld{ig|ug|eg}","macht{ig|ug|eg}","bez{ig|ug|eg}","heer{lijk|luk|lik}"]},
 {id:"uitgang", label:"Moeilijke uitgangen", sub:"-tie · -teit · -isch", vormen:["dictee","invul","keuze"],
  words:["poli{tie|sie|tsie}","vakan{tie|sie|tsie}","informa{tie|sie|tsie}","ac{tie|sie|tsie}","reac{tie|sie|tsie}","emo{tie|sie|tsie}","universi{teit|tijt}","kwali{teit|tijt}","elektrici{teit|tijt}","activi{teit|tijt}","log{isch|ies}","elektr{isch|ies}","fantast{isch|ies}","prakt{isch|ies}"]}
]
};

/* -------- gap-parser: "ri{ng}" of "pann{en|e}koek" -------- */
function parseWord(str, themeAlts){
  var m = str.match(/^(.*)\{([^}]+)\}(.*)$/);
  if(!m) return { word:str, pre:null, gap:null, post:null, alts:null };
  var parts = m[2].split("|");
  var gap = parts[0];
  var alts = parts.length>1 ? parts.slice(0) : (themeAlts? themeAlts.slice(0) : null);
  if(alts && alts.indexOf(gap)===-1) alts.unshift(gap);
  return { word:m[1]+gap+m[3], pre:m[1], gap:gap, post:m[3], alts:alts };
}

function themesFor(g){ return THEMES[g]||[]; }
function themeById(g,id){
  var list=themesFor(g);
  for(var i=0;i<list.length;i++) if(list[i].id===id) return list[i];
  return null;
}

/* ===================== INSTELLINGEN ===================== */
var VORM_LABEL = {dictee:"Luisterdictee", invul:"Invuloefening", keuze:"Welk woord is juist?", werkwoord:"Werkwoorden"};
var GRAAD_LABEL = {1:"1e graad (L1–L2)",2:"2e graad (L3–L4)",3:"3e graad (L5–L6)"};

function defaults(){
  return { graad:1, themes:["hak","twee"], vormen:["dictee","invul","keuze"],
           count:10, seconds:0, session:"self", sound:true };
}

/* ---- instellingen-UI, gedeeld door beide pagina's ---- */
function makeSettings(host, state, onChange){
  function h(tag, cls, txt){ var el=document.createElement(tag); if(cls)el.className=cls; if(txt!=null)el.textContent=txt; return el; }
  function fire(){ ensureValid(); render(); if(onChange) onChange(); }

  function ensureValid(){
    var list = themesFor(state.graad);
    state.themes = state.themes.filter(function(id){ return themeById(state.graad,id); });
    if(!state.themes.length && list.length) state.themes=[list[0].id];
    var possible={};
    state.themes.forEach(function(id){ (themeById(state.graad,id).vormen||[]).forEach(function(v){possible[v]=1;}); });
    var chosen = state.vormen.filter(function(v){ return possible[v]; });
    if(!chosen.length) chosen=Object.keys(possible);
    state.vormen=chosen;
  }

  function chipRow(parent, opts){
    var box=h("div","chips"); parent.appendChild(box);
    opts.items.forEach(function(it){
      var b=h("button","chip"+(it.wide?" chip--wide":""), it.label);
      b.type="button"; b.dataset.k=it.k;
      b.onclick=function(){ opts.pick(it.k); fire(); };
      box.appendChild(b);
    });
    return box;
  }

  host.innerHTML="";
  var blocks={};

  /* graad */
  var bG=h("div","block"); host.appendChild(bG);
  bG.appendChild(h("p","block__label","Graad"));
  blocks.graad=chipRow(bG,{items:[
    {k:"1",label:"1e graad",wide:true},{k:"2",label:"2e graad",wide:true},{k:"3",label:"3e graad",wide:true}],
    pick:function(k){
      var g=+k;
      if(g!==state.graad){ state.graad=g; state.themes=[]; state.vormen=["dictee","invul","keuze","werkwoord"]; }
    }});
  var hintG=h("p","block__hint",""); hintG.style.marginTop="8px"; bG.appendChild(hintG); blocks.graadHint=hintG;

  /* thema's */
  var bT=h("div","block"); host.appendChild(bT);
  var lT=h("p","block__label","Onderwerpen "); lT.appendChild(h("span","block__hint","kies er één of meer")); bT.appendChild(lT);
  var themeBox=h("div","forms"); bT.appendChild(themeBox); blocks.themeBox=themeBox;
  var tiny=h("div","tinybtns"); bT.appendChild(tiny);
  var allBtn=h("button","tinybtn","Alles aan"); allBtn.type="button";
  allBtn.onclick=function(){ state.themes=themesFor(state.graad).map(function(t){return t.id;}); fire(); };
  var noneBtn=h("button","tinybtn","Alles uit"); noneBtn.type="button";
  noneBtn.onclick=function(){ state.themes=state.themes.slice(0,1); fire(); };
  tiny.appendChild(allBtn); tiny.appendChild(noneBtn);

  /* oefenvormen */
  var bV=h("div","block"); host.appendChild(bV);
  bV.appendChild(h("p","block__label","Oefenvormen"));
  var vormBox=h("div","chips"); bV.appendChild(vormBox); blocks.vormBox=vormBox;

  /* aantal */
  var bN=h("div","block"); host.appendChild(bN);
  bN.appendChild(h("p","block__label","Aantal oefeningen"));
  blocks.count=chipRow(bN,{items:[{k:"5",label:"5"},{k:"10",label:"10"},{k:"15",label:"15"},{k:"20",label:"20"},{k:"0",label:"∞"}],
    pick:function(k){ state.count=+k; }});

  /* tempo */
  var bS=h("div","block"); host.appendChild(bS);
  var lS=h("p","block__label","Tijd per oefening "); lS.appendChild(h("span","block__hint","zonder tijdsdruk = Geen")); bS.appendChild(lS);
  blocks.seconds=chipRow(bS,{items:[{k:"0",label:"Geen"},{k:"15",label:"15 s"},{k:"30",label:"30 s"},{k:"60",label:"60 s"}],
    pick:function(k){ state.seconds=+k; }});

  function render(){
    ensureValid();
    blocks.graad.querySelectorAll(".chip").forEach(function(c){ c.setAttribute("aria-pressed", +c.dataset.k===state.graad); });
    blocks.graadHint.textContent = GRAAD_LABEL[state.graad];

    themeBox.innerHTML="";
    themesFor(state.graad).forEach(function(t){
      var on = state.themes.indexOf(t.id)>-1;
      var b=h("button","form-opt"); b.type="button"; b.setAttribute("aria-pressed",on);
      var demo=h("span","form-opt__demo",t.sub);
      var tx=h("span","form-opt__txt"); tx.appendChild(h("b",null,t.label));
      var tick=h("span","form-opt__tick","✓");
      b.appendChild(demo); b.appendChild(tx); b.appendChild(tick);
      b.onclick=function(){
        var i=state.themes.indexOf(t.id);
        if(i>-1){ if(state.themes.length>1) state.themes.splice(i,1); }
        else state.themes.push(t.id);
        fire();
      };
      themeBox.appendChild(b);
    });

    var possible={};
    state.themes.forEach(function(id){ (themeById(state.graad,id).vormen||[]).forEach(function(v){possible[v]=1;}); });
    vormBox.innerHTML="";
    ["dictee","invul","keuze","werkwoord"].forEach(function(v){
      if(!possible[v]) return;
      var b=h("button","chip chip--wide",(v==="dictee"?"🔊 ":"")+VORM_LABEL[v]); b.type="button";
      b.setAttribute("aria-pressed", state.vormen.indexOf(v)>-1);
      b.onclick=function(){
        var i=state.vormen.indexOf(v);
        if(i>-1){ if(state.vormen.length>1) state.vormen.splice(i,1); }
        else state.vormen.push(v);
        fire();
      };
      vormBox.appendChild(b);
    });

    blocks.count.querySelectorAll(".chip").forEach(function(c){ c.setAttribute("aria-pressed", +c.dataset.k===state.count); });
    blocks.seconds.querySelectorAll(".chip").forEach(function(c){ c.setAttribute("aria-pressed", +c.dataset.k===state.seconds); });
  }
  render(); if(onChange) onChange();
  return { sync:render };
}

/* ===================== LINK & QR-PARAMETERS ===================== */
function buildHash(s){
  var p=["g="+s.graad,"th="+s.themes.join("."),"v="+s.vormen.join("."),"n="+s.count,"t="+s.seconds,"m="+(s.session==="class"?"c":"s")];
  return "#"+p.join("&");
}
function parseParams(str){
  if(!str) return null;
  var i=str.indexOf("#"); if(i>-1) str=str.slice(i+1);
  if(!str || str.indexOf("g=")===-1) return null;
  var out=defaults(), kv={};
  str.split("&").forEach(function(part){ var m=part.split("="); if(m.length===2) kv[m[0]]=decodeURIComponent(m[1]); });
  var g=+kv.g; if(!(g===1||g===2||g===3)) return null;
  out.graad=g;
  out.themes=(kv.th||"").split(".").filter(function(id){ return themeById(g,id); });
  if(!out.themes.length) return null;
  var vs=(kv.v||"").split(".").filter(function(v){ return VORM_LABEL[v]; });
  out.vormen=vs.length? vs : ["dictee","invul","keuze","werkwoord"];
  out.count = kv.n!=null? Math.max(0,Math.min(50,+kv.n||0)) : 10;
  out.seconds = kv.t!=null? Math.max(0,Math.min(120,+kv.t||0)) : 0;
  out.session = kv.m==="c"? "class":"self";
  return out;
}

/* ===================== OEFENING-GENERATOR ===================== */
function shuffle(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

/* misspelling voor keuze-oefening zonder gat: pas één mutatie toe */
function mutate(word, muts){
  var opts=[];
  (muts||[]).forEach(function(m){
    var idx=word.indexOf(m[0]);
    while(idx>-1){
      var bad=word.slice(0,idx)+m[1]+word.slice(idx+m[0].length);
      if(bad!==word) opts.push(bad);
      idx=word.indexOf(m[0], idx+1);
    }
  });
  return opts.length? pick(opts) : null;
}

/* Maak één oefening */
function makeExercise(cfg, history){
  var tries=0;
  while(tries++<80){
    var themeId=pick(cfg.themes);
    var theme=themeById(cfg.graad, themeId);
    if(!theme) continue;
    var vormen=theme.vormen.filter(function(v){ return cfg.vormen.indexOf(v)>-1; });
    if(!vormen.length) vormen=theme.vormen;
    var vorm=pick(vormen);

    var ex=null;
    if(theme.items && theme.id.slice(0,2)==="ww"){          /* werkwoordzinnen */
      var it=pick(theme.items);
      var typed = !(cfg.vormen.length===1 && cfg.vormen[0]==="keuze");
      ex={ vorm: typed? "wtyp":"wkeu", theme:theme, zin:it.z, inf:it.inf, answer:it.a,
           choices: typed? null : shuffle([it.a].concat(it.w)),
           tts: it.z.replace("___", it.a).replace(/ \./g,".") };
    }
    else if(theme.items){                                    /* zinnen (hoofdletters) */
      var it2=pick(theme.items);
      ex={ vorm:"zin", theme:theme, answer:it2.a, choices:shuffle([it2.a].concat(it2.w)), tts:it2.a };
    }
    else{
      var pw=parseWord(pick(theme.words), theme.alts);
      if(vorm==="invul" && pw.gap){
        ex={ vorm:"invul", theme:theme, pre:pw.pre, gap:pw.gap, post:pw.post,
             answer:pw.gap, word:pw.word, choices:shuffle(pw.alts.slice(0)), tts:pw.word };
      } else if(vorm==="keuze"){
        var wrong=null;
        if(pw.alts && pw.gap){
          var others=pw.alts.filter(function(a){return a!==pw.gap;});
          if(others.length) wrong=pw.pre+pick(others)+pw.post;
        }
        if(!wrong) wrong=mutate(pw.word, theme.mut);
        if(!wrong) continue;
        var wrongs=[wrong];
        if(pw.alts && pw.alts.length>2){
          var others2=pw.alts.filter(function(a){ return a!==pw.gap && pw.pre+a+pw.post!==wrong; });
          if(others2.length) wrongs.push(pw.pre+pick(others2)+pw.post);
        }
        ex={ vorm:"keuze", theme:theme, answer:pw.word, choices:shuffle([pw.word].concat(wrongs)), tts:pw.word };
      } else { /* dictee */
        ex={ vorm:"dictee", theme:theme, answer:pw.word, word:pw.word, tts:pw.word };
      }
    }
    if(ex){
      var key=ex.vorm+"|"+(ex.zin||ex.answer);
      if(history.indexOf(key)>-1 && tries<60) continue;
      history.push(key); if(history.length>14) history.shift();
      return ex;
    }
  }
  return null;
}

/* ===================== GELUID ===================== */
var actx=null, soundOn=true;
function resumeAudio(){ try{ if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==="suspended") actx.resume(); }catch(e){} }
function beep(freq,dur,type,vol,when){
  if(!soundOn||!actx) return;
  try{
    var o=actx.createOscillator(), g=actx.createGain();
    o.type=type||"sine"; o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,actx.currentTime+(when||0));
    g.gain.exponentialRampToValueAtTime(vol||.25,actx.currentTime+(when||0)+.02);
    g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+(when||0)+(dur||.15));
    o.connect(g); g.connect(actx.destination);
    o.start(actx.currentTime+(when||0)); o.stop(actx.currentTime+(when||0)+(dur||.15)+.05);
  }catch(e){}
}
function sGood(){ beep(660,.12,"sine",.22); beep(880,.16,"sine",.22,.09); }
function sBad(){ beep(220,.22,"square",.12); }
function sDone(){ [523,659,784,1047].forEach(function(f,i){ beep(f,.18,"sine",.2,i*.12); }); }
function toggleSound(){
  soundOn=!soundOn;
  var b=document.getElementById("soundBtn"); if(b) b.textContent=soundOn?"🔊":"🔇";
  if(!soundOn && window.speechSynthesis) speechSynthesis.cancel();
  return soundOn;
}

/* ===================== VOORLEESSTEM (dictee) ===================== */
var nlVoice=null;
function findVoice(){
  if(typeof window==="undefined" || !window.speechSynthesis) return null;
  var vs=speechSynthesis.getVoices()||[];
  var be=null, nl=null;
  vs.forEach(function(v){
    var l=(v.lang||"").toLowerCase().replace("_","-");
    if(l==="nl-be" && !be) be=v;
    if(l.slice(0,2)==="nl" && !nl) nl=v;
  });
  nlVoice = be||nl;
  return nlVoice;
}
if(typeof window!=="undefined" && window.speechSynthesis){
  findVoice();
  speechSynthesis.onvoiceschanged=findVoice;
}
function speak(text, slow){
  if(typeof window==="undefined" || !window.speechSynthesis || !soundOn) return false;
  try{
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(text);
    if(!nlVoice) findVoice();
    if(nlVoice) u.voice=nlVoice;
    u.lang=(nlVoice&&nlVoice.lang)||"nl-BE";
    u.rate=slow? .72 : .88;
    u.pitch=1;
    speechSynthesis.speak(u);
    return true;
  }catch(e){ return false; }
}
function ttsAvailable(){ return typeof window!=="undefined" && !!window.speechSynthesis; }

/* ===================== SPELVERLOOP ===================== */
var onExit=function(){};
function setOnExit(fn){ onExit=fn||function(){}; }

var game=null;
function $(s){ return document.querySelector(s); }

function startGame(cfg){
  resumeAudio();
  game={ cfg:cfg, i:0, stars:0, good:0, total:0, history:[], timer:null, cur:null, locked:false, reveal:false };
  ["screenHome","screenSetup","screenScan","screenGen","screenDone"].forEach(function(id){
    var el=document.getElementById(id); if(el) el.classList.add("hidden");
  });
  $("#screenPlay").classList.remove("hidden");
  $("#starCount").textContent="0";
  window.scrollTo(0,0);
  nextExercise();
}

function endGame(){
  clearTimer();
  if(window.speechSynthesis) speechSynthesis.cancel();
  $("#screenPlay").classList.add("hidden");
  var box=$("#resultsBox"); box.innerHTML="";
  var pct = game.total? Math.round(100*game.good/game.total) : 0;
  var medal = pct>=90? "🏆" : pct>=70? "🥇" : pct>=50? "🥈" : "🥉";
  var titel = pct>=90? "Superkrak!" : pct>=70? "Knap gedaan!" : pct>=50? "Goed geoefend!" : "Blijven oefenen!";
  function h(tag,cls,txt){ var el=document.createElement(tag); if(cls)el.className=cls; if(txt!=null)el.textContent=txt; return el; }
  box.appendChild(h("div","medal",medal));
  box.appendChild(h("h2",null,titel));
  box.appendChild(h("div","score", game.good+" van de "+game.total+" juist"));
  var bd=h("div","breakdown");
  var b1=h("div","bd"); b1.appendChild(h("b",null,"★ "+game.stars)); b1.appendChild(h("span",null,"sterren")); bd.appendChild(b1);
  var b2=h("div","bd"); b2.appendChild(h("b",null,pct+"%")); b2.appendChild(h("span",null,"juist")); bd.appendChild(b2);
  box.appendChild(bd);
  var btns=h("div","results__btns");
  var again=h("button","btn btn--grass","🔁 Nog eens!"); again.type="button";
  again.onclick=function(){ $("#screenDone").classList.add("hidden"); startGame(game.cfg); };
  var stop=h("button","btn btn--ghost","Klaar"); stop.type="button";
  stop.onclick=function(){ $("#screenDone").classList.add("hidden"); onExit(); };
  btns.appendChild(again); btns.appendChild(stop);
  box.appendChild(btns);
  $("#screenDone").classList.remove("hidden");
  sDone(); confettiBurst();
}

function clearTimer(){ if(game&&game.timer){ clearInterval(game.timer); game.timer=null; }
  var g=document.getElementById("glow"); if(g) g.style.opacity=0; }

function nextExercise(){
  clearTimer();
  var s=$("#splash"); if(s) s.classList.remove("show");
  if(game.cfg.count>0 && game.i>=game.cfg.count){ return endGame(); }
  var ex=makeExercise(game.cfg, game.history);
  if(!ex){ return endGame(); }
  game.cur=ex; game.locked=false; game.reveal=false; game.i++;
  renderExercise(ex);
  var fill=$("#progFill");
  if(fill) fill.style.width = game.cfg.count>0? Math.round(100*(game.i-1)/game.cfg.count)+"%" : "0%";
  if(game.cfg.session!=="class" && game.cfg.seconds>0) startTimer(game.cfg.seconds);
  if(ex.vorm==="dictee" && game.cfg.session!=="class") setTimeout(function(){ speak(ex.tts); },350);
}

function startTimer(secs){
  var bar=document.getElementById("timeFill");
  var total=secs*10, left=total;
  var glow=document.getElementById("glow");
  game.timer=setInterval(function(){
    left--;
    if(bar){ var f=left/total;
      bar.style.width=Math.max(0,Math.round(100*f))+"%";
      bar.style.background = f>.35? "var(--grass)" : f>.15? "var(--sun-deep)" : "var(--berry)";
    }
    if(glow){ var sLeft=left/10;
      if(sLeft<=5){ glow.style.opacity=String(.55*(1-sLeft/5)); glow.style.setProperty("--glowc", sLeft>2.5? "#FFD27A":"#E5566B"); }
      else glow.style.opacity=0;
    }
    if(left<=0){ clearTimer(); miss("De tijd is om!"); }
  },100);
}

/* ---------- rendering ---------- */
function el(tag,cls,txt){ var e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e; }

function tileWord(pre,gapEl,post,cls){
  var eq=el("div","eq eq--word"+(cls?" "+cls:""));
  if(pre) eq.appendChild(el("span","wtile",pre));
  if(gapEl) eq.appendChild(gapEl);
  if(post) eq.appendChild(el("span","wtile",post));
  return eq;
}

function speakerBtn(text,big){
  var b=el("button","speakbtn"+(big?" speakbtn--big":""),"🔊");
  b.type="button"; b.setAttribute("aria-label","Luister");
  b.onclick=function(){ resumeAudio(); speak(text); };
  return b;
}

function checkRow(onCheck){
  var row=el("div","checkrow");
  var btn=el("button","btn btn--grass btn--check","✓ Controleer"); btn.type="button";
  btn.onclick=onCheck; row.appendChild(btn); return row;
}

function makeInput(placeholder){
  var inp=document.createElement("input");
  inp.className="spellinput"; inp.type="text";
  inp.autocapitalize="off"; inp.autocomplete="off"; inp.spellcheck=false;
  inp.setAttribute("autocorrect","off"); inp.setAttribute("enterkeyhint","done");
  if(placeholder) inp.placeholder=placeholder;
  return inp;
}

function norm(s){ return (s||"").trim().toLowerCase().replace(/[’´`]/g,"'").replace(/\s+/g," "); }

function renderExercise(ex){
  var stage=$("#stage"); stage.innerHTML="";
  var cls = game.cfg.session==="class";
  var wrap=el("div", cls? "exwrap classbar":"exwrap");
  stage.appendChild(wrap);
  wrap.appendChild(el("div","themetag",ex.theme.label));
  if(!cls && game.cfg.seconds>0){
    var tb=el("div","timebar");
    var tf=el("div","timebar__fill"); tf.id="timeFill"; tf.style.width="100%";
    tb.appendChild(tf); wrap.appendChild(tb);
  }
  renderBody(ex, wrap, cls);
  if(cls) renderClassControls(ex, wrap);
}

function renderBody(ex, box, cls){
  if(ex.vorm==="dictee"){
    box.appendChild(el("p","exlead", cls? "Luister goed. Wie kan dit woord schrijven?" : "Luister en typ het woord"));
    box.appendChild(speakerBtn(ex.tts,true));
    if(cls){
      var hidden=el("div","eq eq--word"); hidden.id="classAnswer";
      ex.answer.split("").forEach(function(){ hidden.appendChild(el("span","wtile wtile--secret","·")); });
      box.appendChild(hidden);
    } else {
      var inp=makeInput("typ het woord…");
      var row=el("div","inputrow"); row.appendChild(inp);
      box.appendChild(row);
      box.appendChild(checkRow(function(){ submit(norm(inp.value)===norm(ex.answer), ex, inp); }));
      inp.onkeydown=function(e){ if(e.key==="Enter"){ e.preventDefault(); submit(norm(inp.value)===norm(ex.answer), ex, inp); } };
      setTimeout(function(){ try{inp.focus();}catch(e){} },450);
    }
  }
  else if(ex.vorm==="invul"){
    box.appendChild(el("p","exlead","Wat hoort in het woord?"));
    var gap=el("span","wtile wtile--blank","…"); gap.id="gapTile";
    box.appendChild(tileWord(ex.pre,gap,ex.post));
    if(ttsAvailable()) box.appendChild(speakerBtn(ex.tts));
    if(!cls){
      var ch=el("div","choices choices--letters");
      ex.choices.forEach(function(c){
        var b=el("button","choice choice--letter", c===""? "niets":c); b.type="button";
        b.onclick=function(){
          if(game.locked) return;
          gap.textContent=c===""?"‹leeg›":c; gap.classList.add("filled");
          setTimeout(function(){ submit(c===ex.answer, ex, null, b); },200);
        };
        ch.appendChild(b);
      });
      box.appendChild(ch);
    }
  }
  else if(ex.vorm==="keuze" || ex.vorm==="zin" || ex.vorm==="wkeu"){
    var lead2 = ex.vorm==="zin"? "Welke zin is juist geschreven?" : "Welk woord is juist geschreven?";
    if(ex.vorm==="wkeu") lead2="Welke vorm is juist?";
    box.appendChild(el("p","exlead",lead2));
    if(ex.vorm==="wkeu"){
      box.appendChild(renderZin(ex));
    } else if(ttsAvailable() && ex.vorm!=="zin"){
      box.appendChild(speakerBtn(ex.tts,true));
      if(!cls) setTimeout(function(){ speak(ex.tts); },350);
    }
    var ch2=el("div","choices "+(ex.vorm==="zin"? "choices--sent":"choices--words"));
    ex.choices.forEach(function(c){
      var b=el("button","choice "+(ex.vorm==="zin"?"choice--sent":"choice--word"), c); b.type="button";
      b.onclick=function(){ if(game.locked) return; if(cls) return; submit(c===ex.answer, ex, null, b); };
      ch2.appendChild(b);
    });
    box.appendChild(ch2);
  }
  else if(ex.vorm==="wtyp"){
    box.appendChild(el("p","exlead","Vul het werkwoord juist in"));
    box.appendChild(renderZin(ex));
    if(!cls){
      var inp2=makeInput("typ de juiste vorm…");
      var row2=el("div","inputrow"); row2.appendChild(inp2);
      box.appendChild(row2);
      box.appendChild(checkRow(function(){ submit(norm(inp2.value)===norm(ex.answer), ex, inp2); }));
      inp2.onkeydown=function(e){ if(e.key==="Enter"){ e.preventDefault(); submit(norm(inp2.value)===norm(ex.answer), ex, inp2); } };
      setTimeout(function(){ try{inp2.focus();}catch(e){} },450);
    }
  }
}

function renderZin(ex){
  var p=el("p","zin");
  var parts=ex.zin.split("___");
  p.appendChild(document.createTextNode(parts[0]));
  var blank=el("span","zin__blank","______"); blank.id="zinBlank";
  p.appendChild(blank);
  if(parts[1]) p.appendChild(document.createTextNode(parts[1]));
  p.appendChild(el("span","zin__inf","("+ex.inf+")"));
  return p;
}

/* ---------- klasmodus ---------- */
function renderClassControls(ex, wrap){
  var hand=el("div","handprompt");
  hand.innerHTML='<span class="wave">🙋</span> Steek je hand op als je het weet!';
  wrap.appendChild(hand);
  var ctr=el("div","classctrls");
  var rev=el("button","bigbtn bigbtn--rev","👀 Toon antwoord"); rev.type="button";
  rev.onclick=function(){ classReveal(ex); };
  var nxt=el("button","bigbtn bigbtn--next","Volgende →"); nxt.type="button";
  nxt.onclick=function(){ nextExercise(); };
  ctr.appendChild(rev); ctr.appendChild(nxt);
  wrap.appendChild(ctr);
  wrap.appendChild(el("div","somcount", game.cfg.count>0? "Oefening "+game.i+" van "+game.cfg.count : "Oefening "+game.i));
}

function classReveal(ex){
  if(game.reveal) return; game.reveal=true;
  sGood();
  if(ex.vorm==="dictee"){
    var holder=document.getElementById("classAnswer");
    if(holder){ holder.innerHTML="";
      ex.answer.split("").forEach(function(l){ holder.appendChild(el("span","wtile reveal", l===" "? "␣":l)); }); }
    speak(ex.answer);
  } else if(ex.vorm==="invul"){
    var gap=document.getElementById("gapTile");
    if(gap){ gap.textContent=ex.answer===""?"‹leeg›":ex.answer; gap.classList.add("filled","reveal"); }
    speak(ex.tts);
  } else if(ex.vorm==="wtyp"){
    var bl=document.getElementById("zinBlank");
    if(bl){ bl.textContent=ex.answer; bl.classList.add("zin__blank--filled","reveal"); }
    speak(ex.tts);
  } else {
    document.querySelectorAll(".choice").forEach(function(b){
      if(b.textContent===ex.answer) b.classList.add("good");
    });
    speak(ex.tts);
  }
}

/* ---------- antwoord & feedback ---------- */
var GOOD=[["🎉","Goed zo!"],["⭐","Super!"],["👏","Knap!"],["💪","Sterk!"],["🌟","Prima!"],["🚀","Geweldig!"]];
function submit(ok, ex, inputEl, choiceBtn){
  if(game.locked) return; game.locked=true;
  clearTimer(); game.total++;
  if(ok){
    game.good++; game.stars++;
    $("#starCount").textContent=String(game.stars);
    if(choiceBtn) choiceBtn.classList.add("good");
    sGood(); splash(pick(GOOD), null); confettiSmall();
    setTimeout(nextExercise, 950);
  } else {
    if(choiceBtn){ choiceBtn.classList.add("bad");
      document.querySelectorAll(".choice").forEach(function(b){ if(b.textContent===ex.answer) b.classList.add("good"); }); }
    if(inputEl){ inputEl.classList.add("shake","wrong"); }
    var gap=document.getElementById("gapTile");
    if(gap && ex.vorm==="invul"){ gap.textContent=ex.answer===""?"‹leeg›":ex.answer; gap.classList.add("filled"); }
    var full = ex.vorm==="invul"||ex.vorm==="dictee"||ex.vorm==="keuze"? (ex.word||ex.answer) : ex.answer;
    sBad(); splash(["🤔","Bijna!"], "Juist is: "+full);
    speak(full);
    setTimeout(nextExercise, 2500);
  }
}
function miss(msg){
  if(!game || game.locked) return; game.locked=true;
  game.total++;
  var full = game.cur? (game.cur.word||game.cur.answer):"";
  sBad(); splash(["⏰",msg||"De tijd is om!"], "Juist is: "+full);
  setTimeout(nextExercise, 2500);
}

var splashTimer=null;
function splash(pair, hint){
  var s=$("#splash"); if(!s) return;
  $("#splashEmo").textContent=pair[0];
  $("#splashTxt").textContent=pair[1];
  $("#splashHint").textContent=hint||"";
  s.classList.add("show");
  if(splashTimer) clearTimeout(splashTimer);
  splashTimer=setTimeout(function(){ s.classList.remove("show"); }, hint? 2200:800);
}

/* ---------- confetti ---------- */
var confParts=[], confRAF=null;
function confettiSmall(){ confetti(26); }
function confettiBurst(){ confetti(120); }
function confetti(n){
  var c=document.getElementById("confetti"); if(!c) return;
  c.width=innerWidth; c.height=innerHeight;
  var colors=["#FFC233","#36A85B","#E5566B","#46B8E8","#7B5EA7"];
  for(var i=0;i<n;i++){
    confParts.push({x:Math.random()*c.width, y:-20-Math.random()*80,
      vx:(Math.random()-.5)*2.4, vy:2+Math.random()*3.2,
      s:5+Math.random()*6, r:Math.random()*Math.PI, vr:(Math.random()-.5)*.25,
      col:colors[i%colors.length], life:130+Math.random()*60});
  }
  if(!confRAF) confLoop();
}
function confLoop(){
  var c=document.getElementById("confetti"); if(!c){ confRAF=null; return; }
  var ctx=c.getContext("2d");
  confRAF=requestAnimationFrame(confLoop);
  ctx.clearRect(0,0,c.width,c.height);
  confParts=confParts.filter(function(p){ return p.life>0 && p.y<c.height+30; });
  if(!confParts.length){ cancelAnimationFrame(confRAF); confRAF=null; ctx.clearRect(0,0,c.width,c.height); return; }
  confParts.forEach(function(p){
    p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; p.life--;
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r);
    ctx.fillStyle=p.col; ctx.globalAlpha=Math.max(0,Math.min(1,p.life/60));
    ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s); ctx.restore();
  });
}

/* ===================== EXPORT ===================== */
return {
  THEMES:THEMES, themesFor:themesFor, themeById:themeById, parseWord:parseWord,
  VORM_LABEL:VORM_LABEL, GRAAD_LABEL:GRAAD_LABEL,
  defaults:defaults, makeSettings:makeSettings,
  buildHash:buildHash, parseParams:parseParams,
  makeExercise:makeExercise, mutate:mutate,
  startGame:startGame, setOnExit:setOnExit,
  toggleSound:toggleSound, resumeAudio:resumeAudio,
  speak:speak, ttsAvailable:ttsAvailable
};
})();
if(typeof module!=="undefined" && module.exports) module.exports=TK;
