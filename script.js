/* ═══════════════════════════════════════════════════════
   AB WORKFORCE INTELLIGENCE — SCRIPT.JS v2
   Enhanced with Control Room, Monte Carlo, Timeline,
   Optimizer, Burst Mode, Spike Simulator & more.
═══════════════════════════════════════════════════════ */
'use strict';

/* ─── TOOLTIP ─── */
const tooltip = document.getElementById('tooltipOverlay');
document.querySelectorAll('.info-icon[data-tip]').forEach(el => {
  el.addEventListener('mouseenter', e => { tooltip.textContent = el.dataset.tip; tooltip.style.display = 'block'; positionTooltip(e); });
  el.addEventListener('mousemove', positionTooltip);
  el.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
});
function positionTooltip(e) {
  const gap = 12, tw = tooltip.offsetWidth || 240, th = tooltip.offsetHeight || 60;
  let x = e.clientX + gap, y = e.clientY + gap;
  if (x + tw > window.innerWidth - 8) x = e.clientX - tw - gap;
  if (y + th > window.innerHeight - 8) y = e.clientY - th - gap;
  tooltip.style.left = x + 'px'; tooltip.style.top = y + 'px';
}

/* ─── DOM HELPER ─── */
const $ = id => document.getElementById(id);

/* ─── QUEUE NAMES (editable) ─── */
let queueNames = { phones: 'Phones', verify: 'Verify', cops: 'COPS' };

document.querySelectorAll('.editable-name').forEach(el => {
  el.addEventListener('blur', () => {
    const q = el.dataset.queue;
    const val = el.textContent.trim() || (q === 'phones' ? 'Phones' : q === 'verify' ? 'Verify' : 'COPS');
    queueNames[q] = val;
    el.textContent = val;
    updateQueueNameLabels();
    calculate();
  });
  el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
});

function updateQueueNameLabels() {
  const n = queueNames;
  // Pressure labels
  if ($('prNamePhones')) $('prNamePhones').textContent = n.phones;
  if ($('prNameVerify')) $('prNameVerify').textContent = n.verify;
  if ($('prNameCOPS'))   $('prNameCOPS').textContent   = n.cops;
  // Slider labels
  if ($('slLabelPhones')) $('slLabelPhones').textContent = n.phones;
  if ($('slLabelVerify')) $('slLabelVerify').textContent = n.verify;
  if ($('slLabelCOPS'))   $('slLabelCOPS').textContent   = n.cops;
  // Metric card labels
  if ($('mcNamePhones')) $('mcNamePhones').textContent = n.phones;
  if ($('mcNameVerify')) $('mcNameVerify').textContent = n.verify;
  if ($('mcNameCOPS'))   $('mcNameCOPS').textContent   = n.cops;
  // Stability meters
  if ($('smNamePhones')) $('smNamePhones').textContent = n.phones;
  if ($('smNameVerify')) $('smNameVerify').textContent = n.verify;
  if ($('smNameCOPS'))   $('smNameCOPS').textContent   = n.cops;
  // Backlog names
  if ($('blNameVerify')) $('blNameVerify').textContent = n.verify;
  if ($('blNameCOPS'))   $('blNameCOPS').textContent   = n.cops;
  // CRM names
  if ($('crmNamePhones')) $('crmNamePhones').textContent = n.phones;
  if ($('crmNameVerify')) $('crmNameVerify').textContent = n.verify;
  if ($('crmNameCOPS'))   $('crmNameCOPS').textContent   = n.cops;
  // Backlog clocks
  if ($('blcLabelVerify')) $('blcLabelVerify').textContent = n.verify;
  if ($('blcLabelCOPS'))   $('blcLabelCOPS').textContent   = n.cops;
  // Waterfall labels
  if ($('wfLabelP1')) $('wfLabelP1').textContent = n.phones + ' Used';
}

/* ─── DATE/TIME ─── */
function updateClock() {
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  $('dtDay').textContent = days[now.getDay()];
  $('dtDate').textContent = now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  $('dtTime').textContent = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
updateClock();
setInterval(updateClock, 1000);

/* ─── INPUTS ─── */
const inp = {
  paidHours:     () => +$('paidHours').value   || 0,
  shrinkage:     () => +$('shrinkage').value   || 0,
  occupancy:     () => +$('occupancy').value   || 0,
  opHours:       () => +$('opHours').value     || 1,
  phonesVol:     () => +$('phonesVol').value   || 0,
  phonesAHT:     () => +$('phonesAHT').value   || 1,
  verifyVol:     () => +$('verifyVol').value   || 0,
  verifyAHT:     () => +$('verifyAHT').value   || 1,
  verifyBacklog: () => +$('verifyBacklog').value|| 0,
  copsBacklog:   () => +$('copsBacklog').value || 0,
  copsAHT:       () => +$('copsAHT').value     || 1,
  copsVol:       () => +$('copsVol').value     || 0,
  totalAgents:   () => +$('totalAgents').value || 0,
  phonesAgents:  () => +$('phonesAgents').value|| 0,
  verifyAgents:  () => +$('verifyAgents').value|| 0,
  copsAgents:    () => +$('copsAgents').value  || 0,
  blendedAgents: () => +$('blendedAgents').value|| 0,
  spikeMultiplier:() => (+$('spikeMultiplier').value || 10) / 10,
  burstMode:     () => $('burstModeToggle').checked,
};

/* ─── CONTROL ROOM MODE ─── */
let controlRoomActive = false;
function toggleControlRoom() {
  controlRoomActive = !controlRoomActive;
  const btn = $('crmToggleBtn');
  const panel = $('controlRoomPanel');
  const banner = $('crmBanner');
  if (controlRoomActive) {
    btn.classList.add('active');
    panel.style.display = 'block';
    banner.style.display = 'flex';
  } else {
    btn.classList.remove('active');
    panel.style.display = 'none';
    banner.style.display = 'none';
  }
  calculate();
}

/* ─── SLIDER SYNC ─── */
const sliderPhones = $('sliderPhones');
const sliderVerify = $('sliderVerify');
const sliderCOPS   = $('sliderCOPS');
const spikeSlider  = $('spikeMultiplier');

function syncSliderTrack(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  let c;
  if (slider.id === 'sliderPhones') c = '#3b82f6';
  else if (slider.id === 'sliderVerify') c = '#8b5cf6';
  else if (slider.id === 'sliderCOPS') c = '#f97316';
  else c = '#3b82f6';
  slider.style.background = `linear-gradient(to right, ${c} ${pct}%, #e2e8f0 ${pct}%)`;
}

sliderPhones.addEventListener('input', () => { $('phonesAgents').value = sliderPhones.value; $('sliderPhonesVal').textContent = sliderPhones.value; syncSliderTrack(sliderPhones); calculate(); });
sliderVerify.addEventListener('input', () => { $('verifyAgents').value = sliderVerify.value; $('sliderVerifyVal').textContent = sliderVerify.value; syncSliderTrack(sliderVerify); calculate(); });
sliderCOPS.addEventListener('input',   () => { $('copsAgents').value   = sliderCOPS.value;   $('sliderCOPSVal').textContent   = sliderCOPS.value;   syncSliderTrack(sliderCOPS);   calculate(); });
spikeSlider.addEventListener('input',  () => { $('spikeMultiplierVal').textContent = (spikeSlider.value/10).toFixed(1) + '×'; syncSliderTrack(spikeSlider); calculate(); });

['phonesAgents','verifyAgents','copsAgents'].forEach(id => {
  $(id).addEventListener('input', () => {
    if (id === 'phonesAgents') { sliderPhones.value = $(id).value; $('sliderPhonesVal').textContent = $(id).value; syncSliderTrack(sliderPhones); }
    if (id === 'verifyAgents') { sliderVerify.value = $(id).value; $('sliderVerifyVal').textContent = $(id).value; syncSliderTrack(sliderVerify); }
    if (id === 'copsAgents')   { sliderCOPS.value   = $(id).value; $('sliderCOPSVal').textContent   = $(id).value; syncSliderTrack(sliderCOPS); }
    calculate();
  });
});

/* ─── CANVAS CHARTS ─── */
function drawPressureChart(pressures, labels) {
  const canvas = $('pressureChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 340, H = 180;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);
  const colors = ['#3b82f6','#8b5cf6','#f97316'];
  const barW = 52, gap = (W - labels.length * barW) / (labels.length + 1);
  const maxH = H - 44;
  [0.5,1.0,1.5].forEach(v => {
    const y = H - 28 - (v/1.6)*maxH;
    ctx.beginPath(); ctx.strokeStyle = v===1.0?'rgba(239,68,68,0.5)':'rgba(0,0,0,0.07)'; ctx.lineWidth = v===1.0?1.5:1; ctx.setLineDash(v===1.0?[4,3]:[]);
    ctx.moveTo(28,y); ctx.lineTo(W-8,y); ctx.stroke(); ctx.setLineDash([]);
    if (v===1.0) { ctx.fillStyle='rgba(239,68,68,0.7)'; ctx.font='9px JetBrains Mono,monospace'; ctx.textAlign='left'; ctx.fillText('1.0',4,y+3); }
  });
  labels.forEach((lbl,i) => {
    const x = gap + i*(barW+gap), val = pressures[i]||0;
    const barH = Math.min((val/1.6)*maxH, maxH), y = H-28-barH;
    const gr = ctx.createLinearGradient(0,y,0,H-28);
    gr.addColorStop(0, colors[i]); gr.addColorStop(1, colors[i]+'33');
    ctx.fillStyle = gr;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x,y,barW,barH,[4,4,0,0]); else ctx.rect(x,y,barW,barH);
    ctx.fill();
    ctx.fillStyle = val>1.0?'#ef4444':val>0.8?'#f59e0b':'#10b981';
    ctx.font = 'bold 11px JetBrains Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText(val.toFixed(2), x+barW/2, y-5);
    ctx.fillStyle = 'rgba(71,85,105,0.7)'; ctx.font = '11px Plus Jakarta Sans,sans-serif';
    ctx.fillText(lbl, x+barW/2, H-7);
  });
}

function drawAllocationChart(agents) {
  const canvas = $('allocationChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 340, H = 180;
  canvas.width = W*dpr; canvas.height = H*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);
  const labs = [queueNames.phones, queueNames.verify, queueNames.cops, 'Blended', 'Unalloc'];
  const vals = [agents.phones, agents.verify, agents.cops, agents.blended, agents.unallocated];
  const colors = ['#3b82f6','#8b5cf6','#f97316','#6366f1','#cbd5e1'];
  const total = vals.reduce((a,b)=>a+b,0);
  if (total === 0) return;
  const cx=W/2, cy=H/2-10, r=62, ir=40;
  let start = -Math.PI/2;
  vals.forEach((v,i) => {
    if (v<=0) return;
    const end = start + (v/total)*2*Math.PI;
    ctx.beginPath(); ctx.moveTo(cx+ir*Math.cos(start),cy+ir*Math.sin(start));
    ctx.arc(cx,cy,r,start,end); ctx.arc(cx,cy,ir,end,start,true); ctx.closePath();
    ctx.fillStyle=colors[i]; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,r+1,start,end); ctx.arc(cx,cy,ir-1,end,start,true);
    ctx.fillStyle='rgba(240,244,250,0.9)'; ctx.fill();
    start=end;
  });
  ctx.fillStyle='#0f172a'; ctx.font='bold 15px JetBrains Mono,monospace'; ctx.textAlign='center';
  ctx.fillText(total, cx, cy+5);
  ctx.fillStyle='rgba(71,85,105,0.9)'; ctx.font='10px Plus Jakarta Sans,sans-serif';
  ctx.fillText('agents', cx, cy+18);
  const usedI = vals.map((v,i)=>({v,i})).filter(x=>x.v>0);
  const iW = Math.min(W/usedI.length, 78);
  const sx = (W - iW*usedI.length)/2;
  usedI.forEach(({v,i},j) => {
    const lx = sx + j*iW + iW/2;
    ctx.fillStyle=colors[i]; ctx.beginPath(); ctx.arc(lx-20,H-14,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(71,85,105,0.8)'; ctx.font='10px Plus Jakarta Sans,sans-serif'; ctx.textAlign='left';
    ctx.fillText(labs[i], lx-13, H-10);
  });
}

/* ─── CORE CALC ─── */
let lastCalcState = {};

function calculate() {
  const paidHours  = inp.paidHours();
  const shrinkage  = inp.shrinkage() / 100;
  const occupancy  = inp.occupancy() / 100;
  const opHours    = inp.opHours();
  const spike      = inp.spikeMultiplier();
  const burstMode  = inp.burstMode();
  const prodCap    = paidHours * (1-shrinkage) * occupancy;

  $('prodCapacity').textContent = fmt(prodCap,1) + ' hrs';
  $('hero-capacity').querySelector('.hs-val').textContent = fmt(prodCap,0) + ' hrs';

  // Service rates
  const phonesAHT = inp.phonesAHT(), verifyAHT = inp.verifyAHT(), copsAHT = inp.copsAHT();
  const phonesSR = 3600/phonesAHT, verifySR = 3600/verifyAHT, copsSR = 3600/copsAHT;
  $('phonesServiceRate').textContent = fmt(phonesSR,1);
  $('verifyServiceRate').textContent = fmt(verifySR,1);
  $('copsServiceRate').textContent   = fmt(copsSR,1);

  // Workloads (spike applied to phones)
  const phonesVol = inp.phonesVol() * spike;
  const verifyVol = inp.verifyVol(), verifyBacklog = inp.verifyBacklog();
  const copsVol   = inp.copsVol(),   copsBacklog   = inp.copsBacklog();
  const phonesWL  = phonesVol * phonesAHT / 3600;
  const verifyWL  = (verifyVol+verifyBacklog) * verifyAHT / 3600;
  const copsWL    = (copsVol+copsBacklog) * copsAHT / 3600;
  $('phonesWorkload').textContent = fmt(phonesWL,1);
  $('verifyWorkload').textContent = fmt(verifyWL,1);
  $('copsWorkload').textContent   = fmt(copsWL,1);

  // Spike impact display
  if (spike > 1.0) {
    $('spikeImpact').innerHTML = `<span style="color:#d97706">⚡ Spike x${spike.toFixed(1)}: ${queueNames.phones} volume boosted to <strong>${Math.round(phonesVol).toLocaleString()}</strong> calls. Arrival rate: <strong>${fmt(phonesVol/opHours,1)}/hr</strong>. Monitor pressure carefully.</span>`;
  } else {
    $('spikeImpact').innerHTML = `<span style="color:#94a3b8">Baseline volume. Slide right to simulate a ${queueNames.phones} spike.</span>`;
  }

  // Staffing
  const totalAgents   = inp.totalAgents();
  const phonesAgents  = inp.phonesAgents();
  const verifyAgents  = inp.verifyAgents();
  const copsAgents    = inp.copsAgents();
  const blendedAgents = inp.blendedAgents();
  $('hero-agents').querySelector('.hs-val').textContent = totalAgents;

  const allocTotal = phonesAgents + verifyAgents + copsAgents + blendedAgents;
  const unallocated = Math.max(0, totalAgents - allocTotal);
  const overAlloc = allocTotal > totalAgents;
  const warn = $('allocWarning');
  if (overAlloc) { warn.style.display='block'; warn.textContent=`⚠ Allocation exceeds total by ${allocTotal-totalAgents}. Check assignments.`; }
  else if (unallocated>0) { warn.style.display='block'; warn.textContent=`ℹ ${unallocated} agents unallocated.`; }
  else { warn.style.display='none'; }

  // Blended routing
  const phonesCapPerAgent = phonesSR * opHours;
  const verifyCapPerAgent = verifySR * opHours;
  const copsCapPerAgent   = copsSR   * opHours;
  const dedicatedPhonesCap = phonesAgents * phonesCapPerAgent;

  let blendRem = blendedAgents;
  const phonesShortfall = Math.max(0, phonesVol - dedicatedPhonesCap);
  const blendToPhones = Math.min(blendRem, phonesShortfall / (phonesCapPerAgent||1));
  blendRem -= blendToPhones;

  let blendToVerify = 0, blendToCOPS = 0;
  if (!burstMode) {
    // Normal: Phones → Verify → COPS
    const verifyShortfall = Math.max(0, verifyVol+verifyBacklog - verifyAgents*verifyCapPerAgent);
    blendToVerify = Math.min(blendRem, verifyShortfall / (verifyCapPerAgent||1));
    blendRem -= blendToVerify;
    blendToCOPS = blendRem;
  } else {
    // Burst: Phones → COPS → Verify
    const copsShortfall = Math.max(0, copsVol+copsBacklog - copsAgents*copsCapPerAgent);
    blendToCOPS = Math.min(blendRem, copsShortfall / (copsCapPerAgent||1));
    blendRem -= blendToCOPS;
    blendToVerify = blendRem;
  }

  const effPhones = phonesAgents + blendToPhones;
  const effVerify = verifyAgents + blendToVerify;
  const effCOPS   = copsAgents   + blendToCOPS;

  // Burst mode UI
  const burstBadge = $('burstBadge');
  const burstBadge2 = $('burstBadge2');
  const burstBannerText = $('burstBannerText');
  const burstNote = $('burstNote');
  if (burstMode) {
    burstBadge.style.display = 'block';
    if(burstBadge2) burstBadge2.style.display = 'flex';
    burstBannerText.textContent = ' — COPS BURST ACTIVE';
    const start = $('burstStart').value, dur = $('burstDuration').value;
    burstNote.textContent = `Burst routing: ${queueNames.phones} → ${queueNames.cops} → ${queueNames.verify} | ${start} for ${dur} hrs`;
    $('wfLabelP2').textContent = queueNames.cops + ' (Burst)';
    $('wfLabelP3').textContent = queueNames.verify + ' Remaining';
  } else {
    burstBadge.style.display = 'none';
    if(burstBadge2) burstBadge2.style.display = 'none';
    burstBannerText.textContent = '';
    burstNote.textContent = '';
    $('wfLabelP2').textContent = queueNames.verify + ' Used';
    $('wfLabelP3').textContent = queueNames.cops + ' Remaining';
  }

  // Arrival rates
  const phonesArrival = phonesVol / opHours;
  const verifyArrival = verifyVol / opHours;
  const copsArrival   = copsVol   / opHours;

  // Stability meters
  const phonesCapHr = effPhones * phonesSR;
  const verifyCapHr = effVerify * verifySR;
  const copsCapHr   = effCOPS   * copsSR;

  $('smArrivalPhones').textContent = fmt(phonesArrival,1);
  $('smArrivalVerify').textContent = fmt(verifyArrival,1);
  $('smArrivalCOPS').textContent   = fmt(copsArrival,1);
  $('smCapPhones').textContent = fmt(phonesCapHr,1);
  $('smCapVerify').textContent = fmt(verifyCapHr,1);
  $('smCapCOPS').textContent   = fmt(copsCapHr,1);
  $('smAgentsPhones').textContent = fmt(effPhones,1);
  $('smAgentsVerify').textContent = fmt(effVerify,1);
  $('smAgentsCOPS').textContent   = fmt(effCOPS,1);

  // Gauge fill: arrival/capacity ratio, capped at 1
  const gPhones = phonesCapHr>0 ? Math.min(phonesArrival/phonesCapHr, 1) : 1;
  const gVerify = verifyCapHr>0 ? Math.min(verifyArrival/verifyCapHr, 1) : 1;
  const gCOPS   = copsCapHr  >0 ? Math.min(copsArrival  /copsCapHr,   1) : 1;
  setGauge('smGaugePhones', gPhones, 'phones');
  setGauge('smGaugeVerify', gVerify, 'verify');
  setGauge('smGaugeCOPS',   gCOPS,   'cops');

  // Queue pressure
  const phonesPressure = effPhones>0 ? phonesArrival/(effPhones*phonesSR) : 99;
  const verifyPressure = effVerify>0 ? verifyArrival/(effVerify*verifySR) : 99;
  const copsPressure   = effCOPS  >0 ? copsArrival  /(effCOPS  *copsSR)  : 99;
  const avgPressure = [phonesPressure,verifyPressure,copsPressure].filter(v=>v<99).reduce((a,b,_,arr)=>a+b/arr.length,0);
  $('hero-pressure').querySelector('.hs-val').textContent = fmt(avgPressure,2);

  renderPressureBar('phonesPressureBar','phonesPressureVal','phonesPressureStatus', phonesPressure);
  renderPressureBar('verifyPressureBar','verifyPressureVal','verifyPressureStatus', verifyPressure);
  renderPressureBar('copsPressureBar',  'copsPressureVal',  'copsPressureStatus',   copsPressure);

  // Backlog forecast
  const verifyChange = verifyCapHr - verifyArrival;
  const copsChange   = copsCapHr   - copsArrival;
  const verifyBLClearHrs = verifyChange>0 && verifyBacklog>0 ? (verifyBacklog/verifyChange).toFixed(1) : verifyChange<=0 ? '∞' : '0';
  const copsBLClearHrs   = copsChange>0   && copsBacklog>0   ? (copsBacklog  /copsChange  ).toFixed(1) : copsChange<=0   ? '∞' : '0';

  const vblEl = $('verifyBLChange');
  vblEl.textContent = (verifyChange>=0?'+':'') + fmt(verifyChange,1);
  vblEl.className = 'bl-fc-val ' + (verifyChange>=0?'positive':'negative');
  $('verifyBLClear').textContent = verifyBLClearHrs;
  const cblEl = $('copsBLChange');
  cblEl.textContent = (copsChange>=0?'+':'') + fmt(copsChange,1);
  cblEl.className = 'bl-fc-val ' + (copsChange>=0?'positive':'negative');
  $('copsBLClear').textContent = copsBLClearHrs;

  const totalBacklog = verifyBacklog + copsBacklog;
  $('hero-backlog').querySelector('.hs-val').textContent = totalBacklog.toLocaleString();

  // Capacity Waterfall
  const totalCapHrs  = prodCap;
  const phonesConsumed = Math.min(phonesWL, totalCapHrs);
  let p2Consumed, p3Remaining;
  if (!burstMode) {
    p2Consumed  = Math.min(verifyWL, Math.max(0, totalCapHrs - phonesConsumed));
    p3Remaining = Math.max(0, totalCapHrs - phonesConsumed - p2Consumed);
  } else {
    p2Consumed  = Math.min(copsWL, Math.max(0, totalCapHrs - phonesConsumed));
    p3Remaining = Math.max(0, totalCapHrs - phonesConsumed - p2Consumed);
  }
  const wfMax = totalCapHrs || 1;
  setWF('wfTotal',  totalCapHrs,   wfMax, $('wfTotalVal'));
  setWF('wfPhones', phonesConsumed, wfMax, $('wfPhonesVal'));
  setWF('wfVerify', p2Consumed,    wfMax, $('wfVerifyVal'));
  setWF('wfCOPS',   p3Remaining,   wfMax, $('wfCOPSVal'));

  // Agent movement impact
  renderAgentImpact({ phonesAgents: effPhones, verifyAgents: effVerify, copsAgents: effCOPS, verifyChange, copsChange, phonesPressure, verifyPressure, copsPressure, phonesCapHr, verifyCapHr, copsCapHr, phonesArrival, verifyArrival, copsArrival });

  // Charts
  drawPressureChart([phonesPressure,verifyPressure,copsPressure], [queueNames.phones, queueNames.verify, queueNames.cops]);
  drawAllocationChart({ phones: phonesAgents, verify: verifyAgents, cops: copsAgents, blended: blendedAgents, unallocated });

  // Advisor
  generateAdvisor({ phonesPressure, verifyPressure, copsPressure, phonesAgents: effPhones, verifyAgents: effVerify, copsAgents: effCOPS, verifyChange, copsChange, verifyBacklog, copsBacklog, unallocated, blendedAgents, burstMode, spike });

  // Control Room
  if (controlRoomActive) {
    updateControlRoom({ phonesPressure, verifyPressure, copsPressure, verifyChange, copsChange, verifyBacklog, copsBacklog, effPhones, effVerify, effCOPS });
  }

  // Save state for optimizer / monte carlo baseline
  lastCalcState = { prodCap, phonesAHT, verifyAHT, copsAHT, phonesSR, verifySR, copsSR, phonesVol, verifyVol, verifyBacklog, copsVol, copsBacklog, opHours, totalAgents, phonesAgents, verifyAgents, copsAgents, blendedAgents, unallocated, effPhones, effVerify, effCOPS, phonesCapHr, verifyCapHr, copsCapHr, phonesArrival, verifyArrival, copsArrival, phonesPressure, verifyPressure, copsPressure, verifyChange, copsChange };
}

/* ─── GAUGE ─── */
function setGauge(id, ratio, queue) {
  const el = $(id);
  el.style.width = (ratio * 100) + '%';
  if (ratio >= 1.0)   el.style.background = 'linear-gradient(90deg, #dc2626, #ef4444)';
  else if (ratio > 0.85) el.style.background = 'linear-gradient(90deg, #d97706, #f59e0b)';
  else {
    const colors = { phones:'linear-gradient(90deg,#2563eb,#3b82f6)', verify:'linear-gradient(90deg,#7c3aed,#8b5cf6)', cops:'linear-gradient(90deg,#ea580c,#f97316)' };
    el.style.background = colors[queue];
  }
}

/* ─── PRESSURE BAR ─── */
function renderPressureBar(barId, valId, statusId, pressure) {
  const bar = $(barId), val = $(valId), status = $(statusId);
  if (pressure >= 99) { bar.style.width='0%'; val.textContent='N/A'; status.textContent='N/A'; status.className='pr-tag'; return; }
  bar.style.width = Math.min((pressure/1.5)*100, 100) + '%';
  val.textContent = pressure.toFixed(2);
  if (pressure <= 0.8) { bar.style.background='linear-gradient(90deg,#059669,#34d399)'; status.textContent='Stable'; status.className='pr-tag tag-green'; }
  else if (pressure <= 1.0) { bar.style.background='linear-gradient(90deg,#d97706,#fbbf24)'; status.textContent='At Risk'; status.className='pr-tag tag-yellow'; }
  else { bar.style.background='linear-gradient(90deg,#dc2626,#f87171)'; status.textContent='Growing'; status.className='pr-tag tag-red'; }
}

/* ─── WF BAR ─── */
function setWF(barId, val, max, labelEl) {
  $(barId).style.width = Math.min((val/max)*100, 100) + '%';
  labelEl.textContent = fmt(val,1) + ' hrs';
}

/* ─── AGENT IMPACT ─── */
function renderAgentImpact(d) {
  const lines = [];
  if (d.phonesPressure > 1.0) lines.push(`<div class="aip-line bad">🔴 ${queueNames.phones} is overloaded. Adding 1 agent reduces pressure by ~${fmt(1/(d.effPhones||1),2)}.</div>`);
  else lines.push(`<div class="aip-line good">✅ ${queueNames.phones} stable. Capacity surplus: ${fmt(d.phonesCapHr-d.phonesArrival,1)} cases/hr.</div>`);
  if (d.verifyChange < 0) lines.push(`<div class="aip-line bad">📋 Moving agents away from ${queueNames.verify} growing backlog by ${fmt(Math.abs(d.verifyChange),1)} cases/hr.</div>`);
  else lines.push(`<div class="aip-line good">📉 ${queueNames.verify} burning backlog at ${fmt(d.verifyChange,1)} cases/hr. Surplus capacity active.</div>`);
  if (d.copsChange < 0) lines.push(`<div class="aip-line bad">📂 ${queueNames.cops} backlog growing ${fmt(Math.abs(d.copsChange),1)} cases/hr. Consider adding agents.</div>`);
  else lines.push(`<div class="aip-line good">📂 ${queueNames.cops} clearing at ${fmt(d.copsChange,1)} cases/hr.</div>`);
  $('agentImpactText').innerHTML = lines.join('');
}

/* ─── CONTROL ROOM ─── */
function updateControlRoom(d) {
  function setStatus(phoneId, indicatorId, statusLblId, pressureId, cardId, pressure) {
    let statusText, statusClass, cardClass, indicatorColor;
    if (pressure >= 99) { statusText='No Data'; statusClass=''; cardClass=''; indicatorColor='#94a3b8'; }
    else if (pressure <= 0.8) { statusText='Stable'; statusClass='stable-txt'; cardClass='crm-stable'; indicatorColor='#10b981'; }
    else if (pressure <= 1.0) { statusText='Risk'; statusClass='risk-txt'; cardClass='crm-risk'; indicatorColor='#f59e0b'; }
    else { statusText='Critical'; statusClass='critical-txt'; cardClass='crm-critical'; indicatorColor='#ef4444'; }
    $(indicatorId).style.color = indicatorColor;
    $(statusLblId).textContent = statusText; $(statusLblId).className = 'csi-label ' + statusClass;
    $(pressureId).textContent = pressure<99 ? pressure.toFixed(2) : '—'; $(pressureId).className = 'csi-pres ' + statusClass;
    const card = $(cardId);
    card.className = 'crm-status-item ' + cardClass;
  }
  setStatus('crmStatusPhones','crmIndicatorPhones','crmStatusLabelPhones','crmPressurePhones','crmStatusPhones', d.phonesPressure);
  setStatus('crmStatusVerify','crmIndicatorVerify','crmStatusLabelVerify','crmPressureVerify','crmStatusVerify', d.verifyPressure);
  setStatus('crmStatusCOPS',  'crmIndicatorCOPS',  'crmStatusLabelCOPS',  'crmPressureCOPS',  'crmStatusCOPS',   d.copsPressure);

  // Backlog clocks
  function setClock(timeId, subId, change, backlog, name) {
    const timeEl=$(timeId), subEl=$(subId);
    if (change > 0 && backlog > 0) {
      const hrs = backlog / change;
      const h = Math.floor(hrs), m = Math.round((hrs-h)*60);
      timeEl.textContent = `${h}h ${m}m`; timeEl.className='blc-big blc-clearing';
      subEl.textContent=`${name} backlog clears in ${h}h ${m}m`; subEl.className='blc-detail';
    } else if (change <= 0) {
      timeEl.textContent = `+${fmt(Math.abs(change),0)}/hr`; timeEl.className='blc-big blc-growing';
      subEl.textContent=`${name} backlog growing`; subEl.className='blc-detail';
    } else {
      timeEl.textContent='Clear'; timeEl.className='blc-big blc-clearing';
      subEl.textContent='No backlog'; subEl.className='blc-detail';
    }
  }
  setClock('blcTimeVerify','blcSubVerify', d.verifyChange, d.verifyBacklog, queueNames.verify);
  setClock('blcTimeCOPS',  'blcSubCOPS',   d.copsChange,   d.copsBacklog,   queueNames.cops);

  // CRM Actions
  const actions = [];
  if (d.phonesPressure > 1.0) actions.push({ type:'action', icon:'🔴', text:`${queueNames.phones} critical (${d.phonesPressure.toFixed(2)}). Pull ${Math.ceil(d.effPhones*0.2)||1} agent${Math.ceil(d.effPhones*0.2)>1?'s':''} from ${queueNames.verify} immediately.` });
  else if (d.phonesPressure > 0.8) actions.push({ type:'warning', icon:'🟡', text:`${queueNames.phones} at risk (${d.phonesPressure.toFixed(2)}). Monitor and hold current allocation.` });
  else actions.push({ type:'stable', icon:'✅', text:`${queueNames.phones} stable (${d.phonesPressure.toFixed(2)}). ${queueNames.phones} agents available to support other queues if needed.` });

  if (d.verifyPressure > 1.0) actions.push({ type:'action', icon:'⚡', text:`${queueNames.verify} backlog growing. Allocate +${Math.ceil(d.effVerify*0.25)||2} agents to ${queueNames.verify}.` });
  else if (d.verifyChange < 0) actions.push({ type:'warning', icon:'📋', text:`${queueNames.verify} backlog growing at ${fmt(Math.abs(d.verifyChange),1)} cases/hr. Consider adding 1–2 agents.` });
  else if (d.verifyChange > 0 && d.verifyBacklog > 0) {
    const hrs=(d.verifyBacklog/d.verifyChange).toFixed(1);
    actions.push({ type:'info', icon:'📉', text:`${queueNames.verify} backlog clearing in ~${hrs} hrs. Maintain current staffing.` });
  }

  if (d.copsPressure > 1.0) actions.push({ type:'action', icon:'🗂', text:`${queueNames.cops} critical. Add agents or enable ${queueNames.cops} Burst Mode.` });
  else if (d.copsChange > 0 && d.effCOPS > 2) actions.push({ type:'info', icon:'💡', text:`${queueNames.cops} clearing quickly. Remove 1 agent and redeploy to ${d.verifyPressure>0.8?queueNames.verify:queueNames.phones}.` });

  $('crmActions').innerHTML = actions.map(a=>`<div class="crm-action-item rec-${a.type}"><span class="rec-icon">${a.icon}</span><span>${a.text}</span></div>`).join('');
}

/* ─── AI ADVISOR ─── */
function generateAdvisor(d) {
  const recs = [];
  if (d.spike > 1.0) recs.push({ type:'warning', icon:'⚡', msg:`${queueNames.phones} spike simulator active (${d.spike.toFixed(1)}×). Volume boosted — watch pressure closely.` });
  if (d.burstMode) recs.push({ type:'info', icon:'🔀', msg:`${queueNames.cops} Burst Mode is ACTIVE. Routing: ${queueNames.phones} → ${queueNames.cops} → ${queueNames.verify}. Monitor ${queueNames.verify} closely.` });

  if (d.phonesPressure >= 99) recs.push({ type:'warning', icon:'📞', msg:`${queueNames.phones} has no agents. Assign dedicated or blended agents immediately.` });
  else if (d.phonesPressure > 1.0) { const n=Math.ceil(d.phonesAgents*(d.phonesPressure-1.0)); recs.push({ type:'action', icon:'🔴', msg:`${queueNames.phones} under pressure (${d.phonesPressure.toFixed(2)}). Pull ${Math.max(1,n)} agent${n>1?'s':''} from lower-priority queues.` }); }
  else if (d.phonesPressure > 0.8) recs.push({ type:'warning', icon:'🟡', msg:`${queueNames.phones} at risk (${d.phonesPressure.toFixed(2)}). Consider holding allocation.` });
  else recs.push({ type:'stable', icon:'✅', msg:`${queueNames.phones} stable (${d.phonesPressure.toFixed(2)}). Current staffing adequate.` });

  if (d.verifyPressure >= 99) { if (d.verifyBacklog>0) recs.push({ type:'warning', icon:'📋', msg:`${queueNames.verify} has no agents but ${d.verifyBacklog.toLocaleString()} cases in backlog. Assign at least 1.` }); }
  else if (d.verifyPressure > 1.0) { const n=Math.ceil(d.verifyAgents*(d.verifyPressure-0.9)); recs.push({ type:'action', icon:'⚡', msg:`${queueNames.verify} backlog increasing (${d.verifyPressure.toFixed(2)}). Allocate +${Math.max(1,n)} agent${n>1?'s':''}.` }); }
  else if (d.verifyChange > 0 && d.verifyBacklog > 0) { const h=(d.verifyBacklog/d.verifyChange).toFixed(1); recs.push({ type:'info', icon:'📉', msg:`${queueNames.verify} backlog clearing at ${fmt(d.verifyChange,1)} cases/hr. Clearance in ~${h} hrs.` }); }
  else if (d.verifyPressure <= 0.6 && d.verifyAgents > 1) recs.push({ type:'stable', icon:'💡', msg:`${queueNames.verify} well-staffed. Consider moving 1–2 agents to ${queueNames.cops} if backlog persists.` });
  else recs.push({ type:'stable', icon:'✅', msg:`${queueNames.verify} stable (${d.verifyPressure.toFixed(2)}). Backlog manageable.` });

  if (d.copsPressure >= 99) {
    if (d.copsBacklog>0) recs.push({ type:'warning', icon:'🗂', msg:`${queueNames.cops} has ${d.copsBacklog.toLocaleString()} cases but no agents. Allocate COPS agents or enable Burst Mode.` });
    else recs.push({ type:'info', icon:'✅', msg:`${queueNames.cops} has no volume. No agents needed.` });
  } else if (d.copsPressure > 1.0) recs.push({ type:'action', icon:'🔴', msg:`${queueNames.cops} pressure elevated (${d.copsPressure.toFixed(2)}). Add agents if ${queueNames.phones} and ${queueNames.verify} are stable.` });
  else if (d.copsChange > 0 && d.copsBacklog > 0) { const h=(d.copsBacklog/d.copsChange).toFixed(1); recs.push({ type:'info', icon:'📉', msg:`${queueNames.cops} backlog clearing at ${fmt(d.copsChange,1)} cases/hr. Clearance in ~${h} hrs.` }); }
  else if (d.copsPressure <= 0.5 && d.copsAgents > 1) recs.push({ type:'stable', icon:'💡', msg:`${queueNames.cops} clearing quickly. Remove 1 agent and redeploy to ${queueNames.verify}.` });
  else recs.push({ type:'stable', icon:'✅', msg:`${queueNames.cops} stable (${d.copsPressure.toFixed(2)}). No action needed.` });

  if (d.unallocated >= 3) recs.push({ type:'info', icon:'👥', msg:`${d.unallocated} agents unallocated. Assign as blended agents to maximize capacity.` });
  if (d.blendedAgents > 0) recs.push({ type:'info', icon:'🔀', msg:`${d.blendedAgents} blended agent${d.blendedAgents>1?'s':''} cascading via priority routing.` });

  $('advisorRecs').innerHTML = recs.map(r=>`<div class="advisor-rec rec-${r.type}"><span class="rec-icon">${r.icon}</span><span>${r.msg}</span></div>`).join('');
}

/* ─── SKILL GROUP OPTIMIZER ─── */
function runOptimizer() {
  const btn = $('optimizerBtn');
  btn.textContent = 'Optimizing…'; btn.disabled = true;
  setTimeout(() => {
    const s = lastCalcState;
    if (!s.totalAgents) { $('optimizerResult').innerHTML='<div class="opt-note">Set up inputs first.</div>'; btn.textContent='Run Optimizer'; btn.disabled=false; return; }
    const total = s.totalAgents;
    // Simple gradient search: minimize sum of pressures subject to total agent constraint
    let best = { phones:0, verify:0, cops:0, score:Infinity };
    const step = Math.max(1, Math.floor(total/20));
    for (let p = 0; p <= total; p += step) {
      for (let v = 0; v <= total-p; v += step) {
        const c = total - p - v;
        if (c < 0) continue;
        const pp = p>0 && s.phonesSR>0 ? (s.phonesArrival/(p*s.phonesSR)) : 9;
        const vp = v>0 && s.verifySR>0 ? (s.verifyArrival/(v*s.verifySR)) : 9;
        const cp = c>0 && s.copsSR>0   ? (s.copsArrival  /(c*s.copsSR))   : 9;
        // Weighted: phones most critical
        const score = pp*3 + vp*2 + cp*1 + Math.abs(pp-1)*2 + Math.abs(vp-1)*1.5;
        if (score < best.score) best = { phones:p, verify:v, cops:c, score, pp, vp, cp };
      }
    }
    $('heroOptLabel').textContent = 'Optimized';
    $('optimizerResult').innerHTML = `
      <div class="opt-row"><span class="opt-label"><span class="q-pill q1p sm">P1</span> ${queueNames.phones}</span><span class="opt-val">${best.phones} agents</span></div>
      <div class="opt-row"><span class="opt-label"><span class="q-pill q2p sm">P2</span> ${queueNames.verify}</span><span class="opt-val">${best.verify} agents</span></div>
      <div class="opt-row"><span class="opt-label"><span class="q-pill q3p sm">P3</span> ${queueNames.cops}</span><span class="opt-val">${best.cops} agents</span></div>
      <div class="opt-row"><span class="opt-label">Projected Pressures</span><span class="opt-val" style="font-size:12px;color:#94a3b8">${best.pp.toFixed(2)} / ${best.vp.toFixed(2)} / ${best.cp.toFixed(2)}</span></div>
      <div class="opt-note">Optimization goal: minimize pressure across all queues while protecting ${queueNames.phones} as highest priority.</div>`;
    btn.textContent='Run Optimizer'; btn.disabled=false;
  }, 300);
}

/* ─── MONTE CARLO ─── */
function runMonteCarlo() {
  const btn = $('monteBtn');
  btn.textContent = 'Simulating…'; btn.disabled = true;
  setTimeout(() => {
    const s = lastCalcState;
    if (!s.totalAgents) { $('monteResult').innerHTML='<div class="opt-note">Run main calculation first.</div>'; btn.textContent='Run Simulation'; btn.disabled=false; return; }
    const runs      = +$('mcRuns').value || 500;
    const pVar      = (+$('mcPhonesVar').value||20) / 100;
    const vVar      = (+$('mcVerifyVar').value||10) / 100;

    let phonesOverload=0, verifyGrowth=0, copsGrowth=0;
    const phonesResults=[], verifyResults=[], copsResults=[];

    function randn() { let u,v; do{u=Math.random();v=Math.random();}while(u===0); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

    for (let i=0; i<runs; i++) {
      const pVol = s.phonesVol * (1 + pVar*randn());
      const vVol = s.verifyVol * (1 + vVar*randn());
      const cVol = s.copsVol   * (1 + 0.05*randn());
      const pArr = pVol/s.opHours, vArr = vVol/s.opHours, cArr = cVol/s.opHours;
      const pPres = s.effPhones>0 ? pArr/(s.effPhones*s.phonesSR) : 9;
      const vChange = (s.effVerify*s.verifySR) - vArr;
      const cChange = (s.effCOPS  *s.copsSR  ) - cArr;
      phonesResults.push(pPres); verifyResults.push(vChange); copsResults.push(cChange);
      if (pPres > 1.0)    phonesOverload++;
      if (vChange < 0)    verifyGrowth++;
      if (cChange < 0)    copsGrowth++;
    }

    const pOvP = (phonesOverload/runs)*100;
    const vGrP = (verifyGrowth/runs)*100;
    const cGrP = (copsGrowth/runs)*100;

    function probClass(p) { return p>60?'prob-high':p>30?'prob-medium':'prob-low'; }

    $('monteResult').innerHTML = `
      <div class="monte-row ${probClass(pOvP)}"><span class="monte-label">${queueNames.phones} overload probability</span><span class="monte-prob">${pOvP.toFixed(1)}%</span></div>
      <div class="monte-row ${probClass(vGrP)}"><span class="monte-label">${queueNames.verify} backlog growth probability</span><span class="monte-prob">${vGrP.toFixed(1)}%</span></div>
      <div class="monte-row ${probClass(cGrP)}"><span class="monte-label">${queueNames.cops} backlog growth probability</span><span class="monte-prob">${cGrP.toFixed(1)}%</span></div>
      <div class="opt-note">${runs.toLocaleString()} simulated scenarios · Phone variability ±${Math.round(pVar*100)}% · Verify variability ±${Math.round(vVar*100)}%</div>`;

    drawMonteChart(phonesResults);
    btn.textContent='Run Simulation'; btn.disabled=false;
  }, 100);
}

function drawMonteChart(data) {
  const canvas = $('monteChart');
  canvas.style.display='block';
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio||1;
  const W = canvas.clientWidth||400, H = 120;
  canvas.width=W*dpr; canvas.height=H*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);

  // Histogram
  const bins=20, min=Math.min(...data), max=Math.max(...data);
  const binW=(max-min)/bins||1;
  const counts=new Array(bins).fill(0);
  data.forEach(v=>{ const i=Math.min(Math.floor((v-min)/binW),bins-1); counts[i]++; });
  const maxCount=Math.max(...counts);
  const bW=(W-30)/bins;
  counts.forEach((c,i)=>{
    const x=30+i*bW, bH=(c/maxCount)*(H-24), y=H-16-bH;
    const thresh=min+i*binW;
    ctx.fillStyle=thresh>1.0?'rgba(239,68,68,0.75)':thresh>0.8?'rgba(245,158,11,0.75)':'rgba(16,185,129,0.75)';
    if (ctx.roundRect) ctx.roundRect(x,y,bW-1,bH,[2,2,0,0]); else ctx.rect(x,y,bW-1,bH);
    ctx.fill();
  });
  // Threshold line at 1.0
  const x1 = 30 + ((1.0-min)/binW)*bW;
  if (x1>=30 && x1<=W) {
    ctx.beginPath(); ctx.strokeStyle='rgba(239,68,68,0.5)'; ctx.setLineDash([3,3]); ctx.lineWidth=1.5;
    ctx.moveTo(x1,0); ctx.lineTo(x1,H-16); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='rgba(239,68,68,0.7)'; ctx.font='9px JetBrains Mono,monospace'; ctx.textAlign='center';
    ctx.fillText('1.0',x1,H-4);
  }
  ctx.fillStyle='rgba(71,85,105,0.6)'; ctx.font='9px JetBrains Mono,monospace'; ctx.textAlign='left';
  ctx.fillText(min.toFixed(2),30,H-4);
  ctx.textAlign='right'; ctx.fillText(max.toFixed(2),W,H-4);
  ctx.textAlign='left'; ctx.fillStyle='rgba(71,85,105,0.6)'; ctx.font='10px Plus Jakarta Sans,sans-serif';
  ctx.fillText(`${queueNames.phones} Pressure Distribution (${data.length} runs)`,30,12);
}

/* ─── INTRADAY TIMELINE ─── */
function runTimeline() {
  const btn = $('timelineBtn');
  btn.textContent = 'Simulating…'; btn.disabled=true;
  setTimeout(()=>{
    const s = lastCalcState;
    if (!s.totalAgents) { btn.textContent='Simulate Day'; btn.disabled=false; return; }

    const openStr  = $('tlOpen').value  || '07:00';
    const closeStr = $('tlClose').value || '21:00';
    const intervalMins = +$('tlInterval').value || 15;

    const [oh,om] = openStr.split(':').map(Number);
    const [ch,cm] = closeStr.split(':').map(Number);
    const totalMins = (ch*60+cm) - (oh*60+om);
    if (totalMins <= 0) { btn.textContent='Simulate Day'; btn.disabled=false; return; }

    const intervals = Math.floor(totalMins / intervalMins);
    const labels=[], vBacklogs=[], cBacklogs=[], utilization=[];

    let vBL = s.verifyBacklog, cBL = s.copsBacklog;
    const fracHr = intervalMins / 60;

    for (let i=0; i<intervals; i++) {
      const t = new Date(2000,0,1,oh,om + i*intervalMins);
      labels.push(t.toTimeString().slice(0,5));

      // Simple model: constant rates
      const vNet = (s.effVerify*s.verifySR - s.verifyArrival) * fracHr;
      const cNet = (s.effCOPS  *s.copsSR   - s.copsArrival  ) * fracHr;
      vBL = Math.max(0, vBL - vNet);
      cBL = Math.max(0, cBL - cNet);
      vBacklogs.push(Math.round(vBL));
      cBacklogs.push(Math.round(cBL));

      const totalCap = (s.effPhones*s.phonesSR + s.effVerify*s.verifySR + s.effCOPS*s.copsSR);
      const totalArr = s.phonesArrival + s.verifyArrival + s.copsArrival;
      utilization.push(totalCap>0 ? Math.min(totalArr/totalCap, 1.1) : 0);
    }

    drawTimelineChart(labels, vBacklogs, cBacklogs, utilization);

    const finalVBL = vBacklogs[vBacklogs.length-1];
    const finalCBL = cBacklogs[cBacklogs.length-1];
    $('timelineStats').innerHTML=`
      <div class="tl-stat"><div class="tl-stat-val">${finalVBL.toLocaleString()}</div><div class="tl-stat-lbl">${queueNames.verify} EOD backlog</div></div>
      <div class="tl-stat"><div class="tl-stat-val">${finalCBL.toLocaleString()}</div><div class="tl-stat-lbl">${queueNames.cops} EOD backlog</div></div>
      <div class="tl-stat"><div class="tl-stat-val">${intervals}</div><div class="tl-stat-lbl">${intervalMins}-min intervals</div></div>`;

    btn.textContent='Simulate Day'; btn.disabled=false;
  }, 100);
}

function drawTimelineChart(labels, vData, cData, util) {
  const canvas = $('timelineChart');
  canvas.style.display='block';
  const ctx=canvas.getContext('2d');
  const dpr=window.devicePixelRatio||1;
  const W=canvas.clientWidth||700, H=160;
  canvas.width=W*dpr; canvas.height=H*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);

  const pad={l:40,r:16,t:20,b:28};
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;
  const n=labels.length; if(n<2)return;

  const maxBL=Math.max(...vData,...cData,1);
  function tx(i){return pad.l+(i/(n-1))*cW;}
  function ty(v){return pad.t+cH-(v/maxBL)*cH;}

  // Grid
  ctx.strokeStyle='rgba(0,0,0,0.06)'; ctx.lineWidth=1;
  [0,0.25,0.5,0.75,1].forEach(f=>{
    const y=pad.t+cH-(f*cH);
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
    if(f>0){ctx.fillStyle='rgba(71,85,105,0.5)';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='right';ctx.fillText(Math.round(f*maxBL),pad.l-4,y+3);}
  });

  // Verify line
  ctx.beginPath(); ctx.strokeStyle='#8b5cf6'; ctx.lineWidth=2;
  vData.forEach((v,i)=>{ i===0?ctx.moveTo(tx(i),ty(v)):ctx.lineTo(tx(i),ty(v)); }); ctx.stroke();

  // COPS line
  ctx.beginPath(); ctx.strokeStyle='#f97316'; ctx.lineWidth=2;
  cData.forEach((v,i)=>{ i===0?ctx.moveTo(tx(i),ty(v)):ctx.lineTo(tx(i),ty(v)); }); ctx.stroke();

  // X axis labels
  const step=Math.max(1,Math.floor(n/8));
  ctx.fillStyle='rgba(71,85,105,0.65)'; ctx.font='9px JetBrains Mono,monospace'; ctx.textAlign='center';
  labels.forEach((l,i)=>{ if(i%step===0) ctx.fillText(l,tx(i),H-8); });

  // Legend
  ctx.fillStyle='#8b5cf6'; ctx.fillRect(pad.l,5,16,3);
  ctx.fillStyle='rgba(71,85,105,0.7)'; ctx.font='9px Plus Jakarta Sans,sans-serif'; ctx.textAlign='left';
  ctx.fillText(queueNames.verify+' Backlog', pad.l+20,10);
  ctx.fillStyle='#f97316'; ctx.fillRect(pad.l+120,5,16,3);
  ctx.fillStyle='rgba(71,85,105,0.7)'; ctx.fillText(queueNames.cops+' Backlog', pad.l+140,10);
}

/* ─── HELPERS ─── */
function fmt(val, dec) { if (!isFinite(val)) return '—'; return val.toFixed(dec); }

/* ─── ATTACH LISTENERS ─── */
document.querySelectorAll('input[type="number"], input[type="time"]').forEach(el => {
  el.addEventListener('input', calculate);
  el.addEventListener('change', calculate);
});

/* ─── QUICK ACTIONS ─── */
function loadExampleScenario() {
  const fields = {
    paidHours: 450, shrinkage: 15, occupancy: 95, opHours: 14,
    phonesVol: 500, phonesAHT: 370,
    verifyVol: 5000, verifyAHT: 160, verifyBacklog: 200,
    copsVol: 3500, copsAHT: 100, copsBacklog: 300,
    totalAgents: 60, phonesAgents: 10, verifyAgents: 30,
    copsAgents: 10, blendedAgents: 10
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = $(id);
    if (el) { el.value = val; }
  });
  // Sync sliders
  sliderPhones.value = 10; $('sliderPhonesVal').textContent = 10; syncSliderTrack(sliderPhones);
  sliderVerify.value = 30; $('sliderVerifyVal').textContent = 30; syncSliderTrack(sliderVerify);
  sliderCOPS.value   = 10; $('sliderCOPSVal').textContent   = 10; syncSliderTrack(sliderCOPS);
  spikeSlider.value  = 10; $('spikeMultiplierVal').textContent = '1.0×'; syncSliderTrack(spikeSlider);
  // Reset burst mode
  $('burstModeToggle').checked = false;
  calculate();
  // Visual feedback
  const btn = document.querySelector('.qa-btn-load');
  const orig = btn.innerHTML;
  btn.innerHTML = '✓ Loaded!';
  btn.style.background = '#10b981';
  btn.style.color = 'white';
  setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.color = ''; }, 1200);
}

function resetInputs() {
  loadExampleScenario(); // same defaults
  // Visual feedback
  const btn = document.querySelector('.qa-btn-reset');
  const orig = btn.innerHTML;
  btn.innerHTML = '✓ Reset!';
  btn.style.background = '#6366f1';
  btn.style.color = 'white';
  setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.color = ''; }, 1200);
}

/* ─── INIT ─── */
[sliderPhones, sliderVerify, sliderCOPS, spikeSlider].forEach(syncSliderTrack);
updateQueueNameLabels();
window.addEventListener('resize', calculate);
calculate();
