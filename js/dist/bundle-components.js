/* ==== bundle-components.js — généré par scripts/build-bundles.mjs, ne pas éditer ==== */
/* Sources (17), dans l'ordre de bundles.json. */
;
/* ==== js/lib/qrcode-svg.min.js ==== */
'use strict';function QRCode(r){var n,t,o,e,a=[],f=[],i=Math.max,u=Math.min,h=Math.abs,v=Math.ceil,c=/^[0-9]*$/,s=/^[A-Z0-9 $%*+.\/:-]*$/,l="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:",g=[[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],[-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],[-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]],d=[[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],[-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],[-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]],m={L:[0,1],M:[1,0],Q:[2,3],H:[3,2]},p=function(r,n){for(var t=0,o=8;o--;)t=t<<1^285*(t>>>7)^(n>>>o&1)*r;return t},C=function(r,n){for(var t=[],o=r.length,e=o;e;)for(var a=r[o-e--]^t.shift(),f=n.length;f--;)t[f]^=p(n[f],a);return t},w=function(r){for(var n=[function(){return 0==(t+o)%2},function(){return 0==t%2},function(){return 0==o%3},function(){return 0==(t+o)%3},function(){return 0==((t/2|0)+(o/3|0))%2},function(){return 0==t*o%2+t*o%3},function(){return 0==(t*o%2+t*o%3)%2},function(){return 0==((t+o)%2+t*o%3)%2}][r],t=e;t--;)for(var o=e;o--;)f[t][o]||(a[t][o]^=n())},b=function(){for(var r=function(r,n){n[6]||(r+=e),n.shift(),n.push(r)},n=function(n,o,a){return n&&(r(o,a),o=0),r(o+=e,a),t(a)},t=function(r){var n=r[5],t=n>0&&r[4]==n&&r[3]==3*n&&r[2]==n&&r[1]==n;return(t&&r[6]>=4*n&&r[0]>=n?1:0)+(t&&r[0]>=4*n&&r[6]>=n?1:0)},o=0,f=e*e,i=0,u=e;u--;){for(var c=[0,0,0,0,0,0,0],s=[0,0,0,0,0,0,0],l=!1,g=!1,d=0,m=0,p=e;p--;){a[u][p]==l?5==++d?o+=3:d>5&&o++:(r(d,c),o+=40*t(c),d=1,l=a[u][p]),a[p][u]==g?5==++m?o+=3:m>5&&o++:(r(m,s),o+=40*t(s),m=1,g=a[p][u]);var C=a[u][p];C&&i++,p&&u&&C==a[u][p-1]&&C==a[u-1][p]&&C==a[u-1][p-1]&&(o+=3)}o+=40*n(l,d,c)+40*n(g,m,s)}return o+=10*(v(h(20*i-10*f)/f)-1)},A=function(r,n,t){for(;n--;)t.push(r>>>n&1)},M=function(r,n){return r.numBitsCharCount[(n+7)/17|0]},B=function(r,n){return 0!=(r>>>n&1)},x=function(r,n){for(var t=0,o=r.length;o--;){var e=r[o],a=M(e,n);if(1<<a<=e.numChars)return 1/0;t+=4+a+e.bitData.length}return t},D=function(r){if(r<1||r>40)throw"Version number out of range";var n=(16*r+128)*r+64;if(r>=2){var t=r/7|2;n-=(25*t-10)*t-55,r>=7&&(n-=36)}return n},I=function(r,n){for(var t=2;-2<=t;t--)for(var o=2;-2<=o;o--)E(r+o,n+t,1!=i(h(o),h(t)))},H=function(r,n){for(var t=4;-4<=t;t--)for(var o=4;-4<=o;o--){var a=i(h(o),h(t)),f=r+o,u=n+t;0<=f&&f<e&&0<=u&&u<e&&E(f,u,2!=a&&4!=a)}},$=function(r){for(var n=t[1]<<3|r,o=n,a=10;a--;)o=o<<1^1335*(o>>>9);var f=21522^(n<<10|o);if(f>>>15!=0)throw"Assertion error";for(a=0;a<=5;a++)E(8,a,B(f,a));E(8,7,B(f,6)),E(8,8,B(f,7)),E(7,8,B(f,8));for(a=9;a<15;a++)E(14-a,8,B(f,a));for(a=0;a<8;a++)E(e-1-a,8,B(f,a));for(a=8;a<15;a++)E(8,e-15+a,B(f,a));E(8,e-8,1)},O=function(){for(var r=e;r--;)E(6,r,0==r%2),E(r,6,0==r%2);for(var t=function(){var r=[];if(n>1)for(var t=2+(n/7|0),o=32==n?26:2*v((e-13)/(2*t-2));t--;)r[t]=t*o+6;return r}(),o=r=t.length;o--;)for(var a=r;a--;)0==a&&0==o||0==a&&o==r-1||a==r-1&&0==o||I(t[a],t[o]);H(3,3),H(e-4,3),H(3,e-4),$(0),function(){if(!(7>n)){for(var r=n,t=12;t--;)r=r<<1^7973*(r>>>11);var o=n<<12|r;if(t=18,o>>>18!=0)throw"Assertion error";for(;t--;){var a=e-11+t%3,f=t/3|0,i=B(o,t);E(a,f,i),E(f,a,i)}}}()},Q=function(r){if(r.length!=V(n,t))throw"Invalid argument";for(var o=d[t[0]][n],e=g[t[0]][n],a=D(n)/8|0,f=o-a%o,i=a/o|0,u=[],h=function(r){var n=1,t=[];t[r-1]=1;for(var o=0;o<r;o++){for(var e=0;e<r;e++)t[e]=p(t[e],n)^t[e+1];n=p(n,2)}return t}(e),v=0,c=0;v<o;v++){var s=r.slice(c,c+i-e+(v<f?0:1));c+=s.length;var l=C(s,h);v<f&&s.push(0),u.push(s.concat(l))}var m=[];for(v=0;v<u[0].length;v++)for(var w=0;w<u.length;w++)(v!=i-e||w>=f)&&m.push(u[w][v]);return m},S=function(r){for(var n=[],t=(r=encodeURI(r),0);t<r.length;t++)"%"!=r.charAt(t)?n.push(r.charCodeAt(t)):(n.push(parseInt(r.substr(t+1,2),16)),t+=2);return n},V=function(r,n){return(D(r)/8|0)-g[n[0]][r]*d[n[0]][r]},E=function(r,n,t){a[n][r]=t?1:0,f[n][r]=1},R=function(r){for(var n=[],t=0,o=r;t<o.length;t++){var e=o[t];A(e,8,n)}return{modeBits:4,numBitsCharCount:[8,16,16],numChars:r.length,bitData:n}},Z=function(r){if(!c.test(r))throw"String contains non-numeric characters";for(var n=[],t=0;t<r.length;){var o=u(r.length-t,3);A(parseInt(r.substr(t,o),10),3*o+1,n),t+=o}return{modeBits:1,numBitsCharCount:[10,12,14],numChars:r.length,bitData:n}},z=function(r){if(!s.test(r))throw"String contains unencodable characters in alphanumeric mode";var n,t=[];for(n=0;n+2<=r.length;n+=2){var o=45*l.indexOf(r.charAt(n));o+=l.indexOf(r.charAt(n+1)),A(o,11,t)}return n<r.length&&A(l.indexOf(r.charAt(n)),6,t),{modeBits:2,numBitsCharCount:[9,11,13],numChars:r.length,bitData:t}},L=function(r,n,t,o){var e=function(r){return""==r?[]:c.test(r)?[Z(r)]:s.test(r)?[z(r)]:[R(S(r))]}(r);return U(e,n,t,o)},N=function(r,i,u,h){t=i,o=h;for(var v=e=4*(n=r)+17;v--;)a[v]=[],f[v]=[];if(O(),function(r){for(var n=0,t=1,o=e-1,i=o;i>0;i-=2){6==i&&--i;for(var u=0>(t=-t)?o:0,h=0;h<e;++h){for(var v=i;v>i-2;--v)f[u][v]||(a[u][v]=B(r[n>>>3],7-(7&n)),++n);u+=t}}}(Q(u)),0>o){var c=1e9;for(v=8;v--;){w(v),$(v);var s=b();c>s&&(c=s,o=v),w(v)}}w(o),$(o),f=[]},U=function(r,n,t,o,e,a){if(void 0===e&&(e=1),void 0===a&&(a=40),void 0===o&&(o=-1),void 0===t&&(t=!0),!(1<=e&&e<=a&&a<=40)||o<-1||o>7)throw"Invalid value";for(var f=[],i=236,h=[],v=e;;){var c=x(r,v);if(c<=8*V(v,n))break;if(v>=a)throw"Data too long";v++}if(t)for(var s=(l=[m.H,m.Q,m.M]).length;s--;)c<=8*V(v,l[s])&&(n=l[s]);for(var l=0;l<r.length;l++){var g=r[l];A(g.modeBits,4,f),A(g.numChars,M(g,v),f);for(var d=0,p=g.bitData;d<p.length;d++)f.push(p[d])}if(f.length!=c)throw"Assertion error";var C=8*V(v,n);if(f.length>C)throw"Assertion error";if(A(0,u(4,C-f.length),f),A(0,(8-f.length%8)%8,f),f.length%8!=0)throw"Assertion error";for(;f.length<C;)A(i,8,f),i^=253;for(s=f.length;s--;)h[s>>>3]|=f[s]<<7-(7&s);return N(v,n,h,o)};return function(){function n(r){return/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(r)}function t(r,n){for(var t in r=document.createElementNS(s,r),n||{})r.setAttribute(t,n[t]);return r}var o,f,i,u,v,c,s="http://www.w3.org/2000/svg",l="",g="string"==typeof r?{msg:r}:r||{},d=g.pal||["#000"],p=h(g.dim)||256,C=[1,0,0,1,c=(c=h(g.pad))>-1?c:4,c],w=n(w=d[0])?w:"#000",b=n(b=d[1])?b:0,A=g.vrb?0:1;for(L(g.msg||"",m[g.ecl]||m.M,0==g.ecb?0:1,g.mtx),v=e+2*c,i=e;i--;)for(u=0,f=e;f--;)a[i][f]&&(A?(u++,a[i][f-1]||(l+="M"+f+","+i+"h"+u+"v1h-"+u+"v-1z",u=0)):l+="M"+f+","+i+"h1v1h-1v-1z");return o=t("svg",{viewBox:[0,0,v,v].join(" "),width:p,height:p,fill:w,"shape-rendering":"crispEdges",xmlns:s,version:"1.1"}),b&&o.appendChild(t("path",{fill:b,d:"M0,0V"+v+"H"+v+"V0H0Z"})),o.appendChild(t("path",{transform:"matrix("+C+")",d:l})),o}()}
;
/* ==== js/components/timeline.js ==== */
/**
 * timeline.js — Vertical timeline component
 * Renders a list of timeline events with dots and times.
 *
 * Event types:
 *   - Standard: { t, d } or { time, text }
 *   - Departure marker: { t, d, type: 'departure', ref: 'traveler-id' }
 *   - With restaurant ref: { t, d, restaurantRef: N }
 *   - With culture badge: { t, d, culture: { icon, title, text } }
 *   - Cross-TZ: { t, d, tz, date? } — local t primary; homeTz secondary via TzHelpers
 */

var Timeline = (() => {

  /**
   * Render timeline events.
   * @param {Array} events
   * @param {Object} [opts] — { restaurants?, homeTz?, dayDate? }
   * @returns {string} HTML string
   */
  function render(events, opts) {
    if (!events || !events.length) return '';
    const restaurants = (opts && opts.restaurants) || {};
    const homeTz = (opts && opts.homeTz)
      || (typeof TzHelpers !== 'undefined' ? TzHelpers.DEFAULT_HOME_TZ : 'Europe/Paris');
    const dayDate = (opts && opts.dayDate) || '';

    const items = events.map(ev => {
      const time = ev.time || ev.t || '';
      const desc = ev.text || ev.d || '';
      const link = ev.link || null;
      const timeBlock = renderTimeBlock(time, ev, { homeTz, dayDate });

      // ── Departure marker ──
      if (ev.type === 'departure') {
        return `<div class="timeline-item departure-marker" data-dep-ref="${escapeAttr(ev.ref || '')}">
          ${timeBlock}
          <span class="tl-desc"><strong>${escapeAndLink(desc)}</strong></span>
        </div>`;
      }

      // ── Detect accent/green ──
      const isAccent = ev.accent || /^DÉPART|^Arrivée|^✈️|^🛬|^🚗/.test(desc);
      const isGreen  = ev.green  || /^⭐|^✅/.test(desc);

      let dotClass = '';
      if (isAccent) dotClass = 'accent';
      else if (isGreen) dotClass = 'green';

      // ── Build description ──
      let descHtml = escapeAndLink(desc);

      // Culture badge (clickable → overlay modal)
      if (ev.culture) {
        const c = ev.culture;
        const cIcon = escapeHtml(c.icon || '\ud83d\udcda');
        const cTitle = escapeAttr(c.title || '');
        const cText = escapeAttr(c.text || '');
        descHtml += ` <span class="badge badge-culture" style="font-size:.7em;vertical-align:middle;cursor:pointer;background:rgba(78,205,196,.15);color:var(--sec);padding:2px 8px;border-radius:8px" onclick="Timeline.showCulture('${cIcon}','${cTitle}','${cText}')">${cIcon} Culture</span>`;
      }

      // Restaurant ref badge
      if (ev.restaurantRef != null && restaurants[ev.restaurantRef]) {
        const r = restaurants[ev.restaurantRef];
        const rName = r.main ? r.main.name : (r.name || '');
        if (rName) {
          descHtml += ` <span class="badge badge-orange" style="font-size:.7em;vertical-align:middle">\ud83c\udf7d\ufe0f ${escapeHtml(rName)}</span>`;
        }
      }

      if (link) {
        descHtml += ` <a href="${link}" class="btn btn-muted" style="font-size:.75em;padding:3px 8px;margin-left:4px" target="_blank">\u2192</a>`;
      }

      return `<div class="timeline-item ${dotClass}">
        ${timeBlock}
        <span class="tl-desc">${descHtml}</span>
      </div>`;
    });

    return `<div class="timeline">${items.join('')}</div>`;
  }

  /**
   * Local time (primary) + optional home/Nice time (secondary).
   * Dual display only when entry.tz is set (seed contract) and conversion differs.
   */
  function renderTimeBlock(time, ev, ctx) {
    if (!time) {
      return `<span class="tl-time" style="min-width:48px"></span>`;
    }
    let homeHtml = '';
    if (ev && ev.tz && typeof TzHelpers !== 'undefined') {
      const label = TzHelpers.homeTimeLabel({
        t: time,
        tz: ev.tz,
        date: ev.date || ctx.dayDate,
        homeTz: ctx.homeTz,
      });
      if (label && label.text) {
        homeHtml = `<span class="tl-time-home" title="Heure Nice / maison">${escapeHtml(label.text)}</span>`;
      }
    }
    return `<span class="tl-time">${escapeHtml(time)}${homeHtml}</span>`;
  }

  /**
   * Show a culture overlay modal (called from inline onclick).
   * Replicates the voyage-app culture overlay behavior.
   * @param {string} icon — Emoji icon
   * @param {string} title — Culture topic title
   * @param {string} text — Culture text content
   */
  function showCulture(icon, title, text) {
    // Decode escaped quotes from HTML attributes
    const cleanTitle = String(title).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const cleanText = String(text).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

    const overlay = document.createElement('div');
    overlay.className = 'culture-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = '<div class="culture-card">'
      + '<h3>' + escapeHtml(icon) + ' ' + escapeHtml(cleanTitle) + '</h3>'
      + '<p>' + escapeHtml(cleanText) + '</p>'
      + '<div class="close-culture" onclick="this.closest(\'.culture-overlay\').remove()">Fermer \u2715</div>'
      + '</div>';
    document.body.appendChild(overlay);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function escapeAndLink(s) {
    if (!s) return '';
    return s.replace(/<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/g, (match, href, label) => {
      const safeHref = href.replace(/"/g, '&quot;');
      return `<a href="${safeHref}" target="_blank">${escapeHtml(label)}</a>`;
    }).replace(/<(?!\/a>)[^>]+>/g, '');
  }

  return { render, showCulture };
})();
;
/* ==== js/components/weather.js ==== */
/**
 * weather.js — Weather component (Open-Meteo API)
 * Inline weather box (in day header) + detailed modal (click to expand)
 * Ported from voyage-app
 */
var Weather = (() => {

  const WMO_ICONS = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌧️',55:'🌧️',61:'🌦️',63:'🌧️',65:'🌧️',71:'❄️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⚡',96:'⚡',99:'⚡'};
  const WMO_DESC = {0:'Ciel dégagé',1:'Peu nuageux',2:'Partiellement nuageux',3:'Couvert',45:'Brouillard',48:'Brouillard givrant',51:'Bruine légère',53:'Bruine',55:'Bruine forte',61:'Pluie légère',63:'Pluie',65:'Forte pluie',71:'Neige légère',73:'Neige',75:'Forte neige',80:'Averses légères',81:'Averses',82:'Averses violentes',95:'Orage',96:'Orage grêle',99:'Orage grêle forte'};

  /**
   * Open-Meteo covers today + 15 days = 16 calendar days inclusive.
   * Same cap as route-view (`Date.now() + 15 * 86400000`).
   * Day 16 (today+16) is out of range — do not fetch, do not paint 0°/Inconnu.
   */
  const FORECAST_MAX_DAYS = 16;
  const MSG_TOO_FAR = 'Météo pas encore dispo (prévisions 16j max)';
  const MSG_OFFLINE = 'Météo indisponible hors ligne';
  const MSG_ERROR = 'Météo indisponible';

  const cache = {};
  const detailCache = {};

  function mutedMsg(text) {
    return `<div style="text-align:center;color:var(--muted);font-size:.82em;padding:8px"><em>${text}</em></div>`;
  }

  /**
   * Resolve trip start date dynamically from Store.
   */
  function getTripStart() {
    const tripId = Store.getCurrentTripId();
    if (!tripId) return null;
    const tripData = Store.getTripData(tripId);
    if (tripData && tripData.trip && tripData.trip.startDate) {
      return new Date(tripData.trip.startDate + 'T00:00:00');
    }
    return null;
  }

  /**
   * Get ISO date string for a given day number.
   * Prefer DayHelpers._isoDate when present (UTC-safe).
   */
  function dayDate(dayNum, day) {
    if (day && day._isoDate) return day._isoDate;
    if (day && day.isoDate) return day.isoDate;
    // Primary: compute from trip start date
    // startDate = Day 1, so date = startDate + (dayNum - 1)
    const start = getTripStart();
    if (start) {
      const d = new Date(start);
      d.setDate(d.getDate() + dayNum - 1);
      return d.toISOString().split('T')[0];
    }
    // Last resort: today (weather for "today" is always available)
    return new Date().toISOString().split('T')[0];
  }

  /** Days from local today to isoDate (positive = future). */
  function daysFromToday(isoDate) {
    if (!isoDate) return 0;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const d = new Date(String(isoDate).slice(0, 10) + 'T12:00:00');
    if (isNaN(d.getTime())) return 0;
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  }

  function isBeyondForecast(isoDate) {
    return daysFromToday(isoDate) >= FORECAST_MAX_DAYS;
  }

  /** True when Open-Meteo returned a real daily slot, not nulls painted as 0°. */
  function dailySlotUsable(daily, i) {
    if (!daily || !Array.isArray(daily.time) || daily.time[i] == null) return false;
    const code = daily.weathercode && daily.weathercode[i];
    const tMin = daily.temperature_2m_min && daily.temperature_2m_min[i];
    const tMax = daily.temperature_2m_max && daily.temperature_2m_max[i];
    if (code == null || Number.isNaN(Number(code))) return false;
    if (tMin == null || tMax == null) return false;
    if (Number.isNaN(Number(tMin)) || Number.isNaN(Number(tMax))) return false;
    return true;
  }

  function paintUnavailable(container, msg) {
    container.innerHTML = mutedMsg(msg);
    container.style.cursor = 'default';
    container.onclick = null;
  }

  function isOutOfRangeReason(reason) {
    return /out of allowed range/i.test(String(reason || ''));
  }

  /**
   * Open-Meteo "errors" are not always HTTP 4xx:
   * - 400 `{error:true, reason:"... out of allowed range ..."}`
   * - 200 `{error:true, reason}` — treat the flag, ignore status
   * - 200 with daily.time set but weathercode/temps all `null` (last
   *   allowed day: the model accepts the date, then sends empty slots —
   *   that painted Inconnu / 0° / UV 0 on the Jour banner).
   * Returns a user message, or null if the daily slot is usable.
   */
  function forecastFailure(resp, data) {
    if (data && data.error) {
      return errorMessage(new Error(data.reason || 'API error'), data);
    }
    if (resp && !resp.ok) {
      return errorMessage(new Error((data && data.reason) || 'API error'), data);
    }
    if (!dailySlotUsable(data && data.daily, 0)) return MSG_TOO_FAR;
    return null;
  }

  /**
   * User-facing message for a failed weather fetch.
   * Too-far / API range ≠ offline.
   */
  function errorMessage(err, apiBody) {
    if (!navigator.onLine) return MSG_OFFLINE;
    const reason = (apiBody && apiBody.reason) || (err && err.message) || '';
    if (isOutOfRangeReason(reason) || (err && err.code === 'TOO_FAR')) return MSG_TOO_FAR;
    return MSG_ERROR;
  }

  /**
   * Fetch and render inline weather box for a day
   * @param {HTMLElement} container — element to render into
   * @param {object} day — day object with .geo, .day, .to, .from
   */
  async function renderInline(container, day) {
    if (!container || !day || !day.geo) return;

    // Offline: hide box (Jour stays clean — no error flash)
    if (!navigator.onLine) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    const dateStr = dayDate(day.day, day);
    const cacheKey = `${day.geo.lat},${day.geo.lon},${dateStr}`;

    // Beyond Open-Meteo window — don't pretend we're offline, don't paint 0°
    if (isBeyondForecast(dateStr)) {
      paintUnavailable(container, MSG_TOO_FAR);
      return;
    }

    // Show loading
    container.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:.85em;padding:8px">🌤️ Chargement météo…</div>';
    container.style.cursor = 'pointer';
    container.onclick = () => openModal(day);

    if (cache[cacheKey]) { container.innerHTML = cache[cacheKey]; return; }

    try {
      // Use backend centralized weather service (routes to correct provider per country)
      const country = (function() {
        const tripId = Store.getCurrentTripId();
        if (!tripId) return '';
        const td = Store.getTripData(tripId);
        return (td && td.trip && td.trip.country) || '';
      })();
      const tz = day.geo.tz || 'UTC';
      const url = (typeof API !== 'undefined' && API.isReachable())
        ? API.url(`/weather/forecast?lat=${day.geo.lat}&lon=${day.geo.lon}&country=${encodeURIComponent(country)}&days=1&date=${dateStr}&tz=${encodeURIComponent(tz)}`)
        : `https://api.open-meteo.com/v1/forecast?latitude=${day.geo.lat}&longitude=${day.geo.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,uv_index_max&timezone=${encodeURIComponent(tz)}&start_date=${dateStr}&end_date=${dateStr}`;

      const headers = {};
      if (url.includes('/weather/forecast') && typeof API !== 'undefined' && API.getToken) {
        headers['Authorization'] = 'Bearer ' + API.getToken();
      }
      const resp = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      let data = null;
      try { data = await resp.json(); } catch (_) { data = null; }

      // Check for failure (works with both backend and Open-Meteo responses)
      const fail = forecastFailure(resp, data);
      if (fail && !(data && data.days && data.days.length)) {
        paintUnavailable(container, fail);
        return;
      }

      // Normalize response: backend returns {days: [{...}]}, Open-Meteo returns {daily: {...}}
      let code, tMax, tMin, rain, wind, uv;
      if (data && data.days && data.days.length) {
        const d = data.days[0];
        code = d.weatherCode;
        tMax = Math.round(d.tempMax);
        tMin = Math.round(d.tempMin);
        rain = d.precipProbability || 0;
        wind = Math.round(d.windMaxKmh || 0);
        uv = d.uvMax ? Math.round(d.uvMax) : null;
      } else if (data && data.daily && dailySlotUsable(data.daily, 0)) {
        const daily = data.daily;
        code = daily.weathercode[0];
        tMax = Math.round(daily.temperature_2m_max[0]);
        tMin = Math.round(daily.temperature_2m_min[0]);
        rain = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
        wind = Math.round((daily.windspeed_10m_max && daily.windspeed_10m_max[0]) || 0);
        uv = daily.uv_index_max ? Math.round(daily.uv_index_max[0]) : null;
      } else {
        paintUnavailable(container, MSG_TOO_FAR);
        return;
      }

      const icon = WMO_ICONS[code] || '🌤️';
      const desc = WMO_DESC[code] || 'Inconnu';

      let html = `<div style="font-size:2em;margin:8px 0">${icon}</div>`;
      html += `<div style="font-size:1.1em;font-weight:600;color:var(--text)">${esc(desc)}</div>`;
      html += `<div style="margin:8px 0;font-size:1.2em">🌡️ <strong>${tMin}°</strong> → <strong>${tMax}°C</strong></div>`;
      html += `<div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap">`;
      if (rain > 0) html += `<span>🌧️ ${rain}%</span>`;
      html += `<span>💨 ${wind} km/h</span>`;
      if (uv !== null) html += `<span>${uv >= 8 ? '🔴' : uv >= 6 ? '🟠' : uv >= 3 ? '🟡' : '🟢'} UV ${uv}</span>`;
      html += `</div>`;
      html += `<div style="margin-top:6px;font-size:.72em;color:var(--muted)">📍 ${esc(day.to || day.from)} · Tap pour détails</div>`;

      cache[cacheKey] = html;
      container.innerHTML = html;
    } catch (e) {
      paintUnavailable(container, errorMessage(e));
    }
  }

  /**
   * Open detailed weather modal (hourly + 3-day + dress advice)
   */
  async function openModal(day) {
    if (!day || !day.geo) return;
    if (!navigator.onLine) return;

    const dateStr = dayDate(day.day, day);
    const tz = day.geo.tz || 'UTC';

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'weather-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="weather-modal">
      <button class="wm-close" onclick="this.closest('.weather-modal-overlay').remove()">✕</button>
      <div class="wm-title">🌤️ Météo — ${esc(day.dow || '')} ${esc(day.date || '')} · ${esc(day.to || day.from || '')}</div>
      <div id="wmContent" style="color:var(--muted);text-align:center;padding:20px 0">Chargement…</div>
    </div>`;
    document.body.appendChild(overlay);

    if (isBeyondForecast(dateStr)) {
      document.getElementById('wmContent').innerHTML = `<em>${MSG_TOO_FAR}</em>`;
      return;
    }

    const cacheKey = `detail_${day.geo.lat},${day.geo.lon},${dateStr}`;
    let data = detailCache[cacheKey];
    if (!data) {
      try {
        const start = getTripStart() || new Date();
        const end = new Date(start); end.setDate(start.getDate() + day.day - 1 + 2);
        const endStr = end.toISOString().split('T')[0];
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${day.geo.lat}&longitude=${day.geo.lon}&hourly=temperature_2m,weathercode,precipitation_probability,precipitation,apparent_temperature&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,uv_index_max,sunrise,sunset&current_weather=true&timezone=${encodeURIComponent(tz)}&start_date=${dateStr}&end_date=${endStr}`;
        const resp = await fetch(url);
        let body = null;
        try { body = await resp.json(); } catch (_) { body = null; }
        const fail = forecastFailure(resp, body);
        if (fail) {
          document.getElementById('wmContent').innerHTML = `<em>${fail}</em>`;
          return;
        }
        data = body;
        detailCache[cacheKey] = data;
      } catch (e) {
        document.getElementById('wmContent').innerHTML = `<em>${errorMessage(e)}</em>`;
        return;
      }
    }

    const daily = data.daily;
    const hourly = data.hourly;
    if (!dailySlotUsable(daily, 0)) {
      document.getElementById('wmContent').innerHTML = `<em>${MSG_TOO_FAR}</em>`;
      return;
    }

    const code = daily.weathercode[0];
    const icon = WMO_ICONS[code] || '🌤️';
    const desc = WMO_DESC[code] || '';
    const tMax = Math.round(daily.temperature_2m_max[0]);
    const tMin = Math.round(daily.temperature_2m_min[0]);
    const rain = daily.precipitation_probability_max[0] || 0;
    const wind = Math.round(daily.windspeed_10m_max[0] || 0);
    const uv = daily.uv_index_max ? Math.round(daily.uv_index_max[0]) : null;
    const sunrise = daily.sunrise ? daily.sunrise[0].split('T')[1] : null;
    const sunset = daily.sunset ? daily.sunset[0].split('T')[1] : null;

    // Hourly 6h-22h
    const hourlyStart = hourly.time.findIndex(t => t.startsWith(dateStr + 'T06'));
    const hourlyEnd = hourly.time.findIndex(t => t.startsWith(dateStr + 'T22'));
    const hLen = (hourlyStart >= 0 && hourlyEnd > hourlyStart) ? hourlyEnd - hourlyStart + 1 : 17;
    const hStart = hourlyStart >= 0 ? hourlyStart : hourly.time.findIndex(t => t.startsWith(dateStr));
    const hSlice = hStart >= 0 ? hourly.time.slice(hStart, hStart + hLen) : [];
    const hTemps = hStart >= 0 ? hourly.temperature_2m.slice(hStart, hStart + hLen) : [];
    const hCodes = hStart >= 0 ? hourly.weathercode.slice(hStart, hStart + hLen) : [];
    const hRain = hStart >= 0 ? hourly.precipitation_probability.slice(hStart, hStart + hLen) : [];
    const hPrecipMm = hStart >= 0 && hourly.precipitation ? hourly.precipitation.slice(hStart, hStart + hLen) : [];

    // Dress advice
    let dress = [];
    if (tMax >= 32) dress.push('☀️ Très chaud — crème solaire SPF50, hydratation ++');
    else if (tMax >= 25) dress.push('😎 Chaud — t-shirt, lunettes de soleil');
    else if (tMax >= 15) dress.push('🧥 Frais — une couche supplémentaire conseillée');
    else dress.push('🧣 Froid — veste chaude, couches multiples');
    if (rain >= 60) dress.push('🌂 Pluie probable — imperméable indispensable');
    else if (rain >= 30) dress.push('🌂 Risque de pluie — prévoir imperméable');
    if (uv && uv >= 8) dress.push('🔴 UV extrême ! Crème solaire, chapeau obligatoire');
    else if (uv && uv >= 6) dress.push('🟠 UV élevés — protection solaire recommandée');
    if (wind >= 40) dress.push('💨 Vent fort — attention aux parois');

    let html = `<div class="wm-current">
      <div class="wm-icon">${icon}</div>
      <div>
        <div class="wm-temps">${tMin}° → ${tMax}°C</div>
        <div class="wm-desc">${esc(desc)}</div>
      </div>
    </div>
    <div class="wm-grid">
      ${rain > 0 ? `<div class="wm-stat"><div class="ws-val">🌧️ ${rain}%</div><div class="ws-lbl">Précipitations</div></div>` : ''}
      <div class="wm-stat"><div class="ws-val">💨 ${wind}</div><div class="ws-lbl">km/h vent</div></div>
      ${uv !== null ? `<div class="wm-stat"><div class="ws-val">${uv >= 8 ? '🔴' : uv >= 6 ? '🟠' : uv >= 3 ? '🟡' : '🟢'} ${uv}</div><div class="ws-lbl">Indice UV</div></div>` : ''}
      ${sunrise ? `<div class="wm-stat"><div class="ws-val">🌅 ${sunrise}</div><div class="ws-lbl">Lever</div></div>` : ''}
      ${sunset ? `<div class="wm-stat"><div class="ws-val">🌇 ${sunset}</div><div class="ws-lbl">Coucher</div></div>` : ''}
    </div>`;

    // Hourly
    if (hSlice.length > 0) {
      html += `<div class="wm-section">🕐 Prévisions horaires</div><div class="wm-hourly">`;
      hSlice.forEach((t, i) => {
        const hour = t.split('T')[1]?.slice(0, 5) || '';
        const hIcon = WMO_ICONS[hCodes[i]] || '🌤️';
        const hTemp = Math.round(hTemps[i]);
        const hr = hRain[i] || 0;
        html += `<div class="wm-hour">
          <div class="wh-time">${hour}</div>
          <div class="wh-icon">${hIcon}</div>
          <div class="wh-temp">${hTemp}°</div>
          ${hr > 20 ? `<div class="wh-rain">${hr}%</div>` : ''}
        </div>`;
      });
      html += `</div>`;

      // Precipitation mm bars
      const hasRain = hPrecipMm.some(v => v > 0);
      if (hasRain) {
        html += `<div class="wm-section" style="margin-top:8px">🌧️ Précipitations (mm/h)</div><div class="wm-hourly">`;
        hSlice.forEach((t, i) => {
          const hour = t.split('T')[1]?.slice(0, 5) || '';
          const mm = hPrecipMm[i] || 0;
          const barH = Math.min(mm * 10, 40);
          const color = mm >= 5 ? '#e94560' : mm >= 1 ? '#f0a500' : '#4ecdc4';
          html += `<div class="wm-hour">
            <div class="wh-time">${hour}</div>
            <div style="height:40px;display:flex;align-items:flex-end;justify-content:center">
              <div style="width:14px;height:${barH}px;background:${color};border-radius:3px 3px 0 0;min-height:${mm > 0 ? 3 : 0}px"></div>
            </div>
            <div style="font-size:.7em;color:${color};font-weight:600">${mm > 0 ? mm.toFixed(1) : '-'}</div>
          </div>`;
        });
        html += `</div>`;
      }
    }

    // 3-day forecast
    if (daily.time.length > 1) {
      html += `<div class="wm-section">📅 Prévisions</div>`;
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      for (let di = 0; di < Math.min(3, daily.time.length); di++) {
        const dt = new Date(daily.time[di] + 'T12:00:00');
        const dCode = daily.weathercode[di];
        const dIcon = WMO_ICONS[dCode] || '🌤️';
        const dMax = Math.round(daily.temperature_2m_max[di]);
        const dMin = Math.round(daily.temperature_2m_min[di]);
        const dRain = daily.precipitation_probability_max[di] || 0;
        html += `<div class="wm-day">
          <div class="wd-icon">${dIcon}</div>
          <div class="wd-date">${dayNames[dt.getDay()]} ${daily.time[di].slice(8, 10)}/${daily.time[di].slice(5, 7)}${dRain > 30 ? ' 🌧️' + dRain + '%' : ''}</div>
          <div class="wd-temps">${dMin}° → ${dMax}°</div>
        </div>`;
      }
    }

    // Dress advice
    if (dress.length > 0) {
      html += `<div class="wm-section">👗 Quoi mettre</div>
      <div class="wm-dress">${dress.join('<br>')}</div>`;
    }

    document.getElementById('wmContent').innerHTML = html;
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { renderInline, openModal, isBeyondForecast, dailySlotUsable, forecastFailure, errorMessage, MSG_TOO_FAR, MSG_OFFLINE };
})();
;
/* ==== js/components/hotel-card.js ==== */
/**
 * hotel-card.js — Hotel card component
 * Renders rich hotel info: name, address, booking ref, amenities, links, WiFi, phone.
 *
 * Data model:
 * - Normalized: day.hotelId → tripData.hotels[hotelId]
 * - Legacy: day.hotel, day.hotelAddr, etc. (inline fields)
 * - fromDay() handles both formats
 */

var HotelCard = (() => {

  /**
   * Render a booking status badge.
   * @param {string} status — 'candidate', 'to_book', 'booked'
   * @returns {string} HTML badge or empty string
   */
  function renderStatusBadge(status) {
    if (!status) return '';
    let cls = 'badge-muted';
    let label = '';
    switch (status) {
      case 'candidate':
        cls = 'badge-muted';
        label = 'Candidat';
        break;
      case 'to_book':
        cls = 'badge-orange';
        label = 'À réserver';
        break;
      case 'booked':
        cls = 'badge-green';
        label = 'Réservé';
        break;
      default:
        return '';
    }
    return `<div class="booking-tags" style="margin:4px 0 6px"><span class="badge ${cls}">${label}</span></div>`;
  }

  /**
   * Un hôtel n'est « réservé » que si le statut le dit.
   * Nom + adresse (un candidat identifié) ne compte PAS. Construction compare
   * plusieurs `to_book` : leurs liens de recherche / booking doivent rester.
   *
   * Precedence: bookingStatus > booked boolean > bookingRef/confirmationNumber.
   */
  function isBooked(hotelData) {
    if (!hotelData) return false;
    const status = String(hotelData.bookingStatus || '').trim().toLowerCase();
    if (status === 'booked') return true;
    if (status === 'to_book' || status === 'candidate') return false;
    if (hotelData.booked === true) return true;
    if (hotelData.booked === false) return false;
    const ref = String(hotelData.bookingRef || hotelData.confirmationNumber || hotelData.ref || '').trim();
    return ref !== '';
  }

  function generateSearchLinks(dest, checkin, checkout, adults) {
    const enc = encodeURIComponent(String(dest || '').trim());
    if (!enc) return null;
    const a = adults || 2;
    const inD = checkin ? String(checkin).slice(0, 10) : '';
    const outD = checkout ? String(checkout).slice(0, 10) : '';
    const datesOk = inD && outD;
    return {
      airbnb: datesOk
        ? `https://www.airbnb.com/s/${enc}/homes?checkin=${inD}&checkout=${outD}&adults=${a}`
        : `https://www.airbnb.com/s/${enc}/homes?adults=${a}`,
      booking: datesOk
        ? `https://www.booking.com/searchresults.html?ss=${enc}&checkin=${inD}&checkout=${outD}&group_adults=${a}&no_rooms=1`
        : `https://www.booking.com/searchresults.html?ss=${enc}&group_adults=${a}&no_rooms=1`,
      hotelscom: datesOk
        ? `https://www.hotels.com/Hotel-Search?destination=${enc}&startDate=${inD}&endDate=${outD}&rooms=1&adults=${a}`
        : `https://www.hotels.com/Hotel-Search?destination=${enc}&rooms=1&adults=${a}`,
      kayak: datesOk
        ? `https://www.kayak.com/hotels/${enc}/${inD}/${outD}/${a}adults`
        : `https://www.kayak.com/hotels/${enc}`,
      expedia: datesOk
        ? `https://www.expedia.com/Hotel-Search?destination=${enc}&startDate=${inD}&endDate=${outD}&rooms=1&adults=${a}`
        : `https://www.expedia.com/Hotel-Search?destination=${enc}&rooms=1&adults=${a}`,
    };
  }

  function resolveSearchLinks(hotelData) {
    const sl = hotelData && hotelData.searchLinks;
    if (sl && typeof sl === 'object' && Object.keys(sl).some(k => sl[k])) return sl;
    const dest = (hotelData && (hotelData.addr || hotelData.address || hotelData.city || hotelData.name)) || '';
    const dates = (hotelData && hotelData.dates) || {};
    return generateSearchLinks(dest, dates.checkin, dates.checkout, hotelData && hotelData.adults);
  }

  /**
   * Render a hotel card.
   * @param {Object} hotelData — { name, addr, booking, ref, checkin, wifi, ... }
   * @returns {string} HTML string
   */
  function render(hotelData, opts) {
    const { compact = false } = opts || {};
    if (!hotelData || !hotelData.name) return '';

    const {
      name, note, addr, address, city, booking, ref, phone,
      checkin, checkout, extras, amenities = [],
      links = [], price, rooms, host, notes, access, wifi,
      cancellation, confirmationNumber, bookingStatus, bookingRef, bookingUrl,
    } = hotelData;

    const actualAddr = addr || address;
    const mapsUrl = actualAddr
      ? `https://www.google.com/maps/search/${encodeURIComponent(actualAddr)}`
      : null;

    const effectiveStatus = hotelData.bookingStatus
      || (isBooked(hotelData) ? 'booked' : (hotelData.booked === false ? 'to_book' : ''));
    const booked = isBooked(hotelData);

    let html = `<div class="hotel-card">`;
    html += `<div class="hotel-name">\ud83c\udfe8 ${esc(name)}</div>`;

    if (effectiveStatus) {
      const statusBadge = renderStatusBadge(effectiveStatus);
      if (statusBadge) html += statusBadge;
    }

    html += `<div class="hotel-meta">`;

    if (city && !actualAddr) html += `<div>\ud83d\udccd ${esc(city)}</div>`;
    if (note) html += `<div>${esc(note)}</div>`;

    if (!actualAddr) {
      html += `<div class="hotel-addr-missing">⚠️ Pas d'adresse — ajoutez <code>hotels[].addr</code>. Le check nuisances cherchera le nom et affichera le point trouvé (à vérifier).</div>`;
    }

    if (actualAddr) {
      const addrHtml = mapsUrl
        ? `<a href="${escAttr(mapsUrl)}" target="_blank">${esc(actualAddr)}</a>`
        : esc(actualAddr);
      html += `<div>\ud83d\udccd ${addrHtml}</div>`;
    }

    if (booking || ref || confirmationNumber) {
      html += `<div>`;
      if (booking) html += `<strong>${esc(booking)}</strong>`;
      const refVal = confirmationNumber || ref;
      if (booking && refVal) html += ` \u00b7 `;
      if (refVal) html += `R\u00e9f: <strong>${esc(refVal)}</strong>`;
      html += `</div>`;
    }

    if (bookingUrl) {
      const bookLabel = booked ? 'Voir la réservation' : 'Réserver';
      html += `<div><a href="${escAttr(bookingUrl)}" target="_blank" class="hotel-link-btn hotel-booking-url" style="display:inline-flex;align-items:center;gap:4px;margin-top:4px">\ud83d\udd17 ${esc(bookLabel)}</a></div>`;
    }

    if (checkin || checkout) {
      html += `<div>`;
      if (checkin)  html += `\ud83d\udd11 Check-in: <strong>${esc(checkin)}</strong>`;
      if (checkin && checkout) html += ` &nbsp; `;
      if (checkout) html += `\ud83d\udeaa Check-out: <strong>${esc(checkout)}</strong>`;
      html += `</div>`;
    }

    if (price) html += `<div>\ud83d\udcb6 ${esc(price)}</div>`;
    if (rooms && rooms.detail) html += `<div>\ud83d\udecf\ufe0f ${esc(rooms.detail)}</div>`;
    if (phone) html += `<div>\ud83d\udcde <a href="tel:${escAttr(phone)}">${esc(phone)}</a></div>`;
    if (extras) html += `<div style="margin-top:5px;font-size:.78em;color:var(--orange)">\u2139\ufe0f ${esc(extras)}</div>`;
    if (access) html += `<div style="margin-top:5px;font-size:.82em;font-weight:600">${esc(access)}</div>`;
    if (host && host.bio) html += `<div style="margin-top:4px;font-size:.78em">\ud83c\udfe0 ${esc(host.bio)}</div>`;
    if (notes && notes !== note) html += `<div style="margin-top:4px;font-size:.78em;font-style:italic;color:var(--muted)">${esc(notes)}</div>`;
    html += `</div>`; // .hotel-meta

    // Tags: cancellation (🟢🔴⚠️) + amenities — same chip language as Résa
    const amenityList = Array.isArray(amenities) ? amenities : amenities ? [amenities] : [];
    const tagChips = [];
    if (cancellation) {
      const raw = String(cancellation).trim();
      let cls = 'badge-muted';
      let label = 'Annulation';
      if (raw.startsWith('🟢')) { cls = 'badge-green'; label = '🟢 Flexible'; }
      else if (raw.startsWith('🔴')) { cls = 'badge-red'; label = '🔴 Non remboursable'; }
      else if (raw.startsWith('⚠️') || raw.startsWith('⚠')) { cls = 'badge-orange'; label = '⚠️ À vérifier'; }
      tagChips.push(`<span class="badge ${cls}" title="${escAttr(raw)}">${label}</span>`);
    }
    amenityList.forEach(a => { tagChips.push(`<span class="badge badge-green">${esc(a)}</span>`); });
    if (tagChips.length) {
      html += `<div class="booking-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${tagChips.join('')}</div>`;
    }

    // ── Ligne obligatoire : petit-déj, piscine, spa, parking ──
    const mandatoryItems = [];
    if (hotelData.breakfast !== undefined && hotelData.breakfast !== null) {
      const val = String(hotelData.breakfast);
      const icon = val.startsWith('oui') ? '✅' : val === 'non' ? '❌' : '❓';
      mandatoryItems.push(`${icon} Petit-déj`);
    }
    if (hotelData.pool !== undefined && hotelData.pool !== null) {
      const val = String(hotelData.pool);
      const icon = val.startsWith('oui') ? '✅' : val === 'non' ? '❌' : '❓';
      mandatoryItems.push(`${icon} Piscine`);
    }
    if (hotelData.spa !== undefined && hotelData.spa !== null) {
      const val = String(hotelData.spa);
      const icon = val.startsWith('oui') ? '✅' : val === 'non' ? '❌' : '❓';
      mandatoryItems.push(`${icon} Spa`);
    }
    if (hotelData.parking !== undefined && hotelData.parking !== null) {
      const val = String(hotelData.parking);
      const hasParking = val !== 'non';
      const icon = hasParking ? '✅' : '❌';
      const label = hasParking && val !== 'oui' && val !== 'gratuit' && val !== '?'
        ? `Parking (${hotelData.parking})`
        : val === 'gratuit' ? 'Parking gratuit' : val === '?' ? '❓ Parking' : '✅ Parking';
      mandatoryItems.push(label);
    }
    if (mandatoryItems.length) {
      html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.08);font-size:.82em">`;
      mandatoryItems.forEach((item, i) => {
        html += `<span style="color:var(--muted)">${esc(item)}</span>`;
        if (i < mandatoryItems.length - 1) html += `<span style="color:rgba(255,255,255,.15)"> | </span>`;
      });
      html += `</div>`;
    }

    // Hotel access codes (yellow warning box)
    if (access) {
      html += `<div style="margin-top:8px;padding:10px 12px;background:rgba(255,193,7,.12);border:1px solid rgba(255,193,7,.25);border-radius:8px;font-size:.82em;color:#ffc107;line-height:1.5">\ud83d\udd11 ${esc(access)}</div>`;
    }

    // WiFi Connect
    if (wifi && wifi.ssid && !compact) {
      var ssid = esc(wifi.ssid);
      var pass = esc(wifi.pass || '');
      var rawPass = String(wifi.pass || '').replace(/'/g, "\\'");
      var rawSsid = String(wifi.ssid).replace(/'/g, "\\'");
      html += '<div style="margin-top:8px;padding:12px;background:rgba(78,205,196,.08);border:1px solid rgba(78,205,196,.25);border-radius:10px">';
      html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">';
      html += '<span style="font-size:1.3em">\ud83d\udcf6</span>';
      html += '<div><div style="font-size:.9em;font-weight:700;color:var(--sec)">' + ssid + '</div>';
      html += '<div style="font-size:.72em;color:var(--muted)">WiFi h\u00e9bergement</div></div></div>';
      html += '<button onclick="HotelCard.wifiConnect(\'' + rawSsid + '\',\'' + rawPass + '\')" style="width:100%;padding:10px 14px;background:var(--sec);color:#000;border:none;border-radius:8px;font-size:.88em;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">\ud83d\udd17 Copier le mot de passe</button>';
      html += '<div style="margin-top:8px;font-size:.75em;color:var(--muted)">mdp : <code style="color:var(--text);background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px;user-select:all">' + pass + '</code>';
      html += ' <button onclick="navigator.clipboard.writeText(\'' + rawPass + '\');this.textContent=\'\u2705\';setTimeout(()=>this.textContent=\'\ud83d\udccb\',1500)" style="background:none;border:none;font-size:1em;cursor:pointer;padding:0">\ud83d\udccb</button></div>';
      // QR code
      var _wifiQR = 'WIFI:T:WPA;S:' + wifi.ssid + ';P:' + (wifi.pass || '') + ';;';
      var _qrId = 'wifi-qr-' + wifi.ssid.replace(/\W/g, '') + '-' + Math.random().toString(36).slice(2, 8);
      html += '<div id="' + _qrId + '" style="margin-top:10px;text-align:center"></div>';
      html += '<div style="margin-top:6px;font-size:.68em;color:var(--muted)">\ud83d\udcf1 Scannez le QR ou copiez le mdp \u2192 R\u00e9glages \u2192 WiFi</div>';
      html += '</div>';
      // Defer QR rendering after DOM
      (function(qrStr, elId) {
        setTimeout(function() {
          var qrEl = document.getElementById(elId);
          if (qrEl && !qrEl.hasChildNodes() && typeof QRCode === 'function') {
            try {
              var svg = QRCode({ msg: qrStr, dim: 160, pad: 2, pal: ['#4ecdc4', '#16213e'] });
              qrEl.appendChild(svg);
            } catch(e) {}
          }
        }, 50);
      })(_wifiQR, _qrId);
    }

    // Search + book platform links: keep them for every hotel that is NOT
    // booked. A to_book / candidate with a name and an address is still to
    // book — that is the whole point of construction alternatives.
    const sl = !booked ? resolveSearchLinks(hotelData) : null;
    if (sl) {
      const dates = hotelData.dates || {};
      const nightsLabel = dates.nights ? `${dates.nights} nuit${dates.nights > 1 ? 's' : ''}` : '';
      const dateLabel = dates.checkin && dates.checkout
        ? `${dates.checkin.slice(5)} → ${dates.checkout.slice(5)}`
        : '';
      html += `<div class="hotel-search-links" style="margin-top:10px;padding:12px;background:rgba(255,193,7,.08);border:1px solid rgba(255,193,7,.2);border-radius:10px">`;
      html += `<div style="font-size:.82em;font-weight:700;color:#ffc107;margin-bottom:8px">`;
      html += `🔍 Chercher un hébergement`;
      if (dateLabel) html += ` <span style="font-weight:400;color:var(--muted)">(${esc(nightsLabel)}, ${esc(dateLabel)})</span>`;
      html += `</div>`;
      html += `<div style="display:flex;flex-wrap:wrap;gap:6px">`;
      if (sl.airbnb) html += `<a href="${escAttr(sl.airbnb)}" target="_blank" class="hotel-link-btn" style="background:rgba(255,88,93,.15);border-color:rgba(255,88,93,.3);color:#ff585d">🏠 Airbnb</a>`;
      if (sl.booking) html += `<a href="${escAttr(sl.booking)}" target="_blank" class="hotel-link-btn" style="background:rgba(0,53,128,.15);border-color:rgba(0,53,128,.3);color:#4a9fd5">🏨 Booking</a>`;
      if (sl.hotelscom) html += `<a href="${escAttr(sl.hotelscom)}" target="_blank" class="hotel-link-btn" style="background:rgba(214,0,28,.1);border-color:rgba(214,0,28,.2);color:#d6001c">🏨 Hotels.com</a>`;
      if (sl.kayak) html += `<a href="${escAttr(sl.kayak)}" target="_blank" class="hotel-link-btn" style="background:rgba(255,94,0,.12);border-color:rgba(255,94,0,.25);color:#ff5e00">🔍 Kayak</a>`;
      if (sl.expedia) html += `<a href="${escAttr(sl.expedia)}" target="_blank" class="hotel-link-btn" style="background:rgba(255,204,0,.12);border-color:rgba(255,204,0,.25);color:#ffc107">✈️ Expedia</a>`;
      if (sl.terroirSaveurs) html += `<a href="${escAttr(sl.terroirSaveurs)}" target="_blank" class="hotel-link-btn" style="background:rgba(76,175,80,.12);border-color:rgba(76,175,80,.25);color:#4caf50">🧀 Terroir & Saveurs</a>`;
      html += `</div></div>`;
    }

    const altList = Array.isArray(hotelData.alternatives) ? hotelData.alternatives.filter(a => a && a.name) : [];
    if (!booked && altList.length) {
      html += `<div class="hotel-alternatives" style="margin-top:10px">`;
      html += `<div style="font-size:.82em;font-weight:700;color:var(--muted);margin-bottom:6px">Autres options</div>`;
      altList.forEach(alt => {
        html += render({
          ...alt,
          bookingStatus: alt.bookingStatus || 'to_book',
          booked: false,
          alternatives: [],
          searchLinks: alt.searchLinks,
          bookingUrl: alt.bookingUrl || alt.url,
        }, { compact: true });
      });
      html += `</div>`;
    }

    // Links
    const allLinks = [...(Array.isArray(links) ? links : [])];
    if (mapsUrl && !allLinks.find(l => l.url && l.url.includes('maps'))) {
      allLinks.unshift({ label: '\ud83d\uddfa\ufe0f Google Maps', url: mapsUrl });
    }
    if (allLinks.length || actualAddr) {
      html += `<div class="hotel-links">`;
      allLinks.forEach(link => {
        if (!link.url) return;
        html += `<a href="${escAttr(link.url)}" class="hotel-link-btn" target="_blank">${esc(link.label || link.url)}</a>`;
      });
      // CarPlay button
      if (actualAddr) {
        html += `<a href="${escAttr('comgooglemaps://?q=' + encodeURIComponent(actualAddr))}" class="hotel-link-btn">\ud83d\ude97 CarPlay</a>`;
        html += `<a href="${escAttr('maps://maps.apple.com/?daddr=' + encodeURIComponent(actualAddr) + '&dirflg=d')}" class="hotel-link-btn">\ud83c\udf4e Apple Maps</a>`;
      }
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Copy WiFi password to clipboard and show toast.
   */
  function wifiConnect(ssid, pass) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pass).then(() => {
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('\u2705 Mot de passe ' + ssid + ' copi\u00e9 !');
        }
      }).catch(() => {
        // Fallback: prompt
        prompt('Mot de passe WiFi ' + ssid + ' :', pass);
      });
    } else {
      prompt('Mot de passe WiFi ' + ssid + ' :', pass);
    }
  }

  /**
   * Resolve hotel data from a day + hotels dict.
   * Supports both normalized (hotelId → hotels[id]) and legacy (inline fields).
   * @param {Object} day
   * @param {Object} [hotelsDict] — tripData.hotels
   * @returns {Object|null} hotel data for render()
   */
  function fromDay(day, hotelsDict) {
    if (!day) return null;

    // Normalized: day has hotelId, resolve from dict
    if (day.hotelId && hotelsDict && hotelsDict[day.hotelId]) {
      const hotel = hotelsDict[day.hotelId];
      // Merge wifi from day if not in hotel dict
      if (!hotel.wifi && (day.hotelWifi || day.wifi)) {
        hotel.wifi = day.hotelWifi || day.wifi;
      }
      return hotel;
    }

    // Legacy: inline fields
    const name = day.hotel;
    if (!name || name === '\u2014' || name === '' || name === '-') return null;

    const rawAmenities = day.hotelAmenities;
    return {
      name,
      note:     day.hotelNote     || null,
      addr:     day.hotelAddr     || null,
      booking:  day.hotelBooking  || null,
      ref:      day.hotelRef      || null,
      phone:    day.hotelPhone    || null,
      checkin:  day.hotelCheckin  || null,
      checkout: day.hotelCheckout || null,
      extras:   day.hotelExtras   || null,
      price:    day.hotelPrice    || null,
      access:   day.hotelAccess   || null,
      wifi:     day.hotelWifi     || day.wifi || null,
      amenities: rawAmenities ? (Array.isArray(rawAmenities) ? rawAmenities : [rawAmenities]) : [],
      links:    day.hotelLinks    || [],
    };
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escAttr(s) {
    return String(s || '').replace(/"/g,'&quot;');
  }

  return { render, fromDay, wifiConnect, renderStatusBadge, isBooked, generateSearchLinks };
})();
;
/* ==== js/components/bookings-view.js ==== */
/**
 * bookings-view.js — Onglet Résa : vols, voiture, ferry, events, hôtels.
 * Documents voyageurs → onglet Plus (section repliable).
 *
 * Tags: same language as hotel amenities — `.badge` chips + cancellation 🟢🔴⚠️.
 */

var BookingsView = (() => {

  const _hotelNuisanceAborts = new Map();

  function abortHotelNuisanceStreams() {
    _hotelNuisanceAborts.forEach(ac => { try { ac.abort(); } catch (_) { /* déjà terminé */ } });
    _hotelNuisanceAborts.clear();
    if (typeof NuisanceStream !== 'undefined' && NuisanceStream.stopFollow) {
      NuisanceStream.stopFollow();
    }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z');
    if (isNaN(d)) return esc(iso);
    const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
    return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
  }

  function formatDateTime(iso) {
    if (!iso) return '';
    const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (m) return formatDate(m[1]) + ' · ' + m[2];
    return formatDate(iso);
  }

  /** Parse leading 🟢🔴⚠️ from cancellation → badge class + short label. */
  function cancellationBadge(cancellation) {
    if (!cancellation) return '';
    const raw = String(cancellation).trim();
    let cls = 'badge-orange';
    let label = '⚠️ À vérifier';
    if (raw.startsWith('🟢')) {
      cls = 'badge-green';
      label = '🟢 Flexible';
    } else if (raw.startsWith('🔴')) {
      cls = 'badge-red';
      label = '🔴 Non remboursable';
    } else if (raw.startsWith('⚠️') || raw.startsWith('⚠')) {
      cls = 'badge-orange';
      label = '⚠️ À vérifier';
    } else {
      // No emoji prefix — still show a muted chip, full text in details
      cls = 'badge-muted';
      label = 'Annulation';
    }
    return `<span class="badge ${cls}" title="${esc(raw)}">${label}</span>`;
  }

  /**
   * Type chip + cancellation + tags[] (+ optional derived).
   * @param {{ typeLabel: string, cancellation?: string, tags?: string[]|string, derived?: string[] }}
   */
  function renderBookingTags({ typeLabel, cancellation, tags, derived }) {
    const chips = [];
    if (typeLabel) chips.push(`<span class="badge badge-accent">${esc(typeLabel)}</span>`);
    const cancelChip = cancellationBadge(cancellation);
    if (cancelChip) chips.push(cancelChip);

    const list = Array.isArray(tags) ? tags : tags ? [tags] : [];
    list.forEach(t => {
      if (t) chips.push(`<span class="badge badge-green">${esc(t)}</span>`);
    });
    (derived || []).forEach(t => {
      if (t) chips.push(`<span class="badge badge-green">${esc(t)}</span>`);
    });

    if (!chips.length) return '';
    return `<div class="booking-tags">${chips.join('')}</div>`;
  }

  function bookingCard({ icon, title, metaLines, tagsHtml, detailsHtml }) {
    let html = `<div class="booking-card">`;
    html += `<div class="booking-header">`;
    html += `<span class="booking-icon">${icon || '📋'}</span>`;
    html += `<span class="booking-title">${esc(title)}</span>`;
    html += `</div>`;
    if (metaLines && metaLines.length) {
      html += `<div class="booking-meta">`;
      metaLines.forEach(line => { if (line) html += `<div>${line}</div>`; });
      html += `</div>`;
    }
    if (tagsHtml) html += tagsHtml;
    if (detailsHtml) html += `<div class="booking-details">${detailsHtml}</div>`;
    html += `</div>`;
    return html;
  }

  function sectionTitle(emoji, label) {
    return `<div class="booking-section-title">${emoji} ${esc(label)}</div>`;
  }

  // ── Sections ─────────────────────────────────────────────────────────────

  /** True when a flight leg has real booking data (not seed placeholders like n/a). */
  function isRealFlightLeg(leg) {
    if (!leg || typeof leg !== 'object') return false;
    const na = (v) => {
      const s = String(v == null ? '' : v).trim().toLowerCase();
      return !s || s === 'n/a' || s === 'na' || s === '-' || s === '?';
    };
    const segs = Array.isArray(leg.segments) ? leg.segments : [];
    if (segs.length > 0) {
      return segs.some(s => s && !na(s.from) && !na(s.to) && !na(s.dep));
    }
    // Flat leg: need a real route + departure (ignore airline/pnr = "n/a")
    if (!na(leg.from) && !na(leg.to) && !na(leg.dep)) return true;
    if (!na(leg.dep) && !na(leg.flight) && !na(leg.airline)) return true;
    return false;
  }

  /** Count traveler documents for Plus header badge. */
  function countDocuments(tripData) {
    if (typeof PeopleHelpers === 'undefined') return 0;
    let n = 0;
    PeopleHelpers.withDocuments(tripData).forEach((person) => {
      (person.documents || []).forEach((doc) => {
        if (doc && typeof doc === 'object') n++;
      });
    });
    return n;
  }

  /** Document booking cards (shared body for Plus collapse). */
  function renderDocumentsCards(tripData) {
    if (typeof PeopleHelpers === 'undefined') return '';
    const folks = PeopleHelpers.withDocuments(tripData);
    if (!folks.length) return '';

    let html = '';
    folks.forEach((person) => {
      (person.documents || []).forEach((doc) => {
        if (!doc || typeof doc !== 'object') return;
        const meta = [];
        if (doc.number) meta.push(`🔖 ${esc(doc.number)}`);
        if (doc.passport) meta.push(`🛂 Passeport ${esc(doc.passport)}`);
        if (doc.expiry || doc.passportExpiry) {
          meta.push(`📅 Exp. ${formatDate(doc.expiry || doc.passportExpiry)}`);
        }
        if (doc.approved) meta.push(`✅ Approuvé ${formatDate(doc.approved)}`);
        if (doc.caseRef) meta.push(`📁 Dossier ${esc(doc.caseRef)}`);

        let details = '';
        if (doc.fullName) details += `<div>👤 ${esc(doc.fullName)}</div>`;
        if (doc.note) details += `<div class="booking-note">${esc(doc.note)}</div>`;
        if (Array.isArray(person.loyalty) && person.loyalty.length && doc.type === 'passport') {
          person.loyalty.forEach((L) => {
            if (L && L.program) {
              details += `<div>✈️ ${esc(L.program)}${L.number ? ' · ' + esc(L.number) : ''}</div>`;
            }
          });
        }

        html += bookingCard({
          icon: doc.type === 'eta-canada' ? '🇨🇦' : (doc.type === 'esta-usa' ? '🇺🇸' : '🛂'),
          title: `${person.emoji || ''} ${esc(person.name || '')} — ${esc(doc.label || doc.type || 'Document')}`.trim(),
          metaLines: meta,
          tagsHtml: renderBookingTags({
            typeLabel: doc.type === 'eta-canada' ? 'AVE' : (doc.type === 'esta-usa' ? 'ESTA' : 'Document'),
            cancellation: doc.note && /🔴|⚠️/.test(doc.note) ? doc.note : null,
            tags: doc.tags,
          }),
          detailsHtml: details,
        });
      });
    });
    return html;
  }

  /**
   * Plus tab: Documents collapsed by default (click header to expand).
   * Empty when no traveler docs on this trip.
   */
  function renderDocumentsCollapsed(tripData) {
    const cards = renderDocumentsCards(tripData);
    if (!cards) return '';
    const n = countDocuments(tripData);
    // Same rhythm as Listes / Voyage actif: section title is the click target.
    return `<div class="section-wrap plus-docs-wrap" id="plus-docs-wrap" style="margin-top:24px;border:none;background:transparent">
        <div class="section-head collapsed plus-docs-head" id="plus-docs-head" role="button" tabindex="0"
          aria-expanded="false" aria-controls="plus-docs-body">
          <span class="s-emoji">🛂</span>
          <span class="s-title">Documents</span>
          <span class="s-count">${n}</span>
          <span class="s-chevron">▼</span>
        </div>
        <div class="section-body hidden plus-docs-body" id="plus-docs-body">${cards}</div>
      </div>`;
  }

  function bindDocumentsCollapse(root) {
    const head = (root || document).querySelector('#plus-docs-head');
    const body = (root || document).querySelector('#plus-docs-body');
    if (!head || !body || head.dataset.bound === '1') return;
    head.dataset.bound = '1';
    const toggle = () => {
      const open = body.classList.toggle('hidden') === false;
      head.classList.toggle('collapsed', !open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    head.addEventListener('click', toggle);
    head.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  }

  function renderFlightsSection(flights) {
    if (!flights) return '';
    const outbound = flights.outbound || flights.aller;
    const inbound = flights.inbound || flights.return || flights.retour;
    const outOk = isRealFlightLeg(outbound);
    const inOk = isRealFlightLeg(inbound);
    if (!outOk && !inOk) return '';

    let html = sectionTitle('✈️', 'Transport principal');

    const effectiveFlightStatus = flights.bookingStatus || (flights.bookingRef ? 'booked' : '');
    if (effectiveFlightStatus && typeof HotelCard !== 'undefined') {
      html += HotelCard.renderStatusBadge(effectiveFlightStatus);
    }
    if (flights.bookingUrl) {
      html += `<div style="margin:0 0 8px 12px"><a href="${esc(flights.bookingUrl)}" target="_blank" class="hotel-link-btn" style="display:inline-flex;align-items:center;gap:4px">🔗 Agence / Compagnie</a></div>`;
    }
    if (flights.bookingRef && !effectiveFlightStatus) {
      html += `<div style="margin:0 0 8px 12px">🔖 Ref: <strong>${esc(flights.bookingRef)}</strong></div>`;
    }

    function flightCard(leg, label) {
      if (!isRealFlightLeg(leg)) return '';
      const segs = Array.isArray(leg.segments) ? leg.segments : null;
      let route = '';
      let when = '';
      if (segs && segs.length) {
        route = segs[0].from + ' → ' + segs[segs.length - 1].to;
        when = formatDateTime(segs[0].dep);
      } else {
        route = (leg.from || '') + (leg.to ? ' → ' + leg.to : '');
        when = formatDateTime(leg.dep);
      }
      const meta = [];
      if (when) meta.push(`📅 ${when}`);
      if (leg.pnr) meta.push(`🔖 PNR: <strong>${esc(leg.pnr)}</strong>`);
      if (leg.price) meta.push(`💶 ${esc(leg.price)}`);
      if (leg.airline) meta.push(`✈️ ${esc(leg.airline)}${leg.class ? ' · ' + esc(leg.class) : ''}`);

      const legStatus = leg.bookingStatus || (leg.bookingRef ? 'booked' : '');

      let details = '';
      if (legStatus && typeof HotelCard !== 'undefined') {
        details += HotelCard.renderStatusBadge(legStatus);
      }
      if (leg.bookingUrl) {
        details += `<div><a href="${esc(leg.bookingUrl)}" target="_blank" class="hotel-link-btn" style="display:inline-flex;align-items:center;gap:4px;margin-top:4px">🔗 Réserver</a></div>`;
      }

      if (segs && segs.length) {
        details += segs.map(s =>
          `<div>${esc(s.flight || '')} ${esc(s.from)}→${esc(s.to)} · ${esc(formatDateTime(s.dep))} → ${esc(formatDateTime(s.arr))}${s.duration ? ' (' + esc(s.duration) + ')' : ''}</div>`
        ).join('');
      } else if (leg.arr) {
        details += `<div>🛬 Arrivée: ${esc(formatDateTime(leg.arr))}${leg.duration ? ' (' + esc(leg.duration) + ')' : ''}</div>`;
      }
      if (leg.layover) details += `<div>🔁 Escales: ${esc(leg.layover)}</div>`;
      if (leg.note) details += `<div class="booking-note">${esc(leg.note)}</div>`;
      if (leg.cancellation) details += `<div class="booking-note">${esc(leg.cancellation)}</div>`;

      return bookingCard({
        icon: '✈️',
        title: `${label}${route ? ' — ' + route : ''}`,
        metaLines: meta,
        tagsHtml: renderBookingTags({
          typeLabel: 'Vol',
          cancellation: leg.cancellation,
          tags: leg.tags,
        }),
        detailsHtml: details,
      });
    }

    if (outOk) html += flightCard(outbound, 'Vol aller');
    if (inOk) html += flightCard(inbound, 'Vol retour');
    return html;
  }

  function renderCarRentalSection(car) {
    if (!car) return '';
    let html = sectionTitle('🚗', 'Location de voiture');

    const effectiveStatus = car.bookingStatus || (car.bookingRef ? 'booked' : '');

    const pickup = car.pickup || {};
    const ret = car.return || {};
    const meta = [];
    if (pickup.date || ret.date) {
      meta.push(`📅 ${formatDate(pickup.date)}${pickup.time ? ' ' + esc(pickup.time) : ''} → ${formatDate(ret.date)}${ret.time ? ' ' + esc(ret.time) : ''}`);
    }
    if (car.bookingRef) meta.push(`🔖 Réf: <strong>${esc(car.bookingRef)}</strong>`);
    if (car.avisRef) meta.push(`Avis #${esc(car.avisRef)}`);
    if (car.price) meta.push(`💶 ${esc(car.price)}`);
    if (car.vehicle) meta.push(`🚙 ${esc(car.vehicle)}`);

    const derived = [];
    if (car.fuelPolicy && /plein/i.test(car.fuelPolicy)) derived.push('Plein fait');
    if (car.mileage && /illimit/i.test(car.mileage)) derived.push('Km illimité');

    const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    let details = '';

    if (effectiveStatus && typeof HotelCard !== 'undefined') {
      details += HotelCard.renderStatusBadge(effectiveStatus);
    }
    if (car.bookingUrl) {
      details += `<div><a href="${esc(car.bookingUrl)}" target="_blank" class="hotel-link-btn" style="display:inline-flex;align-items:center;gap:4px;margin-bottom:6px">🔗 Agence</a></div>`;
    }

    if (pickup.agency || pickup.address) {
      const addr = pickup.address || '';
      details += `<div>📍 Prise: ${esc(pickup.agency || '')}${addr ? ' — ' + esc(addr) + ' <a href="' + mapsUrl(addr) + '" target="_blank" class="hotel-link-btn">📍 Maps</a>' : ''}</div>`;
    }
    if (ret.agency || ret.address) {
      const addr = ret.address || '';
      details += `<div>📍 Retour: ${esc(ret.agency || '')}${addr ? ' — ' + esc(addr) + ' <a href="' + mapsUrl(addr) + '" target="_blank" class="hotel-link-btn">📍 Maps</a>' : ''}</div>`;
    }
    if (car.driver) details += `<div>👤 ${esc(car.driver)}</div>`;
    if (car.documents) details += `<div>📋 ${esc(car.documents)}</div>`;
    if (car.cancellation) details += `<div class="booking-note">${esc(car.cancellation)}</div>`;
    if (car.notes) details += `<div class="booking-note">${esc(car.notes)}</div>`;

    html += bookingCard({
      icon: '🚗',
      title: (car.provider || 'Location') + (car.vehicle ? ' — ' + car.vehicle : ''),
      metaLines: meta,
      tagsHtml: renderBookingTags({
        typeLabel: 'Voiture',
        cancellation: car.cancellation,
        tags: car.tags,
        derived,
      }),
      detailsHtml: details,
    });
    return html;
  }

  function renderFerrySection(ferryOrList) {
    const list = Array.isArray(ferryOrList)
      ? ferryOrList
      : (ferryOrList ? [ferryOrList] : []);
    if (!list.length) return '';

    let html = sectionTitle('⛴️', list.length > 1 ? 'Ferrys / Traversées' : 'Ferry / Traversier');

    list.forEach((ferry) => {
      if (!ferry || typeof ferry !== 'object') return;
      const meta = [];
      if (ferry.date) meta.push(`📅 ${formatDate(ferry.date)}${ferry.time ? ' · ' + esc(ferry.time) : ''}`);
      if (ferry.arrDate || ferry.arr) {
        meta.push(`🛬 ${formatDate(ferry.arrDate || ferry.arr)}${ferry.arrTime ? ' · ' + esc(ferry.arrTime) : ''}`);
      }
      if (ferry.orderRef) meta.push(`🔖 #${esc(ferry.orderRef)}`);
      if (ferry.total) meta.push(`💶 ${esc(ferry.total)}`);
      if (ferry.operator) meta.push(`⛴️ ${esc(ferry.operator)}`);
      if (ferry.vehicle) meta.push(`🚙 ${esc(ferry.vehicle)}`);

      const derived = [];
      if (ferry.balance) derived.push('Solde au quai');
      if (ferry.cabin) derived.push('Cabine');

      let details = '';
      if (ferry.deposit) details += `<div>💳 Acompte: ${esc(ferry.deposit)}</div>`;
      if (ferry.balance) details += `<div>💰 Solde: ${esc(ferry.balance)}</div>`;
      if (ferry.cabin) details += `<div>🛏️ ${esc(ferry.cabin)}</div>`;
      if (ferry.note) details += `<div class="booking-note">${esc(ferry.note)}</div>`;
      if (ferry.cancellation) details += `<div class="booking-note">${esc(ferry.cancellation)}</div>`;

      html += bookingCard({
        icon: '⛴️',
        title: ferry.route || ferry.operator || 'Ferry',
        metaLines: meta,
        tagsHtml: renderBookingTags({
          typeLabel: 'Ferry',
          cancellation: ferry.cancellation,
          tags: ferry.tags,
          derived,
        }),
        detailsHtml: details,
      });
    });
    return html;
  }

  function renderEventsSection(events) {
    if (!events || typeof events !== 'object') return '';
    const entries = Object.entries(events).filter(([, e]) => e && e.name);
    if (!entries.length) return '';

    entries.sort(([, a], [, b]) => String(a.date || '').localeCompare(String(b.date || '')));

    let html = sectionTitle('🎪', 'Événements');
    entries.forEach(([, evt]) => {
      const meta = [];
      if (evt.date) meta.push(`📅 ${formatDate(evt.date)}${evt.time ? ' · ' + esc(evt.time) : ''}`);
      if (evt.orderRef) meta.push(`🔖 #${esc(evt.orderRef)}`);
      if (evt.total) meta.push(`💶 ${esc(evt.total)}`);
      if (evt.seats) meta.push(`💺 ${esc(evt.seats)}`);
      if (evt.phone) meta.push(`📞 <a href="tel:${esc(evt.phone)}">${esc(evt.phone)}</a>`);

      let details = '';
      if (Array.isArray(evt.items) && evt.items.length) {
        details += evt.items.map(it =>
          `<div>• ${esc(it.name)}${it.time ? ' · ' + esc(it.time) : ''}${it.qty ? ' ×' + esc(it.qty) : ''}${it.total ? ' — ' + esc(it.total) : ''}</div>`
        ).join('');
      }
      if (evt.cancellation) details += `<div class="booking-note">${esc(evt.cancellation)}</div>`;

      html += bookingCard({
        icon: '🎪',
        title: evt.name,
        metaLines: meta,
        tagsHtml: renderBookingTags({
          typeLabel: 'Event',
          cancellation: evt.cancellation,
          tags: evt.tags,
        }),
        detailsHtml: details,
      });
    });
    return html;
  }

  function hotelDict(tripData) {
    const raw = tripData && tripData.hotels;
    if (!raw) return {};
    if (Array.isArray(raw)) {
      const out = {};
      raw.forEach(h => {
        const id = h && (h.id || h.hotelId);
        if (id) out[id] = h;
      });
      return out;
    }
    return raw;
  }

  function hotelsForDay(day, hotels) {
    const out = [];
    const seen = new Set();
    const add = (id, data) => {
      if (!id || seen.has(id) || !data || !data.name) return;
      seen.add(id);
      out.push({ id, data });
    };
    if (day.hotelId && day.hotelId !== '—' && day.hotelId !== '') {
      add(day.hotelId, hotels[day.hotelId] || (typeof HotelCard !== 'undefined' ? HotelCard.fromDay(day, hotels) : null));
    }
    Object.entries(hotels).forEach(([id, h]) => {
      if (!h || seen.has(id)) return;
      const days = Array.isArray(h.dayNums) ? h.dayNums.map(Number) : [];
      const sameDay = days.includes(Number(day.day));
      const sameLoc = h.locationId && day.locationId && h.locationId === day.locationId;
      if (sameDay || sameLoc) add(id, h);
    });
    return out;
  }

  function renderHotelsSection(tripData) {
    if (!tripData || !tripData.days) return '';

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId() : null;

    let body = '';
    const shown = new Set();
    const hotels = hotelDict(tripData);
    const days = tripData.days.map(d => (typeof DayHelpers !== 'undefined' ? DayHelpers.enrich(d, tripData) : d));

    // J0 = veille à la maison (pas de hotelId) — ancrage calendrier
    const day0 = days.find(d => d.day === 0);
    if (day0 && !day0.hotelId && !day0.hotel) {
      body += `<div class="booking-hotel-day">Jour 0 · ${esc(day0.date || '')} — Maison</div>`;
      body += `<div class="booking-note" style="margin:0 0 12px">🏠 Préparation à la maison (veille du départ)</div>`;
    }

    function isBookedHotel(h) {
      if (typeof HotelCard !== 'undefined' && HotelCard.isBooked) return HotelCard.isBooked(h);
      return String((h && h.bookingStatus) || '').toLowerCase() === 'booked' || !!(h && h.booked);
    }

    function stayHeader(day, hotelData) {
      let headerDate = day.date || '';
      if (hotelData && hotelData.dates && hotelData.dates.checkin) {
        headerDate = formatDate(hotelData.dates.checkin);
      }
      let headerCity = day.to || '';
      if (!headerCity && day.locationId) {
        headerCity = day.locationId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
      if (!headerCity) headerCity = day.from || hotelData.city || '';
      return `<div class="booking-hotel-day">Jour ${day.day} · ${esc(headerDate)} — ${esc(headerCity)}</div>`;
    }

    function cardWithNuisance(day, hotelId, hotelData) {
      let html = HotelCard.render(hotelData);
      const targetId = hotelId || day.locationId;
      if (targetId) {
        html += `<div class="hotel-nuisance-action" style="margin:8px 0 0;padding:0">
          <button class="btn btn-sm hotel-nuisance-btn" data-location-id="${esc(targetId)}" data-trip-id="${esc(tripId || '')}">
            ⚠️ Nuisances
          </button>
          <div class="hotel-nuisance-result" data-loc="${esc(targetId)}"></div>
        </div>`;
      }
      return html;
    }

    function appendHotelCard(day, hotelId, hotelData) {
      if (typeof HotelCard === 'undefined' || !hotelData) return;
      body += stayHeader(day, hotelData);
      body += cardWithNuisance(day, hotelId, hotelData);
    }

    // 2+ to_book/candidate: horizontal list. The next card peeks so it is
    // obvious there is more to the right — not a single full-width card.
    function appendChoiceRail(day, group) {
      if (typeof HotelCard === 'undefined') return;
      const n = group.length;
      body += stayHeader(day, group[0].data);
      body += `<div class="hotel-choice-rail">`;
      body += `<div class="hotel-choice-head">
        <span class="hotel-choice-count">${n} à réserver</span>
        <span class="hotel-choice-pos">1 / ${n}</span>
      </div>`;
      body += `<div class="hotel-choice-hint">Swipe → encore ${n - 1} à droite</div>`;
      body += `<div class="hotel-choice-scroller" tabindex="0">`;
      group.forEach(({ id, data }) => {
        body += `<div class="hotel-choice-slide">${cardWithNuisance(day, id, data)}</div>`;
      });
      body += `</div>`;
      body += `<div class="hotel-choice-dots" role="tablist">`;
      group.forEach((_, i) => {
        body += `<button type="button" class="dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="Option ${i + 1} sur ${n}"></button>`;
      });
      body += `</div></div>`;
    }

    function appendGroup(day, group) {
      const booked = [];
      const open = [];
      group.forEach(h => {
        shown.add(h.id);
        if (isBookedHotel(h.data)) booked.push(h);
        else open.push(h);
      });
      booked.forEach(h => appendHotelCard(day, h.id, h.data));
      if (open.length >= 2) appendChoiceRail(day, open);
      else open.forEach(h => appendHotelCard(day, h.id, h.data));
    }

    days.forEach(day => {
      const group = hotelsForDay(day, hotels).filter(h => !shown.has(h.id));
      if (!group.length) return;
      appendGroup(day, group);
    });

    // Construction: candidats / to_book not yet attached to a night.
    const leftover = [];
    Object.entries(hotels).forEach(([id, h]) => {
      if (shown.has(id) || !h || !h.name || isBookedHotel(h)) return;
      leftover.push({ id, data: h });
    });
    if (leftover.length) {
      leftover.forEach(h => shown.add(h.id));
      const fakeDay = {
        day: '—',
        date: '',
        to: leftover[0].data.city || '',
        locationId: leftover[0].data.locationId || '',
      };
      appendGroup(fakeDay, leftover);
    }

    if (!body) return '';
    return sectionTitle('🏨', 'Hébergements') + body;
  }

  function themeEmoji(theme) {
    if (!theme) return '🎯';
    const map = {
      eau: '🌊', water: '🌊',
      nature: '🌿', randonnee: '🥾', hiking: '🥾',
      culture: '🏛️', histoire: '🏛️', history: '🏛️',
      sport: '⚽', aventure: '🧗', adventure: '🧗',
      gastronomie: '🍷', food: '🍽️',
      famille: '👨‍👩‍👧‍👦', family: '👨‍👩‍👧‍👦',
      detente: '🧘', relaxation: '🧘',
      animaux: '🐻', wildlife: '🐻',
      urbain: '🏙️', city: '🏙️',
      musique: '🎵', music: '🎵',
    };
    return map[theme.toLowerCase()] || '🎯';
  }

  function formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  function renderActivitiesSection(tripData) {
    if (!tripData || !tripData.activities) return '';

    const activities = tripData.activities;
    const entries = Object.values(activities).filter(a => a && a.name);
    if (!entries.length) return '';

    const byDay = {};
    entries.forEach(act => {
      const d = act.dayNum || 0;
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(act);
    });

    const dayKeys = Object.keys(byDay).map(Number).sort((a, b) => a - b);

    let html = sectionTitle('🎯', 'Activités');

    dayKeys.forEach(dayNum => {
      html += `<div class="booking-hotel-day">Jour ${dayNum}</div>`;
      byDay[dayNum].forEach(act => {
        const emoji = themeEmoji(act.theme);
        const duration = formatDuration(act.durationMin);
        const price = act.price ? `${act.price} ${esc(act.currency || '')}` : '';

        const meta = [];
        if (duration) meta.push(`⏱️ ${esc(duration)}`);
        if (price) meta.push(`💶 ${esc(price)}`);
        if (act.locationId) {
          const loc = act.locationId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          meta.push(`📍 ${esc(loc)}`);
        }

        let details = '';
        if (act.bookingStatus && typeof HotelCard !== 'undefined') {
          details += HotelCard.renderStatusBadge(act.bookingStatus);
        }
        if (act.bookingUrl) {
          details += `<div><a href="${esc(act.bookingUrl)}" target="_blank" class="hotel-link-btn" style="display:inline-flex;align-items:center;gap:4px;margin-top:4px">🔗 Réserver</a></div>`;
        }
        if (act.url) {
          details += `<div><a href="${esc(act.url)}" target="_blank" class="hotel-link-btn" style="display:inline-flex;align-items:center;gap:4px;margin-top:4px">🌐 Info</a></div>`;
        }
        if (act.bookingRef) {
          details += `<div style="margin-top:4px">🔖 Réf: <strong>${esc(act.bookingRef)}</strong></div>`;
        }

        html += bookingCard({
          icon: emoji,
          title: act.name,
          metaLines: meta,
          tagsHtml: renderBookingTags({
            typeLabel: act.theme ? esc(act.theme) : 'Activité',
            tags: [],
          }),
          detailsHtml: details,
        });
      });
    });

    return html;
  }

  /**
   * @param {string} containerId
   * @param {Object} tripData
   */
  function render(containerId, tripData) {
    const container = typeof containerId === 'string'
      ? document.getElementById(containerId)
      : containerId;
    if (!container) return;

    abortHotelNuisanceStreams();

    if (!tripData) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">📋</div>
        <h3>Aucune réservation</h3>
      </div>`;
      return;
    }

    let html = `<div class="page-header">
      <h1>📋 Réservations</h1>
      <div class="sub">${tripData.trip ? esc(tripData.trip.name) : ''}</div>
    </div>`;

    html += renderFlightsSection(tripData.flights);
    html += renderCarRentalSection(tripData.carRental);
    html += renderFerrySection(tripData.ferries || tripData.ferry);
    html += renderEventsSection(tripData.events);
    html += renderHotelsSection(tripData);
    html += renderActivitiesSection(tripData);

    const hasAnything = /booking-card|hotel-card/.test(html);
    if (!hasAnything) {
      html += `<div class="empty-state"><div class="empty-emoji">📋</div><h3>Aucune réservation</h3></div>`;
    }

    container.innerHTML = html;
    bindHotelNuisanceButtons(container);
    bindHotelChoiceRails(container);
    const tripId = tripData && tripData.trip && tripData.trip.id
      || (typeof Store !== 'undefined' && Store.getCurrentTripId && Store.getCurrentTripId());
    const resumed = typeof NuisanceStream !== 'undefined' && NuisanceStream.resumeIfNeeded
      && NuisanceStream.resumeIfNeeded();
    if (!resumed && typeof NuisanceStream !== 'undefined' && NuisanceStream.hydrateHotels && tripId) {
      NuisanceStream.hydrateHotels(container, tripId);
    }
  }

  function bindHotelChoiceRails(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('.hotel-choice-rail').forEach(rail => {
      const scroller = rail.querySelector('.hotel-choice-scroller');
      const slides = rail.querySelectorAll('.hotel-choice-slide');
      const pos = rail.querySelector('.hotel-choice-pos');
      const hint = rail.querySelector('.hotel-choice-hint');
      const dots = rail.querySelectorAll('.hotel-choice-dots .dot');
      if (!scroller || slides.length < 2) return;

      const indexOf = () => {
        const first = slides[0];
        const gap = 10;
        const w = first.offsetWidth + gap;
        if (!w) return 0;
        return Math.max(0, Math.min(slides.length - 1, Math.round(scroller.scrollLeft / w)));
      };
      const paint = () => {
        const i = indexOf();
        const n = slides.length;
        if (pos) pos.textContent = `${i + 1} / ${n}`;
        if (hint) {
          const right = n - 1 - i;
          hint.textContent = right
            ? `Swipe → encore ${right} à droite`
            : '← swipe pour les autres';
        }
        rail.classList.toggle('at-start', i === 0);
        rail.classList.toggle('at-end', i === n - 1);
        dots.forEach((d, di) => d.classList.toggle('active', di === i));
      };
      scroller.addEventListener('scroll', paint, { passive: true });
      dots.forEach((d, di) => {
        d.addEventListener('click', () => {
          const left = slides[di].offsetLeft - scroller.offsetLeft + scroller.scrollLeft;
          scroller.scrollTo({ left, behavior: 'smooth' });
        });
      });
      paint();
    });
  }

  function bindHotelNuisanceButtons(container) {
    if (!container) return;
    container.querySelectorAll('.hotel-nuisance-btn').forEach(btn => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const locId = btn.dataset.locationId;
        const tripId = btn.dataset.tripId || (typeof Store !== 'undefined' && Store.getCurrentTripId ? Store.getCurrentTripId() : null);
        if (!locId || !tripId) return;

        const resultEl = btn.parentElement.querySelector('.hotel-nuisance-result');
        btn.disabled = true;
        btn.textContent = '...';

        const res = await API.runNuisanceCheck(tripId, [locId]);

        btn.disabled = false;
        btn.textContent = '⚠️ Nuisances';

        if (!res.ok) {
          if (resultEl) resultEl.innerHTML = `<div class="construction-error" style="font-size:.82em;margin-top:6px">${esc(res.error || 'Erreur')}</div>`;
          return;
        }

        const previous = _hotelNuisanceAborts.get(locId) || btn._nuisanceAbort;
        if (previous) previous.abort();
        const ac = new AbortController();
        btn._nuisanceAbort = ac;
        _hotelNuisanceAborts.set(locId, ac);

        try {
          await NuisanceStream.start(resultEl, {
            tripId,
            data: res.data,
            signal: ac.signal,
            compact: true,
            locationId: locId,
          });
        } finally {
          if (_hotelNuisanceAborts.get(locId) === ac) _hotelNuisanceAborts.delete(locId);
        }
      });
    });
  }

  return {
    render,
    abortHotelNuisanceStreams,
    renderBookingTags,
    cancellationBadge,
    renderDocumentsCollapsed,
    bindDocumentsCollapse,
  };
})();
;
/* ==== js/components/day-cards.js ==== */
/**
 * day-cards.js — Generic card renderer for day-specific content
 *
 * Renders day.cards[] — each card has a type and data.
 * New card types are added here, not in daily-view.js.
 *
 * Supported types:
 *   - html: Raw HTML block (title + innerHTML, no escaping)
 *   - rental-pickup: Car rental pickup (barcode, steps)
 *   - rental-return: Car rental return (address, deadline)
 *   - info: Generic info card (text or html)
 *   - warning: Warning/alert card (text or html)
 *   - ticket: Event ticket with barcode/QR
 */

var DayCards = (() => {

  function renderAll(cards) {
    if (!cards || !cards.length) return '';
    return cards.map(card => renderCard(card)).join('');
  }

  function renderCard(card) {
    switch (card.type) {
      case 'html':           return renderHtml(card);
      case 'rental-pickup':  return renderRentalPickup(card);
      case 'rental-return':  return renderRentalReturn(card);
      case 'info':           return renderInfo(card);
      case 'warning':        return renderWarning(card);
      case 'ticket':         return renderTicket(card);
      default:               return renderGeneric(card);
    }
  }

  function renderHtml(card) {
    const d = card.data || {};
    return `<div class="card" style="margin-top:16px">
      <h3>${esc(card.title)}</h3>
      <div>${d.html || ''}</div>
    </div>`;
  }

  function renderRentalPickup(card) {
    const d = card.data || {};
    let html = `<div class="card" style="margin-top:16px;text-align:center">
      <h3>${esc(card.title)}</h3>`;
    if (d.confirmation) {
      html += `<div style="font-size:.82em;color:var(--orange);font-weight:700;margin-bottom:8px">
        Confirmation #${esc(d.confirmation)}</div>`;
    }
    if (d.ticketImage) {
      html += `<img src="${esc(d.ticketImage)}" alt="Barcode" 
        style="width:100%;max-width:360px;border-radius:12px;margin:8px auto;display:block" />`;
    }
    if (d.mapUrl || d.carplayUrl) {
      html += `<div style="display:flex;gap:8px;justify-content:center;margin-top:10px">`;
      if (d.mapUrl) html += `<a href="${esc(d.mapUrl)}" target="_blank" class="hotel-link-btn">📍 Maps</a>`;
      if (d.carplayUrl) html += `<a href="${esc(d.carplayUrl)}" class="hotel-link-btn">🚗 CarPlay</a>`;
      html += `</div>`;
    }
    if (d.steps && d.steps.length) {
      html += `<div style="text-align:left;font-size:.82em;color:var(--muted);margin-top:12px;line-height:1.6">
        <div style="font-weight:700;color:var(--text);margin-bottom:6px">📋 Instructions :</div>`;
      d.steps.forEach((step, i) => {
        // Support **bold** in steps
        const formatted = step.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
        html += `<div>${i + 1}. ${formatted}</div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  }

  function renderRentalReturn(card) {
    const d = card.data || {};
    let html = `<div class="card" style="margin-top:16px">
      <h3>${esc(card.title)}</h3>`;
    if (d.company || d.location) {
      html += `<div style="font-size:.85em;color:var(--muted);margin-bottom:8px">
        ${esc(d.company || '')}${d.location ? ' — ' + esc(d.location) : ''}</div>`;
    }
    html += `<div style="font-size:.82em;line-height:1.6">`;
    if (d.address)      html += `<div>📍 ${esc(d.address)}</div>`;
    if (d.returnBefore) html += `<div>🕐 Retour avant <b>${esc(d.returnBefore)}</b></div>`;
    if (d.phone)        html += `<div>📞 ${esc(d.phone)}</div>`;
    if (d.fuelPolicy)   html += `<div>⛽ <b>${esc(d.fuelPolicy)}</b></div>`;
    html += `</div>`;
    if (d.mapUrl || d.carplayUrl) {
      html += `<div style="display:flex;gap:8px;margin-top:10px">`;
      if (d.mapUrl) html += `<a href="${esc(d.mapUrl)}" target="_blank" class="hotel-link-btn">📍 Maps</a>`;
      if (d.carplayUrl) html += `<a href="${esc(d.carplayUrl)}" class="hotel-link-btn">🚗 CarPlay</a>`;
      html += `</div>`;
    }
    html += `</div>`;
    return html;
  }

  function renderInfo(card) {
    return `<div class="card" style="margin-top:16px;border-left:3px solid var(--orange)">
      <h3>${esc(card.title)}</h3>
      <div style="font-size:.85em;line-height:1.6">${card.data?.html || esc(card.data?.text || '')}</div>
    </div>`;
  }

  function renderWarning(card) {
    return `<div class="card" style="margin-top:16px;border-left:3px solid #ff4444;background:rgba(255,68,68,.05)">
      <h3>⚠️ ${esc(card.title)}</h3>
      <div style="font-size:.85em;line-height:1.6">${card.data?.html || esc(card.data?.text || '')}</div>
    </div>`;
  }

  function renderTicket(card) {
    const d = card.data || {};
    let html = `<div class="card" style="margin-top:16px;text-align:center">
      <h3>${esc(card.title)}</h3>`;
    if (d.ref) html += `<div style="font-size:.82em;font-weight:700;color:var(--orange)">${esc(d.ref)}</div>`;
    if (d.image) html += `<img src="${esc(d.image)}" alt="Ticket" style="width:100%;max-width:360px;border-radius:12px;margin:8px auto;display:block" />`;
    if (d.text) html += `<div style="font-size:.82em;color:var(--muted);margin-top:8px">${esc(d.text)}</div>`;
    html += `</div>`;
    return html;
  }

  function renderGeneric(card) {
    return `<div class="card" style="margin-top:16px">
      <h3>${esc(card.title || card.type)}</h3>
      <pre style="font-size:.75em;overflow:auto">${esc(JSON.stringify(card.data, null, 2))}</pre>
    </div>`;
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { renderAll, renderCard };
})();
;
/* ==== js/components/conference.js ==== */
/**
 * conference.js — Conference session switcher component
 *
 * Data-driven: reads day.conference { sessions: { person: Session[] } }
 * Renders toggle between attendees + session cards with badges.
 */

var ConferenceView = (() => {

  const BADGE_COLORS = {
    keynote:   { bg: 'rgba(255,170,51,.15)', color: '#ffaa33', label: '🎤 Keynote' },
    breakout:  { bg: 'rgba(78,205,196,.12)', color: '#4ecdc4', label: '📋 Breakout' },
    lightning: { bg: 'rgba(156,136,255,.12)', color: '#9c88ff', label: '⚡ Lightning' },
    meeting:   { bg: 'rgba(255,107,107,.12)', color: '#ff6b6b', label: '🤝 Meeting' },
    party:     { bg: 'rgba(255,170,51,.12)', color: '#ffaa33', label: '🎉 Social' },
    bof:       { bg: 'rgba(78,205,196,.08)', color: '#4ecdc4', label: '💬 BoF' },
  };

  /**
   * Render conference component.
   * @param {Object} conf — day.conference { dayLabel?, sessions: { person: Session[] } }
   * @param {Object} [opts] — { defaultPerson?, dayNum? }
   * @returns {string} HTML
   */
  function render(conf, opts) {
    if (!conf || !conf.sessions) return '';
    opts = opts || {};

    const people = Object.keys(conf.sessions);
    if (!people.length) return '';

    const defaultPerson = opts.defaultPerson || people[0];
    const dayNum = opts.dayNum || 0;
    const id = 'conf-' + dayNum;

    let html = `<div class="card" style="margin-top:16px">
      <h3>🎪 Conférence${conf.dayLabel ? ' — ' + esc(conf.dayLabel) : ''}</h3>`;

    // Toggle buttons
    if (people.length > 1) {
      html += `<div style="display:flex;gap:8px;margin-bottom:12px">`;
      people.forEach(person => {
        const count = conf.sessions[person].length;
        const isActive = person === defaultPerson;
        html += `<button id="${id}-btn-${person}" class="conf-toggle${isActive ? ' active' : ''}" 
          onclick="ConferenceView.switchPerson('${id}','${person}',${JSON.stringify(people)})">
          ${esc(capitalize(person))} (${count})
        </button>`;
      });
      html += `</div>`;
    }

    // Session lists (show default, hide others)
    people.forEach(person => {
      const isActive = person === defaultPerson;
      html += `<div id="${id}-sessions-${person}" style="${isActive ? '' : 'display:none'}">`;
      html += renderSessions(conf.sessions[person]);
      html += `</div>`;
    });

    html += `</div>`;
    return html;
  }

  function renderSessions(sessions) {
    if (!sessions || !sessions.length) return '<div style="color:var(--muted);font-size:.85em">Aucune session</div>';
    
    let html = `<div class="conf-sessions">`;
    sessions.forEach(s => {
      const badge = BADGE_COLORS[s.badge] || BADGE_COLORS.breakout;
      html += `<div class="conf-session${s.shared ? ' shared' : ''}" style="border-left:3px solid ${badge.color}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <span class="conf-time">${esc(s.t)}</span>
            <span class="conf-badge" style="background:${badge.bg};color:${badge.color}">${badge.label}</span>
          </div>
          ${s.code ? '<span class="conf-code">' + esc(s.code) + '</span>' : ''}
        </div>
        <div class="conf-title">${esc(s.title)}</div>
        ${s.room ? '<div class="conf-room">📍 ' + esc(s.room) + '</div>' : ''}
        ${s.note ? '<div class="conf-note">💡 ' + esc(s.note) + '</div>' : ''}
      </div>`;
    });
    html += `</div>`;
    return html;
  }

  function switchPerson(id, person, people) {
    people.forEach(p => {
      const el = document.getElementById(id + '-sessions-' + p);
      const btn = document.getElementById(id + '-btn-' + p);
      if (el) el.style.display = (p === person) ? '' : 'none';
      if (btn) btn.classList.toggle('active', p === person);
    });
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render, switchPerson };
})();
;
/* ==== js/components/daily-view.js ==== */
/**
 * daily-view.js — Day-by-day programme view
 * Renders a full day: header, chips, timeline, hotel card, restaurant.
 *
 * dayIndex: 0-based array index into tripData.days[]
 */

var DailyView = (() => {

  /**
   * Render a day view into a container element.
   * @param {HTMLElement} container
   * @param {Object} tripData — { trip, days[], restaurants?, lists? }
   * @param {number} dayIndex — 0-based index into tripData.days[]
   */
  function render(container, tripData, dayIndex) {
    if (!container) return;

    if (!tripData || !tripData.days || !tripData.days.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">📅</div>
        <h3>Aucun programme</h3>
        <p>Les données du voyage ne sont pas encore chargées.</p>
      </div>`;
      return;
    }

    const days = tripData.days;
    const idx = Math.max(0, Math.min(dayIndex, days.length - 1));
    const day = DayHelpers.enrich(days[idx], tripData);

    if (!day) {
      container.innerHTML = `<div class="empty-state"><div class="empty-emoji">🗓️</div><h3>Jour introuvable</h3></div>`;
      return;
    }

    const totalDays = days.length;
    const hasPrev = idx > 0;
    const hasNext = idx < totalDays - 1;

    let html = '';

    // ── Navigation arrows ──────────────────────────────────────────────────
    html += `<div class="day-nav">
      <button onclick="App.goToDay(${idx - 1})" ${hasPrev ? '' : 'disabled'} aria-label="Jour précédent">◀</button>
      <span style="color:var(--muted);font-size:.8em">${idx + 1} / ${totalDays}</span>
      <button onclick="App.goToDay(${idx + 1})" ${hasNext ? '' : 'disabled'} aria-label="Jour suivant">▶</button>
    </div>`;

    // ── Countdown / Trip status banner ──────────────────────────────────────
    if (typeof DayResolver !== 'undefined' && tripData.trip) {
      const state = DayResolver.tripState(tripData.trip);
      const countdown = DayResolver.getCountdown(tripData.trip);
      let bannerText = '';
      let bannerGradient = '';
      if (state === 'before' && countdown && countdown.active) {
        if (countdown.days === 0) {
          bannerText = "C'est demain ! \ud83c\udf89";
        } else {
          bannerText = `J-${countdown.days} avant le d\u00e9part ! \ud83c\udf89`;
        }
        bannerGradient = 'linear-gradient(135deg, rgba(233,69,96,.15), rgba(78,205,196,.15))';
      } else if (state === 'during') {
        const dayNum = day.day !== undefined ? day.day : idx + 1;
        bannerText = `Jour ${dayNum} du voyage ! \ud83c\udf1f`;
        bannerGradient = 'linear-gradient(135deg, rgba(78,205,196,.15), rgba(88,166,255,.15))';
      } else if (state === 'after') {
        bannerText = `Voyage termin\u00e9 ! \ud83d\udcab ${days.length} jours de souvenirs`;
        bannerGradient = 'linear-gradient(135deg, rgba(139,92,246,.15), rgba(233,69,96,.15))';
      }
      if (bannerText) {
        html += `<div style="text-align:center;padding:12px 16px;margin-bottom:12px;border-radius:var(--radius);background:${bannerGradient};border:1px solid rgba(255,255,255,.08)">`;
        html += `<div style="font-size:1.1em;font-weight:700;color:var(--text)">${bannerText}</div>`;
        html += `</div>`;
      }
    }

    // ── Day header ─────────────────────────────────────────────────────────
    // day.day field (from seed) is 1-based display number, or we use idx+1
    const displayNum = day.day !== undefined ? day.day : idx + 1;
    // ── Hero image (data-driven) ──
    let heroUrl = day.heroImage || null;
    if (day.day === 0 && day.heroImages) {
      const userId = Store.get('user-id');
      const userCfg = userId && tripData.trip && tripData.trip.users ? tripData.trip.users[userId] : null;
      const city = userCfg ? userCfg.city : null;
      heroUrl = (city && day.heroImages[city]) || day.heroImages._default || heroUrl;
    }
    const heroClass = heroUrl ? ' has-hero' : '';
    
    html += `<div class="day-header${heroClass}">`;
    if (heroUrl) {
      html += `<div class="hero-bg" id="hero-bg-${day.day}"></div>`;
      html += `<div class="hero-overlay"></div>`;
    }
    html += `<div class="day-number">Jour ${displayNum}</div>
      <div class="day-date">${esc(day.dow || '')} ${esc(day.date || '')}</div>
      <div class="day-emoji">${esc(day.emoji || '📅')}</div>
      <div class="day-label">${esc(day.label || '')}</div>
    </div>`;

    // ── Info chips ─────────────────────────────────────────────────────────
    const hasChips = (day.from && day.to && day.from !== day.to)
                   || (day.dist && day.dist !== '0 km' && day.dist !== '-')
                   || (day.dur  && day.dur  !== '-');
    if (hasChips) {
      html += `<div class="info-chips">`;
      if (day.from && day.to && day.from !== day.to) {
        html += `<div class="info-chip">📍 ${esc(day.from)} → ${esc(day.to)}</div>`;
      } else if (day.from) {
        html += `<div class="info-chip">📍 ${esc(day.from)}</div>`;
      }
      if (day.dist && day.dist !== '0 km' && day.dist !== '-') {
        html += `<div class="info-chip">🛣️ ${esc(day.dist)}</div>`;
      }
      if (day.dur && day.dur !== '-') {
        html += `<div class="info-chip">⏱️ ${esc(day.dur)}</div>`;
      }
      html += `</div>`;
    }

    // ── Google Maps + CarPlay + Apple Maps links ───────────────────────────
    if (day.mapUrl) {
      const dest = day.to || day.label || '';
      const dayPad = String(displayNum).padStart(2, '0');
      const tripId = window.Store ? Store.getCurrentTripId() : "";
      html += `<div class="card" style="padding:0;overflow:hidden">`;
      // Only show route image for trips with real map assets (check routeImage flag)
      if (day.routeImage !== false) {
        html += `<a href="${escAttr(day.mapUrl)}" target="_blank" style="display:block">`;
        const ncq = localStorage.getItem('tripkit_nocache') === '1' ? '?nocache=1' : '';
        html += `<img src="/api/trips/${tripId}/assets/day-${dayPad}-route.jpg${ncq}" alt="Trajet ${esc(day.from)} \u2192 ${esc(day.to)}" style="width:100%;border-radius:var(--radius) var(--radius) 0 0;display:block;min-height:60px" onerror="this.onerror=null;this.parentElement.style.display='none'" loading="lazy">`;
        html += `</a>`;
      }
      if (day.from && day.to && day.from !== day.to) {
        html += `<div style="padding:8px 12px 4px;font-weight:600;font-size:.9em">${esc(day.from)} \u2192 ${esc(day.to)}</div>`;
        html += `<div style="padding:0 12px 8px;color:var(--muted);font-size:.78em">🚗 ${esc(day.dist)} \u2022 ${esc(day.dur)}</div>`;
      }
      html += `<div class="map-actions" style="margin:0;padding:8px 12px 12px">`;
      html += `<a href="${escAttr(day.mapUrl)}" class="map-btn map-btn-primary" target="_blank">🗺️ Google Maps</a>`;
      html += `<a href="${escAttr(carplayUrl(day.mapUrl, dest))}" class="map-btn map-btn-secondary" target="_blank">🚗 CarPlay</a>`;
      html += `<a href="${escAttr(appleMapsUrl(dest))}" class="map-btn map-btn-secondary">🍎 Apple Maps</a>`;
      html += `</div></div>`;
    }

    // ── Weather box (online only — offline = Jour sans météo) ──────────────
    if (day.geo && navigator.onLine) {
      html += `<div id="weatherBox" class="card" style="margin-top:12px;text-align:center;color:var(--muted);font-size:.85em">🌤️ Chargement météo…</div>`;
    }

    // ── Discovery (Autour de …) — collapsed; scope = this day ────────────
    html += `<div id="discovery-panel"></div>`;

    // ── Timeline ───────────────────────────────────────────────────────────
    if (day.timeline && day.timeline.length) {
      html += `<div class="section-title">📋 Programme</div>`;
      const homeTz = (typeof TzHelpers !== 'undefined')
        ? TzHelpers.homeTz(tripData.trip || {})
        : ((tripData.trip && tripData.trip.homeTz) || 'Europe/Paris');
      html += Timeline.render(day.timeline, {
        restaurants: tripData.restaurants || {},
        homeTz,
        dayDate: day._isoDate || '',
      });
    }

    // ── Activities for this day ────────────────────────────────────────────
    if (tripData.activities) {
      const dayNum = day.day !== undefined ? day.day : idx + 1;
      const dayActivities = Object.values(tripData.activities).filter(
        a => a && a.dayNum === dayNum
      );
      if (dayActivities.length) {
        html += `<div class="section-title">🎯 Activités</div>`;
        dayActivities.forEach(act => {
          const emoji = activityThemeEmoji(act.theme);
          const dur = activityDuration(act.durationMin);
          let statusHtml = '';
          if (act.bookingStatus && typeof HotelCard !== 'undefined') {
            statusHtml = HotelCard.renderStatusBadge(act.bookingStatus);
          }
          html += `<div class="card" style="padding:12px 14px;margin-bottom:8px">`;
          html += `<div style="display:flex;align-items:center;gap:8px">`;
          html += `<span style="font-size:1.2em">${emoji}</span>`;
          html += `<div style="flex:1">`;
          html += `<div style="font-weight:600;font-size:.92em">${esc(act.name)}</div>`;
          const chips = [];
          if (dur) chips.push(`⏱️ ${esc(dur)}`);
          if (act.price) chips.push(`💶 ${act.price} ${esc(act.currency || '')}`);
          if (chips.length) {
            html += `<div style="font-size:.8em;color:var(--muted);margin-top:2px">${chips.join(' · ')}</div>`;
          }
          html += `</div></div>`;
          if (statusHtml) html += statusHtml;
          if (act.bookingUrl) {
            html += `<div style="margin-top:6px"><a href="${escAttr(act.bookingUrl)}" target="_blank" class="hotel-link-btn" style="font-size:.82em">🔗 Réserver</a></div>`;
          }
          html += `</div>`;
        });
      }
    }

    // ── Highlights ─────────────────────────────────────────────────────────
    if (day.highlights && day.highlights.length) {
      html += `<div class="section-title">⭐ Points forts</div>`;
      html += `<div class="card"><ul class="highlights-list">`;
      day.highlights.forEach(h => {
        // Allow safe links through (internal #hash links stay same-page, external get target=_blank)
        const safe = h.replace(
          /<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/g,
          (m, href, label) => href.startsWith('#')
            ? `<a href="${href}">${esc(label)}</a>`
            : `<a href="${href}" target="_blank">${esc(label)}</a>`
        ).replace(/<(?!\/a>)(?!a\s)[^>]+>/g, '');
        html += `<li>${safe}</li>`;
      });
      html += `</ul></div>`;
    }

    // ── Generic departure cards (from day.departures[]) ─────────────────
    if (day.departures && day.departures.length) {
      day.departures.forEach(dep => {
        const color = dep.color || '#f0a500';
        html += `<div class="departure-card" style="border-left-color:${escAttr(color)}">`;
        html += `<h3>${esc(dep.emoji || '✈️')} Départ ${esc(dep.traveler)}</h3>`;
        if (dep.subtitle) html += `<div style="font-size:.85em;color:var(--muted);margin-bottom:10px">${esc(dep.subtitle)}</div>`;
        if (dep.steps && dep.steps.length) {
          html += `<div class="departure-steps">`;
          dep.steps.forEach(step => {
            if (step.time) {
              html += `<div><b>${esc(step.time)}</b> — ${esc(step.desc)}</div>`;
            } else {
              html += `<div>${esc(step.desc)}</div>`;
            }
          });
          html += `</div>`;
        }
        if (dep.footer) {
          html += `<div class="departure-info" style="border-color:${escAttr(color)}33;color:${escAttr(color)}">${esc(dep.footer)}</div>`;
        }
        html += `</div>`;
      });
    }

    // Culture is in the dedicated Culture tab (tripData.culture[])

    // ── Poem (collapsible) ────────────────────────────────────────────────────
    if (day.poem) {
      const p = day.poem;
      const poemId = `poem-${displayNum}`;
      html += `<div class="card poem-card">`;
      if (p.title) {
        html += `<div class="poem-title" style="cursor:pointer;user-select:none" onclick="var b=document.getElementById('${poemId}');var a=this.querySelector('.parr');if(b.style.display==='none'){b.style.display='block';a.textContent='\u25bc'}else{b.style.display='none';a.textContent='\u25b6'}">${esc(p.title)} <span class="parr" style="font-size:.7em;margin-left:6px">\u25bc</span></div>`;
      }
      if (p.lines && p.lines.length) {
        html += `<div id="${poemId}" class="poem-body">${p.lines.map(l => esc(l)).join('<br>')}</div>`;
      }
      if (p.author) html += `<div class="poem-author">— ${esc(p.author)}</div>`;
      html += `</div>`;
    }

    // ── Hotel card ─────────────────────────────────────────────────────────
    const hotelData = HotelCard.fromDay(day, tripData.hotels);
    if (hotelData) {
      // Show full card (with WiFi QR) only on check-in day, compact otherwise
      const isFirstDayAtHotel = dayIndex === 0 || (() => {
        const prevDay = tripData.days[dayIndex - 1];
        const prevData = prevDay ? (typeof prevDay.data === "string" ? JSON.parse(prevDay.data) : prevDay.data) : null;
        return !prevData || prevData.hotelId !== day.hotelId;
      })();
      html += `<div class="section-title">🏨 Hébergement</div>`;
      html += HotelCard.render(hotelData, { compact: !isFirstDayAtHotel });
    } else if (day.day === 0) {
      // J0 = startDate-1 : veille à la maison, pas d'hôtel
      html += `<div class="section-title">🏨 Hébergement</div>`;
      html += `<div class="card" style="padding:14px 16px">🏠 <strong>Maison</strong> — préparation des valises (veille du départ)</div>`;
    }

    // ── Special cards per day ──────────────────────────────────────────────
    html += renderSpecialCard(displayNum);

    // ── Restaurant ─────────────────────────────────────────────────────────
    // restaurants keyed by day.day (1-based display number)
    const restoKey = day.day !== undefined ? day.day : idx + 1;
    const resto = tripData.restaurants && tripData.restaurants[restoKey];
    if (resto) {
      html += renderRestaurant(resto);
    }

    // ── Shopping list shortcut ─────────────────────────────────────────────
    // Key the list by the CURRENT trip id (not a hardcoded one) so the shortcut
    // works for every trip. Falls back to "usa2026" to preserve legacy keys.
    const currentTripId = (window.Store && Store.getCurrentTripId()) || 'usa2026';
    const shoppingListId = `courses-day${displayNum}-${currentTripId}`;
    if (tripData.lists && tripData.lists[shoppingListId]) {
      html += `<div style="margin:12px 0">
        <button class="btn btn-accent" style="width:100%" onclick="App.openList('${shoppingListId}');App.switchTab('listes')">
          🛒 Courses Day ${displayNum}
        </button>
      </div>`;
    }

    
    // ── Day-specific cards (rental pickup/return, tickets, etc.) ────────
    if (day.cards && day.cards.length && typeof DayCards !== 'undefined') {
      html += DayCards.renderAll(day.cards);
    }

    // ── Conference sessions ────────────────────────────────────────────────
    if (day.conference && typeof ConferenceView !== 'undefined') {
      const userId = Store.get('user-id');
      const userCfg = userId && tripData.trip && tripData.trip.users ? tripData.trip.users[userId] : null;
      const defaultPerson = userCfg && userCfg.defaultConf ? userCfg.defaultConf : undefined;
      html += ConferenceView.render(day.conference, { defaultPerson, dayNum: day.day });
    }

    container.innerHTML = html;
    container.scrollTop = 0;

    // Load hero image async (after DOM render)
    if (heroUrl) {
      const img = new Image();
      const bgEl = document.getElementById('hero-bg-' + day.day);
      img.onload = () => { if (bgEl) bgEl.style.backgroundImage = "url('" + heroUrl + "')"; };
      img.onerror = () => { if (bgEl) bgEl.style.display = 'none'; };
      img.src = heroUrl;
    }

    // Fetch weather async (after DOM render) — skipped offline
    if (day.geo && navigator.onLine && typeof Weather !== 'undefined') {
      const wb = document.getElementById('weatherBox');
      if (wb) Weather.renderInline(wb, day);
    }

    const discEl = document.getElementById('discovery-panel');
    if (discEl && typeof DiscoveryPanel !== 'undefined') {
      const tripId = (window.Store && Store.getCurrentTripId()) || '';
      DiscoveryPanel.render(discEl, { tripId, day, tripData });
    }

    // Swipe gesture — navigate between days
    setupSwipe(container, idx, totalDays);
  }

  // ── Swipe handler for day navigation ──────────────────────────────────────
  function setupSwipe(el, idx, totalDays) {
    let startX = 0, dx = 0, moving = false;
    el.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX; dx = 0; moving = false;
    }, {passive: true});
    el.addEventListener('touchmove', e => {
      const mx = e.touches[0].clientX - startX;
      const my = e.touches[0].clientY - (e.touches[0]._sy || e.touches[0].clientY);
      if (!moving && Math.abs(mx) > Math.abs(my) && Math.abs(mx) > 12) moving = true;
      if (moving) { dx = mx; e.preventDefault(); }
    }, {passive: false});
    el.addEventListener('touchend', () => {
      if (!moving) return;
      if (dx < -60 && idx < totalDays - 1) { App.goToDay(idx + 1); }
      else if (dx > 60 && idx > 0) { App.goToDay(idx - 1); }
    }, {passive: true});
  }
  // ── Special cards per day (deprecated — use timeline data) ──────────────
  function renderSpecialCard(dayNum) {
    return '';
  }















































































  // ── Restaurant card ────────────────────────────────────────────────────────
  function renderRestaurant(resto) {
    let html = `<div class="section-title">🍽️ Restaurants</div>`;

    if (resto.breakfast) {
      html += `<div class="card" style="font-size:.84em;color:var(--muted)">🌅 Petit-déj: ${esc(resto.breakfast)}</div>`;
    }
    if (resto.lunch) {
      html += `<div class="card" style="font-size:.84em;color:var(--muted)">🥗 Déjeuner: ${esc(resto.lunch)}</div>`;
    }
    if (resto.main) {
      const m = resto.main;
      html += `<div class="resto-card">
        <div class="resto-header">
          <span class="resto-icon">${esc(m.icon || '🍽️')}</span>
          <div style="flex:1">
            <div class="resto-name">${esc(m.name || '')}
              ${m.booked ? '<span class="resto-badge resto-booked">Réservé ✓</span>' : ''}
              ${m.stars  ? `<span class="resto-badge resto-stars">⭐ ${esc(m.stars)}</span>` : ''}
              ${m.price  ? `<span class="resto-badge" style="background:rgba(255,255,255,.07);color:var(--muted)">${esc(m.price)}</span>` : ''}
            </div>
            <div class="resto-note">${esc(m.note || '')}${m.ref ? ` · Réf: <strong>${esc(m.ref)}</strong>` : ''}</div>
          </div>
        </div>
        ${m.maps ? `<div style="margin-top:8px"><a href="${escAttr(m.maps)}" class="hotel-link-btn" target="_blank">🗺️ Maps</a></div>` : ''}
      </div>`;
    }
    if (resto.alts && resto.alts.length) {
      html += `<div class="card" style="font-size:.82em">
        <div style="color:var(--muted);margin-bottom:8px;font-weight:600;font-size:.9em">Alternatives</div>`;
      resto.alts.forEach(a => {
        html += `<div class="resto-alt">
          <div>
            <div class="ra-name">${esc(a.name || '')}</div>
            <div class="ra-note">${esc(a.note || '')}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            ${a.stars ? `<div class="ra-meta">⭐ ${esc(a.stars)}</div>` : ''}
            ${a.price ? `<div class="ra-meta">${esc(a.price)}</div>` : ''}
          </div>
        </div>`;
      });
      html += `</div>`;
    }
    return html;
  }

  // ── URL helpers ────────────────────────────────────────────────────────────
  function carplayUrl(mapUrl, destination) {
    // Strip departure from Google Maps dir URL — leaves only destination segment
    try {
      const parts = mapUrl.split('/dir/')[1].split('/').filter(Boolean);
      if (parts.length < 2) return 'https://www.google.com/maps/dir/' + encodeURIComponent(destination);
      return 'https://www.google.com/maps/dir/' + parts.slice(1).join('/');
    } catch(e) {
      return 'https://www.google.com/maps/search/' + encodeURIComponent(destination);
    }
  }

  function appleMapsUrl(address) {
    return 'maps://maps.apple.com/?daddr=' + encodeURIComponent(address) + '&dirflg=d';
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAttr(s) {
    return String(s || '').replace(/"/g, '&quot;');
  }

  function activityThemeEmoji(theme) {
    if (!theme) return '🎯';
    const map = {
      eau: '🌊', water: '🌊',
      nature: '🌿', randonnee: '🥾', hiking: '🥾',
      culture: '🏛️', histoire: '🏛️', history: '🏛️',
      sport: '⚽', aventure: '🧗', adventure: '🧗',
      gastronomie: '🍷', food: '🍽️',
      famille: '👨‍👩‍👧‍👦', family: '👨‍👩‍👧‍👦',
      detente: '🧘', relaxation: '🧘',
      animaux: '🐻', wildlife: '🐻',
      urbain: '🏙️', city: '🏙️',
      musique: '🎵', music: '🎵',
    };
    return map[theme.toLowerCase()] || '🎯';
  }

  function activityDuration(minutes) {
    if (!minutes || minutes <= 0) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }

  return { render };
})();
;
/* ==== js/components/discovery-panel.js ==== */
/**
 * discovery-panel.js — « Autour de … » in the Jour view (Phase 0).
 * Collapsed by default. Scope = the day on screen (◀ ▶ / swipe).
 * Geo themes via Overpass; editorial (festivals / spectacles) via Léo web search.
 */
var DiscoveryPanel = (() => {
  const aborts = new WeakMap();

  // POST /discovery/retain writes trip.activities (bookingStatus: candidate)
  // via typed seedgit. A 501 from an older backend is still shown as unavailable.
  const RETAIN_LABEL = 'Retenir';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function placeOf(day) {
    return String(day.to || day.from || day.label || '').trim();
  }

  function corridorLeg(days, idx, tripData) {
    if (!Array.isArray(days) || idx < 1) return null;
    const day = days[idx] || {};
    const prev = days[idx - 1] || {};
    const fromId = prev.locationId;
    const toId = day.locationId;
    if (!fromId || !toId || fromId === toId) return null;
    const locs = (tripData && tripData.locations) || {};
    const from = locs[fromId];
    const to = locs[toId];
    if (!from || from.lat == null || from.lon == null || !to || to.lat == null || to.lon == null) return null;
    const fromLabel = String(prev.to || prev.label || from.name || fromId).trim();
    const toLabel = String(day.to || day.label || to.name || toId).trim();
    return { fromId, toId, fromLabel, toLabel };
  }

  function firstCorridorLeg(tripData) {
    const days = (tripData && tripData.days) || [];
    for (let i = 1; i < days.length; i++) {
      const leg = corridorLeg(days, i, tripData);
      if (leg) return { day: days[i], idx: i, leg };
    }
    return null;
  }

  function cancel(root) {
    const ac = aborts.get(root);
    if (ac) {
      ac.abort();
      aborts.delete(root);
    }
  }

  /**
   * @param {HTMLElement} container
   * @param {{ tripId: string, day: object, tripData: object, corridorOnly?: boolean }} opts
   */
  function render(container, opts) {
    if (!container) return;
    cancel(container);
    const tripId = opts && opts.tripId;
    const day = (opts && opts.day) || {};
    const tripData = (opts && opts.tripData) || {};
    const trip = tripData.trip || {};
    const days = tripData.days || [];
    const idx = days.findIndex(d => d && d.day === day.day);
    const leg = idx >= 0 ? corridorLeg(days, idx, tripData) : (opts && opts.leg) || null;
    const corridorOnly = !!(opts && opts.corridorOnly);
    if (!tripId || (!day.geo && !leg)) {
      container.innerHTML = '';
      return;
    }
    // Jour hides discovery once the trip is over. Construction still needs the
    // along-the-drive search while editing a finished itinerary.
    if (!corridorOnly && typeof DayResolver !== 'undefined' && DayResolver.tripState(trip) === 'after') {
      container.innerHTML = '';
      return;
    }
    const place = placeOf(day);
    const dateLabel = [day.dow, day.date].filter(Boolean).join(' ');
    const dayNum = day.day;
    const dateISO = day._isoDate || '';
    const aroundTitle = place ? `Autour de ${place}` : 'Autour de ce jour';
    const trajetTitle = leg ? `Sur le trajet ${leg.fromLabel} → ${leg.toLabel}` : '';
    const title = corridorOnly && trajetTitle ? trajetTitle : aroundTitle;
    const sub = dateLabel ? ` · ${dateLabel}` : '';
    const modeToggle = (!corridorOnly && leg)
      ? `<div class="discovery-modes" role="tablist">
          <button type="button" class="discovery-mode is-on" data-mode="around">Autour</button>
          <button type="button" class="discovery-mode" data-mode="corridor">Sur le trajet</button>
        </div>`
      : '';

    container.innerHTML = `<div class="discovery-wrap section-wrap" id="discovery-wrap">
      <button type="button" class="discovery-toggle" id="discovery-toggle"
        aria-expanded="false" aria-controls="discovery-body">
        <span class="discovery-toggle-label">🛍️ ${esc(title)}${esc(sub)}</span>
        <span class="discovery-chevron" aria-hidden="true">▸</span>
      </button>
      <div class="section-body hidden discovery-body" id="discovery-body">
        ${modeToggle}
        <div class="discovery-themes" id="discovery-themes"></div>
        <button type="button" class="btn btn-accent discovery-search" id="discovery-search" disabled>Chercher</button>
        <p class="discovery-status" id="discovery-status" hidden></p>
        <div class="discovery-results" id="discovery-results"></div>
      </div>
    </div>`;

    container._disc = {
      tripId, dayNum, dateISO, leg, mode: corridorOnly ? 'corridor' : 'around',
      aroundTitle, sub,
    };

    const toggle = container.querySelector('#discovery-toggle');
    const body = container.querySelector('#discovery-body');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      body.classList.toggle('hidden', open);
      toggle.querySelector('.discovery-chevron').textContent = open ? '▸' : '▾';
      if (!open) loadThemesAndCache(container);
    });
    container.querySelectorAll('.discovery-mode').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMode(container, btn.getAttribute('data-mode'));
      });
    });
  }

  function setMode(root, mode) {
    const st = root._disc || {};
    st.mode = mode;
    root._disc = st;
    root.querySelectorAll('.discovery-mode').forEach(b => {
      b.classList.toggle('is-on', b.getAttribute('data-mode') === mode);
    });
    const label = root.querySelector('.discovery-toggle-label');
    if (label) {
      const title = (mode === 'corridor' && st.leg)
        ? `Sur le trajet ${st.leg.fromLabel} → ${st.leg.toLabel}`
        : (st.aroundTitle || 'Autour de ce jour');
      label.textContent = `🛍️ ${title}${st.sub || ''}`;
    }
    const wrap = root.querySelector('#discovery-results');
    if (wrap) wrap.innerHTML = '';
    loadThemesAndCache(root);
  }

  async function loadThemesAndCache(root) {
    const st = root._disc || {};
    const { tripId, dayNum, dateISO, leg, mode } = st;
    const themesEl = root.querySelector('#discovery-themes');
    const status = root.querySelector('#discovery-status');
    const btn = root.querySelector('#discovery-search');
    if (!themesEl || typeof API === 'undefined') return;
    try {
      const dataRes = await API.getDiscoveryThemes(tripId);
      let themes = (dataRes && dataRes.ok && dataRes.data && dataRes.data.themes) || [];
      if (mode === 'corridor') {
        themes = themes.filter(t => t && t.engine === 'geo' && t.corridor);
      }
      paintThemes(themesEl, themes);
      if (btn) {
        btn.disabled = false;
        btn.onclick = () => runSearch(root);
      }
      const cachedOpts = mode === 'corridor' && leg
        ? { fromLoc: leg.fromId, toLoc: leg.toId, dateISO }
        : { dayNum };
      const cached = await API.getDiscoveryResults(tripId, cachedOpts);
      if (cached && cached.ok && cached.data && cached.data.items && cached.data.items.length) {
        paintResults(root, cached.data);
      }
    } catch (e) {
      if (status) {
        status.hidden = false;
        status.textContent = (e && e.message) || 'Catalogue indisponible.';
      }
    }
  }

  function paintThemes(el, themes) {
    el.innerHTML = themes.map((t) => {
      return `<label class="discovery-chip">
        <input type="checkbox" value="${esc(t.id)}"${t.engine === 'editorial' ? '' : ' checked'}>
        <span>${esc(t.emoji || '')} ${esc(t.label || t.id)}</span>
      </label>`;
    }).join('');
  }

  function selectedThemeIds(root) {
    return Array.from(root.querySelectorAll('#discovery-themes input[type="checkbox"]:checked:not(:disabled)'))
      .map((i) => i.value);
  }

  async function runSearch(root) {
    const st = root._disc || {};
    const { tripId, dayNum, dateISO, leg, mode } = st;
    const status = root.querySelector('#discovery-status');
    const btn = root.querySelector('#discovery-search');
    const themes = selectedThemeIds(root);
    if (!themes.length) {
      if (status) { status.hidden = false; status.textContent = 'Choisis au moins un thème.'; }
      return;
    }
    if (!navigator.onLine) {
      if (status) { status.hidden = false; status.textContent = 'Hors-ligne — réessaie avec le réseau.'; }
      return;
    }
    cancel(root);
    const ac = new AbortController();
    aborts.set(root, ac);
    if (btn) btn.disabled = true;
    if (status) { status.hidden = false; status.textContent = 'Recherche…'; }
    const scope = (mode === 'corridor' && leg)
      ? { corridor: [leg.fromId, leg.toId], dateISO }
      : { dayNum, dateISO };
    try {
      const posted = await API.postDiscoverySearch(tripId, { themes, scope });
      if (!posted || !posted.ok || !posted.data || !posted.data.jobId) {
        const msg = (posted && posted.error) || 'Recherche impossible.';
        if (status) status.textContent = msg;
        return;
      }
      const jobId = posted.data.jobId;
      let result = null;
      for await (const ev of API.leoJobStream(jobId, 0, { signal: ac.signal })) {
        if (ev.event === 'theme' && ev.data) {
          const label = ev.data.text || (ev.data.tool && ev.data.tool.label) || '';
          if (status) status.textContent = label ? `${label}…` : 'Recherche…';
          if (ev.data.tool && Array.isArray(ev.data.tool.items)) {
            mergeThemeItems(root, ev.data.tool.themeId, ev.data.tool.items);
          }
        }
        if (ev.event === 'result' && ev.data && ev.data.reply) {
          try { result = JSON.parse(ev.data.reply); } catch (_) {}
        }
        if (ev.event === 'error') {
          const msg = (ev.data && (ev.data.error || ev.data.detail)) || 'Recherche impossible.';
          if (status) status.textContent = msg;
          return;
        }
        if (ev.event === 'done') break;
      }
      if (result) paintResults(root, result);
      else {
        const cachedOpts = (mode === 'corridor' && leg)
          ? { fromLoc: leg.fromId, toLoc: leg.toId, dateISO }
          : { dayNum };
        const cached = await API.getDiscoveryResults(tripId, cachedOpts);
        if (cached && cached.ok && cached.data) paintResults(root, cached.data);
      }
      if (status) status.hidden = true;
    } catch (e) {
      if (status) {
        status.hidden = false;
        status.textContent = (typeof API !== 'undefined' && API.netFailMessage)
          ? API.netFailMessage(e, ac.signal.aborted)
          : ((e && e.message) || 'Recherche impossible.');
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function mergeThemeItems(root, themeId, items) {
    const wrap = root.querySelector('#discovery-results');
    if (!wrap || !themeId || !items || !items.length) return;
    const existing = wrap._items || [];
    const rest = existing.filter((it) => it.themeId !== themeId);
    wrap._items = rest.concat(items);
    paintResults(root, { items: wrap._items });
  }

  function paintResults(root, res) {
    const wrap = root.querySelector('#discovery-results');
    if (!wrap) return;
    const items = (res && res.items) || [];
    wrap._items = items;
    if (!items.length) {
      wrap.innerHTML = `<p class="discovery-empty">${(root._disc && root._disc.mode === 'corridor')
        ? 'Rien trouvé sur le trajet pour ces thèmes.'
        : 'Rien trouvé autour pour ces thèmes.'}</p>`;
      return;
    }
    wrap.innerHTML = items.map((it, idx) => {
      const editorial = it.source === 'editorial';
      const km = (!editorial && typeof it.distKm === 'number' && it.distKm > 0)
        ? `${String(it.distKm).replace('.', ',')} km` : '';
      const detour = (!editorial && it.detourEstimated && typeof it.detourKm === 'number')
        ? `~+${String(it.detourKm).replace('.', ',')} km de détour (estimé)` : '';
      const when = it.when ? esc(it.when) : '';
      const linkLabel = editorial ? 'Lien' : 'Maps';
      const link = it.url
        ? `<a class="discovery-maps" href="${esc(it.url)}" target="_blank" rel="noopener">${linkLabel}</a>`
        : '';
      const meta = [when, detour || km, link].filter(Boolean).join(' · ');
      const note = it.note ? `<div class="discovery-item-note">${esc(it.note)}</div>` : '';
      const retainBtn = `<button type="button" class="btn btn-sm discovery-retain-btn" data-idx="${idx}">${RETAIN_LABEL}</button>`;
      return `<div class="discovery-item">
        <div class="discovery-item-row">
          <div class="discovery-item-name">${esc(it.name || '')}</div>
          ${retainBtn}
        </div>
        ${meta ? `<div class="discovery-item-meta">${meta}</div>` : ''}
        ${note}
      </div>`;
    }).join('');

    wrap.querySelectorAll('.discovery-retain-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const item = wrap._items[idx];
        if (item) handleRetain(btn, item);
      });
    });
  }

  async function handleRetain(btn, item) {
    const tripId = getTripIdForDiscovery();
    if (!tripId) return;

    btn.disabled = true;
    btn.textContent = 'Enregistrement…';

    const res = await API.retainDiscoveryItem(tripId, {
      id: item.id || '',
      name: item.name || '',
      themeId: item.themeId || '',
      lat: item.lat || 0,
      lon: item.lon || 0,
      distKm: item.distKm || 0,
      url: item.url || '',
      source: item.source || '',
    });

    if (res && (res.status === 501 || (res.data && res.data.error === 'not_implemented'))) {
      btn.textContent = 'Pas encore disponible';
      btn.className = 'btn btn-sm discovery-retain-btn unavailable';
      btn.title = (res.data && typeof res.data.detail === 'string' && res.data.detail)
        || "L'écriture dans le seed n'est pas encore branchée.";
      btn.disabled = true;
      return;
    }

    if (!res || !res.ok || !(res.data && (res.data.activity || res.data.ok))) {
      retainFailed(btn, 'Erreur');
      return;
    }

    btn.textContent = 'Retenu ✓';
    btn.className = 'btn btn-sm discovery-retain-btn done';
    const seedPush = res.data.seedPush;
    if (seedPush && seedPush.ok === false) {
      const detail = (typeof seedPush.error === 'string' && seedPush.error)
        ? seedPush.error
        : 'écriture git refusée';
      btn.title = 'Enregistré dans TripKit, pas dans le repo seed : ' + detail;
    }
  }

  function retainFailed(btn, msg) {
    btn.textContent = msg;
    btn.className = 'btn btn-sm discovery-retain-btn error';
    setTimeout(() => {
      btn.textContent = RETAIN_LABEL;
      btn.disabled = false;
      btn.className = 'btn btn-sm discovery-retain-btn';
      btn.removeAttribute('title');
    }, 2500);
  }

  function getTripIdForDiscovery() {
    if (typeof Store !== 'undefined' && Store.getCurrentTripId) {
      return Store.getCurrentTripId();
    }
    return null;
  }

  return { render, firstCorridorLeg, corridorLeg };
})();
;
/* ==== js/components/nuisance-stream.js ==== */
/**
 * nuisance-stream.js — Flux d'analyse des nuisances : une seule implémentation
 * de « je m'abonne au job, j'affiche la progression, je récupère et j'affiche
 * le résultat final ».
 *
 * Partagé par js/app.js (panneau Plus, variante compacte) et
 * js/components/construction-view.js (onglet Construction). La revue avait
 * relevé que ce flux existait en double et que le correctif AbortController
 * n'avait atterri que sur la copie de app.js : ici il n'y a plus qu'une copie.
 *
 * L'abandon reste la responsabilité de l'appelant : chacun garde son propre
 * AbortController, l'annule avant d'ouvrir un nouveau flux et le passe en
 * `signal`. Un flux annulé n'écrit plus rien dans le DOM, donc une trame `done`
 * périmée ne peut plus afficher les résultats du voyage précédent.
 */
var NuisanceStream = (() => {

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function aborted(signal) {
    return !!(signal && signal.aborted);
  }

  function paint(el, html) {
    if (el) el.innerHTML = html;
  }

  // Léo Plus pattern: the job lives in the BE. sessionStorage remembers which
  // one we started so a Safari lock / tab switch can reattach. Aborting the
  // SSE must not look like a product error and must not cancel Overpass.
  const JOB_KEY = 'tk-nuisance-job';
  const SEQ_KEY = 'tk-nuisance-seq';
  const CTX_KEY = 'tk-nuisance-ctx';

  let _jobId = null;
  let _lastSeq = 0;
  let _ctx = null;
  let _following = false;
  let _followAC = null;

  function stopFollow() {
    if (_followAC) {
      try { _followAC.abort(); } catch (_) {}
      _followAC = null;
    }
    _following = false;
  }

  function attachFollow(caller) {
    const ac = new AbortController();
    _followAC = ac;
    if (caller) {
      if (caller.aborted) ac.abort();
      else if (typeof caller.addEventListener === 'function') {
        caller.addEventListener('abort', () => ac.abort());
      }
    }
    return ac.signal;
  }

  function inferPanel(o) {
    if (o && o.locationId) return 'hotels';
    if (o && o.compact) return 'plus';
    return 'construction';
  }

  function ctxFrom(o) {
    return {
      tripId: (o && o.tripId) || '',
      locationId: (o && o.locationId) || '',
      compact: !!(o && o.compact),
      panel: (o && o.panel) || inferPanel(o),
    };
  }

  function persistJob() {
    try {
      if (!_jobId) {
        sessionStorage.removeItem(JOB_KEY);
        sessionStorage.removeItem(SEQ_KEY);
        sessionStorage.removeItem(CTX_KEY);
        return;
      }
      sessionStorage.setItem(JOB_KEY, _jobId);
      sessionStorage.setItem(SEQ_KEY, String(_lastSeq || 0));
      if (_ctx) sessionStorage.setItem(CTX_KEY, JSON.stringify(_ctx));
    } catch (_) {}
  }

  function rememberJob(jobId, seq, ctx) {
    _jobId = jobId || null;
    _lastSeq = seq || 0;
    _ctx = ctx || null;
    persistJob();
  }

  function clearJob() {
    _jobId = null;
    _lastSeq = 0;
    _ctx = null;
    persistJob();
  }

  function readJob() {
    if (_jobId) return { jobId: _jobId, seq: _lastSeq, ctx: _ctx };
    try {
      const id = sessionStorage.getItem(JOB_KEY);
      if (!id) return null;
      const seq = Number(sessionStorage.getItem(SEQ_KEY) || 0) || 0;
      const raw = sessionStorage.getItem(CTX_KEY);
      const ctx = raw ? JSON.parse(raw) : null;
      return { jobId: id, seq, ctx };
    } catch (_) {
      return null;
    }
  }

  function targetEl(ctx) {
    if (!ctx || typeof document === 'undefined') return null;
    if (ctx.locationId) {
      return document.querySelector('.hotel-nuisance-result[data-loc="' + ctx.locationId + '"]');
    }
    if (ctx.panel === 'plus') return document.getElementById('plus-nuisance-result');
    return document.getElementById('action-bar-results');
  }

  function panelVisible(ctx) {
    if (!ctx || typeof document === 'undefined') return false;
    const id = ctx.panel === 'hotels' ? 'tab-hotels'
      : ctx.panel === 'plus' ? 'tab-plus'
      : 'tab-construction';
    const view = document.getElementById(id);
    return !!(view && view.classList.contains('active'));
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────

  function loadingHtml(compact) {
    // Progression repérée par une classe, jamais par un id : plusieurs panneaux
    // (un par hôtel dans Résa) peuvent analyser en parallèle.
    return compact
      ? `<div class="nuisance-progress" style="font-size:.82em;color:var(--muted)">Analyse en cours...</div>`
      : `<div class="action-result-loading nuisance-progress">Analyse en cours...</div>`;
  }

  function errorHtml(msg, compact) {
    return compact
      ? `<div class="construction-error" style="font-size:.82em">${esc(msg)}</div>`
      : `<div class="construction-error">${esc(msg)}</div>`;
  }

  function neutralHtml(msg, compact) {
    return compact
      ? `<div style="font-size:.82em;color:var(--green)">${esc(msg)}</div>`
      : `<div class="action-result-ok">${esc(msg)}</div>`;
  }

  function verdictClass(verdict) {
    switch (String(verdict || '').toUpperCase()) {
      case 'ELEVE': return 'verdict-bad';
      case 'MODERE': return 'verdict-moderate';
      case 'INDETERMINE': return 'verdict-unknown';
      case 'FAIBLE': return 'verdict-ok';
      default: return 'verdict-moderate';
    }
  }

  function verdictLabel(verdict) {
    switch (String(verdict || '').toUpperCase()) {
      case 'ELEVE': return 'Nuisances élevées';
      case 'MODERE': return 'Nuisances modérées';
      case 'INDETERMINE': return 'Analyse incomplète';
      case 'FAIBLE': return 'Nuisances faibles';
      default: return String(verdict || '');
    }
  }

  function categoryHtml(cat, compact) {
    const emoji = cat.emoji || '⚠️';
    const name = cat.category || cat.name || '';
    const level = cat.level || '';
    const detail = cat.detail || '';
    const dist = (typeof cat.distance === 'number' && cat.distance > 0) ? `${Math.round(cat.distance)} m` : '';
    const count = (typeof cat.count === 'number' && cat.count > 0) ? `${cat.count}` : '';

    if (compact) {
      const bits = [level, dist].filter(Boolean).map(esc).join(' · ');
      return `<div style="margin:2px 0 2px 8px">${emoji} ${esc(name)}${bits ? ' — ' + bits : ''}</div>`;
    }

    const cls = cat.unavailable === true
      ? 'nuisance-cat nuisance-cat-unavailable'
      : (String(level).toUpperCase() === 'INDETERMINE' ? 'nuisance-cat nuisance-cat-unknown' : 'nuisance-cat');
    let html = `<div class="${cls}">`;
    html += `<span class="nuisance-emoji">${emoji}</span>`;
    html += `<span class="nuisance-cat-name">${esc(name)}</span>`;
    if (level) html += ` <span class="nuisance-level">${esc(level)}</span>`;
    if (count) html += ` <span class="nuisance-count">${esc(count)}</span>`;
    if (dist) html += ` <span class="nuisance-distance">${esc(dist)}</span>`;
    if (detail) html += `<div class="nuisance-detail">${esc(detail)}</div>`;
    html += `</div>`;
    return html;
  }

  /**
   * Dit OÙ la mesure a été prise. « Trains à 76 m » ne veut pas dire la même
   * chose devant la porte de l'hôtel et au centre de la ville qui l'entoure :
   * un verdict dont on ignore le point de mesure n'est pas exploitable.
   *
   * - `addressSource: "hotel"` → adresse du seed (candidate / to_book / booked)
   * - `addressSource: "guessed"` → point trouvé via le nom, à vérifier
   * - `addressSource: "missing"` → pas de bâtiment : on réclame hotels[].addr
   * - `addressSource: "step"` + `addressNote` → repli sur le point d'étape
   * - `step` sans note → simple lieu d'étape sans hébergement : rien à signaler
   */
  function addressHtml(loc, compact) {
    const source = String(loc.addressSource || '');
    const note = loc.addressNote || '';
    const addr = loc.addressUsed || '';

    if (source === 'hotel') {
      const txt = `📍 Analysé à l'adresse de l'hôtel${addr ? ' : ' + addr : ''}`;
      return compact
        ? `<div style="font-size:.9em;color:var(--muted);margin:2px 0 2px 8px">${esc(txt)}</div>`
        : `<div class="nuisance-address">${esc(txt)}</div>`;
    }
    if (source === 'guessed') {
      const txt = `📍 Adresse proposée (pas dans le seed)${addr ? ' : ' + addr : ''} — dites si ce n'est pas le bon bâtiment`;
      return compact
        ? `<div style="font-size:.9em;color:var(--warn,#e0a800);margin:2px 0 2px 8px">${esc(txt)}</div>`
        : `<div class="nuisance-address nuisance-address-fallback nuisance-address-guessed">${esc(txt)}</div>`;
    }
    if (source === 'missing' || note) {
      const txt = `📍 ${note || "Adresse manquante : ajoutez hotels[].addr"}`;
      const cls = source === 'missing' ? 'nuisance-address nuisance-address-missing' : 'nuisance-address nuisance-address-fallback';
      return compact
        ? `<div style="font-size:.9em;color:var(--warn,#e0a800);margin:2px 0 2px 8px">${esc(txt)}</div>`
        : `<div class="${cls}">${esc(txt)}</div>`;
    }
    return '';
  }

  function resultsHtml(parsed, compact) {
    const wrapOpen = compact ? `<div style="font-size:.82em">` : `<div class="action-results-nuisance">`;
    let html = wrapOpen;

    if (parsed.verdict) {
      const label = `${parsed.verdictEmoji ? parsed.verdictEmoji + ' ' : ''}${verdictLabel(parsed.verdict)}`;
      html += compact
        ? `<div style="font-weight:600;margin-bottom:4px">${esc(label)}</div>`
        : `<div class="nuisance-verdict ${verdictClass(parsed.verdict)}">${esc(label)}</div>`;
    }

    if (parsed.incomplete) {
      const failed = parsed.failedCategories.length
        ? ` Catégories non vérifiées : ${parsed.failedCategories.join(', ')}.`
        : '';
      const warn = `⚪ Analyse incomplète : certaines données n'ont pas pu être récupérées.${failed}`;
      html += compact
        ? `<div style="color:var(--warn,#e0a800)">${esc(warn)}</div>`
        : `<div class="nuisance-incomplete nuisance-partial-warning">${esc(warn)}</div>`;
    }

    parsed.locations.forEach(loc => {
      const name = loc.locationName || loc.name || loc.locationId || '';
      const emoji = loc.verdictEmoji || '';
      const head = `${emoji ? emoji + ' ' : ''}${name}`;
      html += compact
        ? `<div style="margin-top:6px;font-weight:600">${esc(head)}</div>`
        : `<div class="nuisance-location"><div class="nuisance-loc-name">${esc(head)}</div>`;

      html += addressHtml(loc, compact);

      const cats = Array.isArray(loc.categories) ? loc.categories : [];
      cats.forEach(cat => { html += categoryHtml(cat, compact); });

      if (!compact) {
        if (loc.recommendation) html += `<div class="nuisance-recommendation nuisance-reco">${esc(loc.recommendation)}</div>`;
        if (Array.isArray(loc.alternatives) && loc.alternatives.length) {
          html += `<div class="nuisance-alts">Alternatives : ${loc.alternatives.map(a => esc(a)).join(', ')}</div>`;
        }
        html += `</div>`;
      }
    });

    html += '</div>';
    return html;
  }

  /**
   * Restreint un résultat à un hébergement (bouton par hôtel dans Résa).
   * `id` peut être un id d'hôtel ou un id d'étape : le bouton envoie l'id
   * d'hôtel quand il en a un, et l'historique de l'app envoie l'id d'étape.
   */
  function filterLocation(parsed, id) {
    const locations = parsed.locations.filter(l =>
      (l.hotelId || '') === id
      || (l.locationId || '') === id
      || (l.locationName || l.name || '') === id);
    const verdict = ConstructionContract.worstNuisanceVerdict(locations.map(l => l.verdict));
    const failed = [];
    let incomplete = false;
    locations.forEach(l => {
      if (l.incomplete === true) incomplete = true;
      (Array.isArray(l.failedCategories) ? l.failedCategories : []).forEach(c => {
        if (failed.indexOf(c) === -1) failed.push(c);
      });
      (Array.isArray(l.categories) ? l.categories : []).forEach(cat => {
        if (cat && (cat.unavailable === true || String(cat.level).toUpperCase() === 'INDETERMINE')) incomplete = true;
      });
    });
    return {
      ok: true,
      locations,
      verdict,
      verdictEmoji: ConstructionContract.nuisanceEmoji(verdict),
      incomplete,
      failedCategories: failed,
    };
  }

  /**
   * Affiche une charge utile nuisance dans `el`. Renvoie le résultat analysé
   * ({ok:false} si l'enveloppe n'est pas reconnue : on affiche alors une erreur,
   * jamais un « aucune nuisance détectée » rassurant).
   */
  function render(el, data, opts) {
    const o = opts || {};
    const compact = !!o.compact;
    if (aborted(o.signal)) return null;

    let parsed = ConstructionContract.parseNuisance(data);
    if (parsed.ok && o.locationId) {
      parsed = filterLocation(parsed, o.locationId);
    }
    if (!parsed.ok) {
      paint(el, errorHtml("Réponse inattendue du serveur : impossible d'afficher l'analyse des nuisances.", compact));
      return parsed;
    }
    if (!parsed.locations.length) {
      // Zéro lieu analysé n'est pas un satisfecit : on le dit tel quel.
      paint(el, neutralHtml(o.locationId
        ? "Pas encore de résultat pour cet hébergement."
        : 'Aucun hébergement à analyser.', compact));
      return parsed;
    }
    paint(el, resultsHtml(parsed, compact));
    if (typeof o.onRendered === 'function') o.onRendered(parsed);
    return parsed;
  }

  // ── Abonnement SSE ──────────────────────────────────────────────────────────

  /**
   * Affiche l'erreur, mais pas au prix du travail déjà fait : le backend
   * interroge Overpass lieu par lieu et enregistre chaque résultat au fur et à
   * mesure, donc un job qui casse en route (temps imparti dépassé, redémarrage
   * du pod) laisse des résultats partiels lisibles en base. On les récupère et
   * on les affiche SOUS l'erreur — jamais à la place, l'analyse reste incomplète.
   */
  async function paintPartialOrError(el, opts, msg) {
    const o = opts || {};
    const compact = !!o.compact;
    try {
      const stored = await API.getNuisanceCheck(o.tripId);
      if (aborted(o.signal)) return;
      if (stored && stored.ok) {
        let parsed = ConstructionContract.parseNuisance(stored.data);
        if (parsed.ok && o.locationId) parsed = filterLocation(parsed, o.locationId);
        if (parsed.ok && parsed.locations.length) {
          paint(el, errorHtml(msg + ' Résultats partiels ci-dessous.', compact) + resultsHtml(parsed, compact));
          if (typeof o.onRendered === 'function') o.onRendered(parsed);
          return;
        }
      }
    } catch (_) {
      // Rien de récupérable : on s'en tient à l'erreur.
    }
    if (aborted(o.signal)) return;
    paint(el, errorHtml(msg, compact));
  }

  /**
   * SSE tombé (iPhone lock, idle proxy) : le job continue en BE. On relit le
   * store. S'il y a déjà des lieux, on les montre sans crier à l'erreur. S'il
   * n'y a rien, on laisse « Analyse en cours » — resumeIfNeeded réattachera.
   */
  async function recoverFromStore(el, opts) {
    const o = opts || {};
    if (aborted(o.signal)) return false;
    try {
      const stored = await API.getNuisanceCheck(o.tripId);
      if (aborted(o.signal)) return false;
      if (stored && stored.ok) {
        let parsed = ConstructionContract.parseNuisance(stored.data);
        if (parsed.ok && o.locationId) parsed = filterLocation(parsed, o.locationId);
        if (parsed.ok && parsed.locations.length) {
          paint(el, resultsHtml(parsed, !!o.compact));
          if (typeof o.onRendered === 'function') o.onRendered(parsed);
          return true;
        }
      }
    } catch (_) {}
    if (!aborted(o.signal) && el && !(el.querySelector && el.querySelector('.nuisance-progress'))) {
      paint(el, loadingHtml(!!o.compact));
    }
    return false;
  }

  /**
   * Suit un job d'analyse jusqu'à sa trame `done`, puis récupère et affiche le
   * résultat définitif. `signal` (obligatoire côté appelant) coupe la lecture
   * SSE — pas le job. Un abandon (onglet, lock) n'est pas une erreur produit.
   */
  async function subscribe(el, opts) {
    const o = opts || {};
    const compact = !!o.compact;
    const signal = attachFollow(o.signal);
    if (o.jobId) rememberJob(o.jobId, o.after || _lastSeq || 0, ctxFrom(o));

    try {
      for await (const frame of API.leoJobStream(o.jobId, o.after || 0, { signal })) {
        if (aborted(signal)) return;

        if (frame && frame.data && typeof frame.data.seq === 'number') {
          _lastSeq = frame.data.seq;
          persistJob();
        }

        if (frame.event === 'done') {
          const final = await API.getNuisanceCheck(o.tripId);
          if (aborted(signal)) return;
          if (final.ok) {
            render(el, final.data, o);
          } else {
            paint(el, errorHtml('Analyse terminée mais résultats indisponibles : ' + (final.error || 'HTTP ' + final.status), compact));
          }
          clearJob();
          return;
        }

        if (frame.event === 'error') {
          // Une annulation volontaire n'est pas une erreur à afficher.
          if ((frame.data && frame.data.code === 'cancelled') || aborted(signal)) return;
          await paintPartialOrError(el, Object.assign({}, o, { signal }), (frame.data && frame.data.error) || "Erreur lors de l'analyse");
          clearJob();
          return;
        }

        if (frame.event === 'delta' || frame.event === 'progress') {
          const text = (frame.data && (frame.data.text || frame.data.location || frame.data.message)) || '';
          const progressEl = (el && el.querySelector && el.querySelector('.nuisance-progress')) || el;
          if (text && progressEl) progressEl.textContent = 'Analyse : ' + text;
        }
      }
      // Stream closed without `done` (Safari lock, proxy idle). Job still runs.
      if (!aborted(signal)) await recoverFromStore(el, Object.assign({}, o, { signal }));
    } catch (e) {
      if (aborted(signal)) return;
      await recoverFromStore(el, Object.assign({}, o, { signal }));
    }
  }

  /**
   * Point d'entrée unique après un POST nuisance-check : job asynchrone -> on
   * s'abonne, résultat synchrone -> on affiche directement.
   */
  function start(el, opts) {
    const o = opts || {};
    if (o.data && o.data.jobId) {
      stopFollow();
      rememberJob(o.data.jobId, 0, ctxFrom(o));
      paint(el, loadingHtml(!!o.compact));
      _following = true;
      return subscribe(el, Object.assign({}, o, { jobId: o.data.jobId, after: 0 }))
        .finally(() => { _following = false; });
    }
    render(el, o.data, o);
    return Promise.resolve();
  }

  /**
   * Réattache le job mémorisé quand l'onglet est de nouveau visible.
   * No-op si le panneau n'est pas à l'écran (on ne repeint pas un onglet caché).
   */
  function resumeIfNeeded() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false;
    const saved = readJob();
    if (!saved || !saved.jobId || !saved.ctx) return false;
    if (!panelVisible(saved.ctx)) return false;
    const el = targetEl(saved.ctx);
    if (!el) return false;
    if (_following) return true;
    _jobId = saved.jobId;
    _lastSeq = saved.seq || 0;
    _ctx = saved.ctx;
    _following = true;
    const o = Object.assign({}, saved.ctx, {
      jobId: saved.jobId,
      after: saved.seq || 0,
    });
    subscribe(el, o).finally(() => { _following = false; });
    return true;
  }

  /**
   * Recharge le dernier résultat persisté (construction_checks). Un job
   * terminé n'est plus dans sessionStorage : sans ça, quitter l'onglet
   * ou un refreshFromBackend (touchTrip en fin d'analyse) vide le panneau.
   * No-op s'il n'y a rien en base — on ne peint pas « aucun hébergement ».
   */
  async function hydrate(el, opts) {
    const o = opts || {};
    if (!el || !o.tripId || typeof API === 'undefined' || !API.getNuisanceCheck) return null;
    if (aborted(o.signal)) return null;
    try {
      const stored = await API.getNuisanceCheck(o.tripId);
      if (aborted(o.signal)) return null;
      if (!stored || !stored.ok) return null;
      let parsed = ConstructionContract.parseNuisance(stored.data);
      if (parsed.ok && o.locationId) parsed = filterLocation(parsed, o.locationId);
      if (!parsed.ok || !parsed.locations.length) return null;
      paint(el, resultsHtml(parsed, !!o.compact));
      if (typeof o.onRendered === 'function') o.onRendered(parsed);
      return parsed;
    } catch (_) {
      return null;
    }
  }

  /**
   * Une GET pour tout le voyage, puis peinture de chaque carte hôtel.
   */
  async function hydrateHotels(root, tripId) {
    if (!root || !tripId || typeof API === 'undefined' || !API.getNuisanceCheck) return;
    const nodes = root.querySelectorAll && root.querySelectorAll('.hotel-nuisance-result[data-loc]');
    if (!nodes || !nodes.length) return;
    try {
      const stored = await API.getNuisanceCheck(tripId);
      if (!stored || !stored.ok) return;
      const parsed = ConstructionContract.parseNuisance(stored.data);
      if (!parsed.ok || !parsed.locations.length) return;
      nodes.forEach((el) => {
        const id = el.getAttribute('data-loc');
        if (!id) return;
        const one = filterLocation(parsed, id);
        if (!one.locations.length) return;
        paint(el, resultsHtml(one, true));
      });
    } catch (_) {}
  }

  return {
    render, subscribe, start, resumeIfNeeded, stopFollow, clearJob,
    hydrate, hydrateHotels,
    verdictLabel, filterLocation, paintPartialOrError,
  };
})();
;
/* ==== js/components/construction-view.js ==== */
/**
 * construction-view.js — Construction mode tab view.
 * Sections: PhaseBar, TravelerContextBox, GuidedForm, Leo chat widget.
 */
var ConstructionView = (() => {

  let _leoInstance = null;
  // Un seul flux nuisances vivant à la fois : annulé avant d'en ouvrir un autre,
  // et au ré-affichage de la vue ou au changement de voyage.
  let _nuisanceAbort = null;
  let _currentTripId = null;
  // Voyageurs du dernier profil chargé (repli admin si travelers[] absent).
  let _people = null;
  // Dernière erreur de transition : reste affichée jusqu'à dismiss / succès /
  // changement de voyage. Le setTimeout 6 s faisait disparaître les blocages QA
  // avant qu'on puisse les lire (surtout une liste).
  let _phaseError = null;

  const PIN_LABEL = 'Épingler dans le seed';
  const PROFILE_SUBMIT_LABEL = 'Envoyer à Léo';

  // La base de règles administratives ne couvre qu'une douzaine de destinations et
  // quelques listes de nationalités. Zéro item pour un passeport ne veut donc PAS
  // dire « rien à faire » : ça veut dire « pas de règle connue ». Un ✅ vert à cet
  // endroit annoncerait à un passeport chinois parti aux États-Unis qu'il n'a
  // aucune démarche, alors qu'il lui faut un visa B1/B2. Le silence d'un moteur
  // partiel ne se rend jamais en vert, ici comme pour les nuisances.
  const ADMIN_UNKNOWN_TRAVELER = "⚠️ Aucune règle connue pour ce passeport : à vérifier auprès du consulat ou de l'ambassade du pays de destination.";
  const ADMIN_UNKNOWN_TRIP = "⚠️ Aucune règle connue pour cette destination : à vérifier auprès des sources officielles. Ce silence n'est pas un feu vert.";
  // Limite assumée du moteur : la PRÉSENCE d'un item est décidée sur l'union des
  // nationalités du voyage (un seul passeport américain dans le groupe retire
  // l'ESTA pour tout le monde), seule son ATTRIBUTION est par voyageur. Tant que
  // le backend ne produit pas les items par voyageur, la personne concernée doit
  // le lire dans le panneau, pas seulement dans un doc de suivi.
  const ADMIN_UNION_NOTE = "Liste indicative : la présence d'un item est calculée sur l'ensemble des nationalités du voyage, pas passeport par passeport. Un item peut donc manquer pour l'un si un autre passeport du groupe en dispense.";
  // `countries` vide, côté admin comme côté santé, veut dire que DetectCountries
  // n'a reconnu aucun pays dans le seed : le moteur n'a rien analysé du tout.
  // C'est un cas différent de la destination connue sans rien à signaler, que la
  // spec (construction/SPEC.md §7.2) autorise à rester silencieuse. Annoncer
  // « rien pour cette destination » affirmerait une destination que le backend
  // n'a jamais eue.
  const UNKNOWN_DESTINATION = "⚠️ Destination non identifiée : aucun pays n'a pu être déduit du voyage, donc aucun contrôle n'a été fait. À compléter dans le seed, puis relancer.";

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function tripOf(tripData) {
    return (tripData && tripData.trip) || {};
  }

  function localTripData(tripId) {
    if (typeof Store === 'undefined' || !Store.getTripData) return null;
    return Store.getTripData(tripId || _currentTripId) || null;
  }

  // Construction methodology phases (SPEC §5). Distinct from trip.phases,
  // which are the geographic loop (Québec & Charlevoix, Gaspésie, …).
  const CONSTRUCTION_PHASES = [
    { n: 1, short: 'Ph1', name: 'Idéation' },
    { n: 2, short: 'Ph2', name: 'Tracé' },
    { n: 3, short: 'Ph3', name: 'Hôtels' },
    { n: 4, short: 'Ph4', name: 'Activités' },
    { n: 5, short: 'Live', name: 'Live' },
  ];

  function formatTripDates(start, end, days) {
    const parts = [];
    if (start) parts.push(start);
    if (end && end !== start) parts.push(end);
    const range = parts.join(' → ');
    if (days) return range ? `${range} · ${days} j` : `${days} j`;
    return range;
  }

  // Seed loop already on the device (Route tab). Construction used to ignore
  // it and only show an empty GuidedForm + generic Ph1–Ph4 pills.
  function renderTripLoop(tripData) {
    const trip = tripOf(tripData);
    const name = trip.name || '';
    const c = trip.construction || {};
    const dates = c.dates || {};
    const start = dates.startDate || trip.startDate || '';
    const end = trip.endDate || '';
    const days = Number(dates.days) || (tripData && tripData.days && tripData.days.length) || 0;
    const phases = Array.isArray(trip.phases) ? trip.phases : [];
    if (!name && !phases.length && !start && !days) return '';

    let phasesHtml = '';
    if (phases.length) {
      phasesHtml = '<ol class="construction-loop-phases">';
      phases.forEach((p) => {
        const r = (p && (p.range || p.days)) || [];
        const span = (Array.isArray(r) && r.length === 2) ? `J${r[0]}–J${r[1]}` : '';
        const label = (p && (p.name || p.label)) || '';
        if (!label) return;
        phasesHtml += `<li><span class="loop-phase-name">${esc(label)}</span>`;
        if (span) phasesHtml += ` <span class="loop-phase-range">${esc(span)}</span>`;
        phasesHtml += '</li>';
      });
      phasesHtml += '</ol>';
    }

    const dateLine = formatTripDates(start, end, days);
    return `<div class="construction-trip-box" id="construction-trip-box">
      <h3>${esc(trip.emoji || '🗺️')} ${esc(name || 'Voyage')}</h3>
      ${dateLine ? `<p class="construction-trip-dates">${esc(dateLine)}</p>` : ''}
      ${phasesHtml}
    </div>`;
  }

  function prefillGuidedForm(tripData) {
    const trip = tripOf(tripData);
    const dates = (trip.construction && trip.construction.dates) || {};
    const start = dates.startDate || trip.startDate || '';
    const days = dates.days || (tripData && tripData.days && tripData.days.length) || '';
    const dest = (trip.destination && (trip.destination.name || trip.destination)) || trip.name || '';
    const startEl = document.getElementById('guided-start-date');
    const daysEl = document.getElementById('guided-nb-days');
    const destEl = document.getElementById('guided-destination');
    if (startEl && start) startEl.value = start;
    if (daysEl && days) daysEl.value = days;
    if (destEl && dest) destEl.value = dest;
  }

  function abortNuisanceStream() {
    if (_nuisanceAbort) {
      _nuisanceAbort.abort();
      _nuisanceAbort = null;
    }
    if (typeof NuisanceStream !== 'undefined' && NuisanceStream.stopFollow) {
      NuisanceStream.stopFollow();
    }
  }

  function peopleForTrip(tripId) {
    if (_people) return _people;
    if (typeof Store !== 'undefined' && Store.getTripData) {
      const data = Store.getTripData(tripId);
      if (data && data.people) return data.people;
    }
    return null;
  }

  // ── PhaseBar ────────────────────────────────────────────────────────────────

  function renderPhaseBarLoading() {
    return `<div class="construction-phase-bar" id="construction-phase-bar">
      <div class="construction-loading">Chargement phase...</div>
    </div>`;
  }

  function currentPhaseOf(data) {
    // Le backend démarre à 0 (voyage non encore entré en construction) et 0 est
    // falsy : `(data && data.phase) || 1` faisait donc sauter la phase 1.
    const phase = ConstructionContract.readPhase(data);
    return phase === null ? 1 : phase;
  }

  /** Spec modes: ideation (0–1), route (2), activities (3–4), profile-edit (form). */
  function leoModeForPhase(phase) {
    const n = Number(phase);
    if (!Number.isFinite(n) || n <= 1) return 'construction:ideation';
    if (n === 2) return 'construction:route';
    return 'construction:activities';
  }

  function phaseModeFromDom() {
    const bar = document.getElementById('construction-phase-bar');
    const raw = bar && bar.getAttribute('data-phase');
    return leoModeForPhase(raw == null ? 1 : Number(raw));
  }

  function mountConstructionLeo(mode) {
    const wanted = mode || 'construction:ideation';
    const paint = () => {
      if (typeof LeoChatStream === 'undefined' || !LeoChatStream.create) return;
      if (_leoInstance && _leoInstance.mode !== wanted) {
        try { _leoInstance.destroy(); } catch (_) {}
        _leoInstance = null;
      }
      if (!_leoInstance) {
        _leoInstance = LeoChatStream.create({
          prefix: 'construction-leo',
          mode: wanted,
          storageKey: 'tk-construction-leo',
        });
      }
      const leoEl = document.getElementById('construction-leo-section');
      if (leoEl) {
        LeoChatStream.loadStatus().then(() => {
          if (_leoInstance) _leoInstance.renderSection(leoEl);
        });
      }
    };
    if (typeof LeoChatStream !== 'undefined' && LeoChatStream.create) {
      paint();
      return;
    }
    if (typeof App !== 'undefined' && typeof App.ensureEdgeBundle === 'function') {
      App.ensureEdgeBundle().then(ok => { if (ok) paint(); });
    }
  }

  function blockerText(b) {
    if (b && typeof b === 'object') {
      const code = b.code ? `${b.code} : ` : '';
      return code + (b.message || b.detail || '');
    }
    return String(b == null ? '' : b);
  }

  function constructionPhaseLabel(phase) {
    if (phase <= 0) return 'Construction pas encore démarrée';
    const meta = CONSTRUCTION_PHASES.find(p => p.n === phase);
    if (phase === 5) return 'Phase 5 — Live';
    return meta ? `Phase ${phase} — ${meta.name}` : `Phase ${phase}`;
  }

  function renderPhaseBarContent(data) {
    const phase = currentPhaseOf(data);
    const lastQA = data && data.lastQA;
    const blockers = (lastQA && Array.isArray(lastQA.blockers)) ? lastQA.blockers : [];

    let dotsHtml = '<div class="phase-dots">';
    CONSTRUCTION_PHASES.forEach(p => {
      const cls = p.n < phase ? 'phase-dot done' : (p.n === phase ? 'phase-dot active' : 'phase-dot');
      dotsHtml += `<span class="${cls}">${esc(p.short)}</span>`;
    });
    dotsHtml += '</div>';

    let blockersHtml = '';
    if (blockers.length) {
      blockersHtml = '<div class="phase-blockers"><strong>Blocages :</strong><ul>';
      blockers.forEach(b => { blockersHtml += `<li>${esc(blockerText(b))}</li>`; });
      blockersHtml += '</ul></div>';
    }

    return `<div class="construction-phase-bar" id="construction-phase-bar" data-phase="${phase}">
      <div class="phase-header">
        <span class="phase-label">${esc(constructionPhaseLabel(phase))}</span>
        ${dotsHtml}
      </div>
      ${blockersHtml}
      <button class="btn btn-primary phase-next-btn" id="construction-phase-next"
        ${phase >= 5 ? 'disabled' : ''}>Phase suivante</button>
      ${phaseErrorBoxHtml()}
    </div>`;
  }

  function renderPhaseBarError(msg) {
    return `<div class="construction-phase-bar" id="construction-phase-bar">
      <div class="construction-error">${esc(msg)}</div>
    </div>`;
  }

  function localConstructionState(tripId) {
    const td = localTripData(tripId);
    const c = td && td.trip && td.trip.construction;
    return c && typeof c === 'object' ? c : null;
  }

  function rememberConstruction(tripId, data) {
    if (!tripId || !data || typeof Store === 'undefined' || !Store.getTripData || !Store.setTripData) return;
    const td = Store.getTripData(tripId);
    if (!td) return;
    const copy = Object.assign({}, data);
    delete copy.seedPush;
    td.trip = td.trip || {};
    td.trip.construction = Object.assign({}, td.trip.construction, copy);
    Store.setTripData(tripId, td);
  }

  async function loadPhaseBar(tripId) {
    const el = document.getElementById('construction-phase-bar');
    if (!el) return;
    const local = localConstructionState(tripId);
    const res = await API.getConstruction(tripId);
    if (!res.ok) {
      if (local) {
        el.outerHTML = renderPhaseBarContent(local);
        bindPhaseNext(tripId, local);
        bindPhaseErrorDismiss();
        mountConstructionLeo(leoModeForPhase(currentPhaseOf(local)));
        return;
      }
      el.outerHTML = renderPhaseBarError(res.status === 404 ? 'Construction non initialisée' : 'Erreur chargement phase');
      return;
    }
    const data = Object.assign({}, local || {}, res.data || {});
    rememberConstruction(tripId, data);
    el.outerHTML = renderPhaseBarContent(data);
    bindPhaseNext(tripId, data);
    bindPhaseErrorDismiss();
    mountConstructionLeo(leoModeForPhase(currentPhaseOf(data)));
  }

  function bindPhaseNext(tripId, data) {
    const btn = document.getElementById('construction-phase-next');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      // Phase 0 (défaut backend) -> on demande bien la phase 1.
      const nextPhase = currentPhaseOf(data) + 1;
      btn.disabled = true;
      btn.textContent = 'Transition...';
      const res = await API.transitionPhase(tripId, nextPhase, false);
      if (res.ok) {
        const payload = Object.assign({}, res.data || {});
        const seedPush = payload.seedPush;
        delete payload.seedPush;
        rememberConstruction(tripId, payload);
        if (seedPush && seedPush.ok === false) {
          _phaseError = { tripId: tripId || _currentTripId, body: seedPushWarningBody(seedPush) };
        } else {
          clearPhaseError();
        }
        const container = document.getElementById('construction-phase-bar');
        if (container) {
          container.outerHTML = renderPhaseBarLoading();
          await loadPhaseBar(tripId);
        }
      } else {
        btn.disabled = false;
        btn.textContent = 'Phase suivante';
        showTransitionError(tripId, res);
      }
    });
  }

  function phaseErrorBoxHtml() {
    if (!_phaseError || !_phaseError.body || _phaseError.tripId !== _currentTripId) return '';
    return `<div class="phase-error-box phase-transition-error" id="phase-transition-error" role="alert">
      <div class="phase-error-box-head">
        <div class="phase-error-box-body">${_phaseError.body}</div>
        <button type="button" class="phase-error-dismiss" id="phase-transition-error-dismiss" aria-label="Fermer">×</button>
      </div>
    </div>`;
  }

  function clearPhaseError() {
    _phaseError = null;
    const el = document.getElementById('phase-transition-error');
    if (el) el.remove();
  }

  function bindPhaseErrorDismiss() {
    const btn = document.getElementById('phase-transition-error-dismiss');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => clearPhaseError());
  }

  /**
   * Un 409 porte ses blocages structurés dans res.data.blockers : on les rend
   * avec les mêmes badges que la liste QA. Le JSON brut ne doit jamais atterrir
   * dans le DOM (revue finding 12). La boîte reste jusqu'à fermeture, une
   * transition réussie, ou un changement de voyage — pas un timer.
   */
  function showTransitionError(tripId, res) {
    let body = '';
    const blockers = ConstructionContract.parseBlockers(res.data);
    if (res.status === 409 && blockers && blockers.length) {
      body = `<div class="phase-blocked-title">Transition bloquée : ${blockers.length} blocage${blockers.length > 1 ? 's' : ''}</div>`
        + violationsHtml(blockers);
    } else if (res.status === 403) {
      body = esc('Transition forcée réservée à un administrateur.');
    } else {
      const raw = (res.data && typeof res.data.error === 'string') ? res.data.error : (res.error || '');
      body = esc(errorLabel(raw) || 'Erreur transition');
    }
    _phaseError = { tripId: tripId || _currentTripId, body };
    const bar = document.getElementById('construction-phase-bar');
    const existing = document.getElementById('phase-transition-error');
    const html = phaseErrorBoxHtml();
    if (existing) existing.outerHTML = html;
    else if (bar) bar.insertAdjacentHTML('beforeend', html);
    bindPhaseErrorDismiss();
  }

  function seedPushWarningBody(seedPush) {
    const detail = (seedPush && typeof seedPush.error === 'string' && seedPush.error)
      ? seedPush.error
      : 'écriture git refusée';
    return `<div class="phase-blocked-title">Phase enregistrée, pas dans le repo seed</div>`
      + `<p>${esc('La phase est à jour dans TripKit, mais le fichier seed n\'a pas été modifié : ' + detail)}</p>`;
  }

  /** Traduit les codes d'erreur du backend en phrase lisible. */
  function errorLabel(code) {
    switch (code) {
      case 'transition_blocked': return 'Transition bloquée par la QA.';
      case 'admin_required': return 'Transition forcée réservée à un administrateur.';
      case 'not_implemented': return 'Pas encore disponible.';
      case 'missing_hermes_key': return 'Léo n\'est pas configuré (clé Hermes).';
      default: return code;
    }
  }

  // ── TravelerContextBox ──────────────────────────────────────────────────────

  function renderContextLoading() {
    return `<div class="construction-context-box" id="construction-context-box">
      <div class="construction-loading">Chargement profil voyageurs...</div>
    </div>`;
  }

  function renderContextContent(data) {
    const people = data.people || {};
    // Mémorisé pour la checklist admin par voyageur.
    _people = data.people || null;
    const profile = data.travelProfile || {};
    const ctx = data.travelersContext || {};
    const sources = data.sources || [];

    // Group composition
    let adults = 0;
    let children = [];
    Object.values(people).forEach(p => {
      if (p.age && p.age < 18) {
        children.push(p);
      } else if (p) {
        adults++;
      }
    });
    let groupLine = adults || children.length
      ? `${adults} adulte${adults > 1 ? 's' : ''}${children.length ? `, ${children.length} enfant${children.length > 1 ? 's' : ''}` : ''}`
      : '';
    if (!groupLine) {
      const travelers = tripOf(localTripData()).travelers;
      if (Array.isArray(travelers) && travelers.length) {
        groupLine = `${travelers.length} voyageur${travelers.length > 1 ? 's' : ''}`;
      }
    }
    const childAges = children.length
      ? ` (${children.map(c => c.age ? c.age + ' ans' : '').filter(Boolean).join(', ')})`
      : '';

    const natsPeople = ConstructionContract.normalizePeople(people);
    const natsLine = natsPeople
      .filter(p => p.nationalities.length)
      .map(p => `${p.name} (${p.nationalities.join(', ')})`)
      .join(' · ');

    // travel-profile.js (famille Jullien) stores style under travelStyle /
    // budgetRules. Older fixtures still put pace at the root.
    const style = profile.travelStyle || {};
    const pace = style.pace || profile.pace || ctx.pace || '';
    const maxDriving = style.maxDrivingPerDay || profile.maxDrivingPerDay || ctx.maxDrivingPerDay || '';
    const budgetRules = profile.budgetRules || {};
    const acc = budgetRules.accommodation || {};
    const budget = profile.budgetRange || ctx.budgetRange
      || (acc.maxPerNight ? `hébergement ≤ ${acc.maxPerNight} ${acc.currency || '€'}/nuit` : '');

    // Interests
    const interests = profile.interests || ctx.interests || {};
    let interestsHtml = '';
    if (interests && typeof interests === 'object') {
      const entries = Object.entries(interests);
      if (entries.length) {
        interestsHtml = '<div class="ctx-interests"><strong>Centres d\'intérêt :</strong><ul>';
        entries.forEach(([person, prefs]) => {
          const likes = (prefs && prefs.likes) ? (Array.isArray(prefs.likes) ? prefs.likes.join(', ') : prefs.likes) : '';
          const dislikes = (prefs && prefs.dislikes) ? (Array.isArray(prefs.dislikes) ? prefs.dislikes.join(', ') : prefs.dislikes) : '';
          let line = `<strong>${esc(person)}</strong>`;
          if (likes) line += ` — aime : ${esc(likes)}`;
          if (dislikes) line += ` — n'aime pas : ${esc(dislikes)}`;
          interestsHtml += `<li>${line}</li>`;
        });
        interestsHtml += '</ul></div>';
      }
    }

    // Health notes
    const health = profile.healthNotes || ctx.healthNotes || '';
    const healthHtml = health ? `<div class="ctx-health"><strong>Santé :</strong> ${esc(health)}</div>` : '';

    // Sources
    const sourcesHtml = sources.length
      ? `<div class="ctx-sources"><em>Sources : ${esc(sources.join(', '))}</em></div>`
      : '';

    return `<div class="construction-context-box" id="construction-context-box">
      <div class="ctx-header">
        <h3>Voyageurs</h3>
        <button class="btn btn-sm" id="construction-ctx-edit" title="Modifier le profil">Modifier</button>
      </div>
      <div class="ctx-group">${esc(groupLine)}${esc(childAges)}</div>
      ${natsLine ? `<div class="ctx-nats"><strong>Nationalités :</strong> ${esc(natsLine)}</div>` : ''}
      ${pace ? `<div class="ctx-style"><strong>Rythme :</strong> ${esc(pace)}</div>` : ''}
      ${maxDriving ? `<div class="ctx-style"><strong>Conduite max/jour :</strong> ${esc(maxDriving)}</div>` : ''}
      ${budget ? `<div class="ctx-style"><strong>Budget :</strong> ${esc(budget)}</div>` : ''}
      ${interestsHtml}
      ${healthHtml}
      ${sourcesHtml}
    </div>`;
  }

  function renderContextNotConfigured() {
    return `<div class="construction-context-box" id="construction-context-box">
      <div class="ctx-empty">
        <p>Profil non configuré</p>
        <p class="ctx-hint">Renseignez le profil voyageurs pour aider Léo à personnaliser le voyage.</p>
        <button class="btn btn-sm" id="construction-ctx-edit">Configurer</button>
      </div>
    </div>`;
  }

  function renderContextError(msg) {
    return `<div class="construction-context-box" id="construction-context-box">
      <div class="construction-error">${esc(msg)}</div>
    </div>`;
  }

  function localProfileFallback(tripId) {
    const td = localTripData(tripId);
    if (!td) return null;
    const profile = td.travelProfile || (td.trip && td.trip.travelProfile) || null;
    const people = td.people || null;
    if (!profile && !people) return null;
    return { people: people || {}, travelProfile: profile || {}, sources: ['seed'] };
  }

  function hasProfileContent(data) {
    if (!data) return false;
    if (data.people && Object.keys(data.people).length) return true;
    if (data.travelProfile && Object.keys(data.travelProfile).length) return true;
    if (data.travelersContext && Object.keys(data.travelersContext).length) return true;
    return false;
  }

  async function loadTravelerContext(tripId) {
    const el = document.getElementById('construction-context-box');
    if (!el) return;
    const local = localProfileFallback(tripId);
    const res = await API.getTravelProfile(tripId);
    if (!res.ok) {
      if (local && hasProfileContent(local)) {
        el.outerHTML = renderContextContent(local);
        bindContextEdit();
        return;
      }
      if (res.status === 404) {
        el.outerHTML = renderContextNotConfigured();
      } else {
        el.outerHTML = renderContextError('Erreur chargement profil');
      }
      bindContextEdit();
      return;
    }
    const data = Object.assign({}, local || {}, res.data || {});
    if (local && local.travelProfile && !hasProfileContent({ travelProfile: data.travelProfile })) {
      data.travelProfile = local.travelProfile;
    }
    if (local && local.people && !hasProfileContent({ people: data.people })) {
      data.people = local.people;
    }
    if (!hasProfileContent(data)) {
      el.outerHTML = renderContextNotConfigured();
      bindContextEdit();
      return;
    }
    el.outerHTML = renderContextContent(data);
    bindContextEdit();
  }

  function bindContextEdit() {
    const btn = document.getElementById('construction-ctx-edit');
    if (!btn) return;
    btn.addEventListener('click', () => {
      showProfileEditForm();
    });
  }

  // ── Profile Edit Form ─────────────────────────────────────────────────────

  function showProfileEditForm() {
    const box = document.getElementById('construction-context-box');
    if (!box) return;

    // Prevent duplicate forms
    if (document.getElementById('profile-edit-form')) return;

    const formHtml = `<div class="profile-edit-overlay" id="profile-edit-overlay">
      <form id="profile-edit-form" class="profile-edit-form">
        <h4>Modifier le profil voyageur</h4>
        <div class="guided-field">
          <label for="profile-edit-target">Section à modifier</label>
          <select id="profile-edit-target" name="target" required>
            <option value="">-- Choisir --</option>
            <option value="travelStyle">Style de voyage</option>
            <option value="budgetRules">Budget</option>
            <option value="interests">Centres d'intérêt</option>
            <option value="mealPattern">Repas</option>
            <option value="lessons">Leçons apprises</option>
          </select>
        </div>
        <div class="guided-field">
          <label for="profile-edit-text">Description de la modification</label>
          <textarea id="profile-edit-text" name="text" rows="3"
            placeholder="Ex : nous préférons un rythme lent avec des pauses fréquentes..." required></textarea>
        </div>
        <div class="profile-edit-actions">
          <button type="submit" class="btn btn-primary" id="profile-edit-submit">${PROFILE_SUBMIT_LABEL}</button>
          <button type="button" class="btn btn-sm" id="profile-edit-cancel">Annuler</button>
        </div>
        <div id="profile-edit-status" class="profile-edit-status"></div>
      </form>
    </div>`;

    box.insertAdjacentHTML('beforeend', formHtml);

    mountConstructionLeo('construction:profile-edit');

    document.getElementById('profile-edit-cancel').addEventListener('click', () => {
      const overlay = document.getElementById('profile-edit-overlay');
      if (overlay) overlay.remove();
      mountConstructionLeo(phaseModeFromDom());
    });

    document.getElementById('profile-edit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      handleProfileEditSubmit();
    });
  }

  async function handleProfileEditSubmit() {
    const targetEl = document.getElementById('profile-edit-target');
    const textEl = document.getElementById('profile-edit-text');
    const submitBtn = document.getElementById('profile-edit-submit');
    const statusEl = document.getElementById('profile-edit-status');

    const target = targetEl ? targetEl.value : '';
    const text = textEl ? textEl.value.trim() : '';

    if (!target || !text) return;

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : null;
    if (!tripId) return;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'En cours...';
    statusEl.textContent = 'Envoi de la demande...';
    statusEl.className = 'profile-edit-status loading';

    const res = await API.createProfileRequest(tripId, target, text);

    // 501 : la demande n'est pas traitée, on ne peint aucun succès.
    if (isNotImplemented(res)) {
      statusEl.textContent = 'Pas encore disponible : ' + notImplementedDetail(res);
      statusEl.className = 'profile-edit-status unavailable';
      submitBtn.disabled = true;
      submitBtn.title = notImplementedDetail(res);
      submitBtn.textContent = 'Pas encore disponible';
      return;
    }

    if (!res.ok) {
      const msg = (res.status === 503)
        ? (errorLabel(res.data && res.data.code) || res.error || 'Léo n\'est pas configuré.')
        : (res.error || 'Erreur lors de la demande');
      statusEl.textContent = msg;
      statusEl.className = 'profile-edit-status error';
      submitBtn.disabled = false;
      submitBtn.textContent = PROFILE_SUBMIT_LABEL;
      return;
    }

    const jobId = res.data && res.data.jobId;
    if (!jobId) {
      statusEl.textContent = 'Réponse inattendue du serveur';
      statusEl.className = 'profile-edit-status error';
      submitBtn.disabled = false;
      submitBtn.textContent = PROFILE_SUBMIT_LABEL;
      return;
    }

    statusEl.textContent = 'Léo travaille sur la modification...';
    statusEl.className = 'profile-edit-status loading';

    // Subscribe to job stream
    subscribeProfileJob(jobId, tripId);
  }

  function profileEditFailed(statusEl, msg) {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.className = 'profile-edit-status error';
    }
    const submitBtn = document.getElementById('profile-edit-submit');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Réessayer';
    }
  }

  async function subscribeProfileJob(jobId, tripId) {
    const statusEl = document.getElementById('profile-edit-status');
    let done = false;

    try {
      for await (const frame of API.leoJobStream(jobId, 0)) {
        if (frame.event === 'done') {
          done = true;
          break;
        }
        if (frame.event === 'error') {
          profileEditFailed(statusEl, (frame.data && frame.data.error) || 'Erreur Léo');
          return;
        }
        // delta events - show progress
        if (frame.event === 'delta' && frame.data && frame.data.text && statusEl) {
          statusEl.textContent = 'Léo : ' + frame.data.text.slice(0, 80);
        }
      }
    } catch (e) {
      profileEditFailed(statusEl, 'Connexion perdue. Réessaie.');
      return;
    }

    // Le succès ne s'affiche qu'après une vraie trame `done`.
    if (!done) {
      profileEditFailed(statusEl, 'Flux interrompu avant la fin. Réessaie.');
      return;
    }

    if (statusEl) {
      statusEl.textContent = 'Modification effectuée !';
      statusEl.className = 'profile-edit-status success';
    }
    // Refresh the TravelerContextBox
    setTimeout(() => {
      const overlay = document.getElementById('profile-edit-overlay');
      if (overlay) overlay.remove();
      loadTravelerContext(tripId);
    }, 1200);
  }

  // ── ActionBar (checks: QA, Nuisances, Admin, Santé) ──────────────────────

  function renderActionBar() {
    return `<div class="construction-action-bar" id="construction-action-bar">
      <h3>Vérifications</h3>
      <div class="action-bar-buttons">
        <button class="btn btn-sm action-bar-btn" id="action-qa" data-action="qa">QA</button>
        <button class="btn btn-sm action-bar-btn" id="action-nuisances" data-action="nuisances">Nuisances</button>
        <button class="btn btn-sm action-bar-btn" id="action-admin" data-action="admin">Admin</button>
        <button class="btn btn-sm action-bar-btn" id="action-sante" data-action="sante">Santé</button>
      </div>
      <div id="action-bar-results"></div>
    </div>`;
  }

  function bindActionBar(tripId) {
    const qaBtn = document.getElementById('action-qa');
    const nuiBtn = document.getElementById('action-nuisances');
    const adminBtn = document.getElementById('action-admin');
    const santeBtn = document.getElementById('action-sante');

    if (qaBtn) qaBtn.addEventListener('click', () => handleQA(tripId));
    if (nuiBtn) nuiBtn.addEventListener('click', () => handleNuisances(tripId));
    if (adminBtn) adminBtn.addEventListener('click', () => handleAdmin(tripId));
    if (santeBtn) santeBtn.addEventListener('click', () => handleSante(tripId));
  }

  function setButtonLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn._origText = btn.textContent;
      btn.textContent = '...';
    } else {
      btn.disabled = false;
      btn.textContent = btn._origText || btn.textContent;
    }
  }

  function showResults(html) {
    const el = document.getElementById('action-bar-results');
    if (el) el.innerHTML = html;
  }

  // ── QA check ──

  /** Liste de QAViolation avec badges — partagée par le panneau QA et les blocages 409. */
  function violationsHtml(violations) {
    let html = '';
    ConstructionContract.sortViolations(violations).forEach(item => {
      const sev = String((item && item.severity) || 'info').toLowerCase();
      const cls = (sev === 'blocker' || sev === 'red' || sev === 'error') ? 'qa-red'
        : (sev === 'warning' || sev === 'yellow') ? 'qa-yellow' : 'qa-info';
      const badge = cls === 'qa-red' ? '🔴' : cls === 'qa-yellow' ? '🟡' : 'ℹ️';
      html += `<div class="qa-item ${cls}">`;
      html += `<span class="qa-badge">${badge}</span>`;
      html += `<span class="qa-code">${esc(item && item.code)}</span>`;
      if (item && item.dayNum != null) html += ` <span class="qa-day">J${esc(item.dayNum)}</span>`;
      html += `<div class="qa-msg">${esc((item && (item.message || item.msg)) || '')}</div>`;
      if (item && item.detail) html += `<div class="qa-detail">${esc(item.detail)}</div>`;
      html += `</div>`;
    });
    return html;
  }

  /** Erreur explicite : une enveloppe non reconnue ne doit jamais rassurer. */
  function showUnrecognized(what) {
    showResults(`<div class="construction-error unrecognized-payload">Réponse inattendue du serveur : impossible d'afficher ${esc(what)}.</div>`);
  }

  function paintQA(parsed) {
    if (!parsed.violations.length) {
      showResults(`<div class="action-result-ok">Aucun problème détecté</div>`);
      return;
    }
    const n = parsed.violations.length;
    let html = '<div class="action-results-qa">';
    html += `<div class="action-results-header">QA : ${n} problème${n > 1 ? 's' : ''}${parsed.phase !== null ? ` (phase ${parsed.phase})` : ''}</div>`;
    html += violationsHtml(parsed.violations);
    html += '</div>';
    showResults(html);
  }

  async function handleQA(tripId) {
    setButtonLoading('action-qa', true);
    const res = await API.runQA(tripId);
    setButtonLoading('action-qa', false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur QA : ${esc(errorLabel((res.data && res.data.error) || '') || res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    const parsed = ConstructionContract.parseQA(res.data);
    if (!parsed.ok) {
      showUnrecognized('le résultat QA');
      return;
    }
    paintQA(parsed);
  }

  function resultsPaneIsEmpty() {
    const el = document.getElementById('action-bar-results');
    return !el || !el.innerHTML || !el.innerHTML.trim();
  }

  /** GET du dernier QA. Silence si rien en cache ou enveloppe inconnue — ne
   *  pas voler le panneau avec une erreur au simple ouverture d'onglet.
   *  Relit le panneau après le GET : un clic Admin/QA pendant l'aller-retour
   *  ne doit pas se faire écraser. */
  async function hydrateQA(tripId) {
    if (!tripId || typeof API === 'undefined' || !API.getQA) return false;
    try {
      const res = await API.getQA(tripId);
      if (!res || !res.ok || !res.data || res.data.cached !== true) return false;
      if (tripId !== _currentTripId || !resultsPaneIsEmpty()) return false;
      const parsed = ConstructionContract.parseQA(res.data);
      if (!parsed.ok) return false;
      if (tripId !== _currentTripId || !resultsPaneIsEmpty()) return false;
      paintQA(parsed);
      return true;
    } catch (_) {
      return false;
    }
  }

  // ── Nuisances check ──

  async function handleNuisances(tripId, locationIds) {
    const btnId = 'action-nuisances';
    setButtonLoading(btnId, true);
    const res = await API.runNuisanceCheck(tripId, locationIds || null);
    setButtonLoading(btnId, false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur nuisances : ${esc(res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    // Un clic annule l'analyse précédente : deux flux vivants écriraient dans le
    // même #action-bar-results et se disputeraient le rendu final.
    abortNuisanceStream();
    const ac = new AbortController();
    _nuisanceAbort = ac;

    const el = document.getElementById('action-bar-results');
    await NuisanceStream.start(el, {
      tripId,
      data: res.data,
      signal: ac.signal,
      onRendered: () => appendPinButton(el),
    });
  }

  function appendPinButton(el) {
    if (!el) return;
    if (el.querySelector && el.querySelector('#nuisance-pin-btn')) return;
    el.insertAdjacentHTML('beforeend',
      `<div class="nuisance-pin-wrap"><button type="button" class="btn btn-accent nuisance-pin-btn" id="nuisance-pin-btn">${PIN_LABEL}</button></div>`);
    const pinBtn = document.getElementById('nuisance-pin-btn');
    if (pinBtn) pinBtn.addEventListener('click', () => handlePinNuisance(pinBtn));
  }

  /**
   * Épingler écrit hotels[].nuisance + lastQa (200). Un 501 d'un backend plus
   * ancien reste affiché comme indisponible.
   */
  async function handlePinNuisance(btn) {
    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : null;
    if (!tripId) return;

    btn.disabled = true;
    btn.textContent = 'Enregistrement…';

    const res = await API.pinNuisanceToSeed(tripId);

    if (isNotImplemented(res)) {
      btn.textContent = 'Pas encore disponible';
      btn.classList.add('unavailable');
      btn.title = notImplementedDetail(res);
      btn.disabled = true;
      return;
    }

    if (!res || !res.ok) {
      resetPinButton(btn, 'Erreur');
      return;
    }

    btn.textContent = 'Épinglé ✓';
    btn.disabled = true;
    btn.classList.remove('unavailable');
    const seedPush = res.data && res.data.seedPush;
    const wrap = btn.closest('.nuisance-pin-wrap') || btn.parentNode;
    const old = wrap && wrap.querySelector && wrap.querySelector('.nuisance-pin-warn');
    if (old) old.remove();
    if (seedPush && seedPush.ok === false && wrap) {
      const detail = (typeof seedPush.error === 'string' && seedPush.error)
        ? seedPush.error
        : 'écriture git refusée';
      wrap.insertAdjacentHTML('beforeend',
        `<p class="nuisance-pin-warn">Enregistré dans TripKit, pas dans le repo seed : ${esc(detail)}</p>`);
    }
  }

  function resetPinButton(btn, msg) {
    btn.textContent = msg;
    setTimeout(() => {
      btn.textContent = PIN_LABEL;
      btn.removeAttribute('title');
      btn.disabled = false;
    }, 2500);
  }

  /** 501 (ou corps {error:'not_implemented'}) : fonctionnalité pas encore branchée. */
  function isNotImplemented(res) {
    if (!res) return false;
    return res.status === 501 || !!(res.data && res.data.error === 'not_implemented');
  }

  function notImplementedDetail(res) {
    const detail = res && res.data && res.data.detail;
    return (typeof detail === 'string' && detail) ? detail : "Léo n'écrit pas encore dans le seed.";
  }

  // ── Admin check ──

  // Vocabulaire backend uniquement (`ok` / `warning` / `action_required`).
  // Une regex `/ok|done|valid/` faisait retomber `invalid` et `not_ok` sur ✅
  // (lot #76). Une valeur inconnue rend ❓, jamais un tick vert.
  function statusBadge(status) {
    switch (String(status || '').toLowerCase()) {
      case 'ok': return '✅';
      case 'warning': return '⚠️';
      case 'action_required': return '🔴';
      case 'none': return '';
      default: return '❓';
    }
  }

  function statusLabel(status) {
    switch (String(status || '').toLowerCase()) {
      case 'ok': return 'OK';
      case 'warning': return 'À vérifier';
      case 'action_required': return 'Action requise';
      default: return String(status || '');
    }
  }

  function verdictSentence(verdict) {
    switch (String(verdict || '').toLowerCase()) {
      case 'ok': return '✅ Rien à faire';
      case 'warning': return '⚠️ Points à vérifier';
      case 'action_required': return '🔴 Démarches à effectuer';
      case 'none': return '';
      default: return esc(verdict || '');
    }
  }

  /** Item admin : pays, libellé, badge de statut, détail, coût et lien officiel. */
  function adminItemHtml(item) {
    let html = `<div class="admin-check-item">`;
    html += `<span class="check-badge">${statusBadge(item.status)}</span>`;
    if (item.country) html += `<span class="admin-country">${esc(item.country)}</span> `;
    html += `<span class="admin-label">${esc(item.label || item.type || '')}</span>`;
    if (item.status) html += ` <span class="admin-status">${esc(statusLabel(item.status))}</span>`;
    if (item.detail) html += `<div class="admin-detail">${esc(item.detail)}</div>`;
    if (item.deadline) html += `<div class="admin-deadline">Échéance : ${esc(item.deadline)}</div>`;
    if (item.cost && item.cost !== item.detail) html += `<div class="admin-cost">Coût : ${esc(item.cost)}</div>`;
    if (item.url) html += `<div class="admin-url"><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Site officiel</a></div>`;
    html += `</div>`;
    return html;
  }

  /**
   * Checklist admin par voyageur (construction/SPEC.md §7). Prefer travelers[]
   * from the server (D-D). Fallback: regroup items via people + union note.
   */
  async function handleAdmin(tripId) {
    setButtonLoading('action-admin', true);
    const res = await API.runAdminCheck(tripId);
    setButtonLoading('action-admin', false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur admin : ${esc(res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    const parsed = ConstructionContract.parseAdminCheck(res.data);
    if (!parsed.ok) {
      showUnrecognized('la checklist administrative');
      return;
    }

    let html = '<div class="action-results-admin">';
    html += `<div class="action-results-header">Formalités administratives</div>`;
    if (parsed.countries.length) {
      html += `<div class="admin-countries">Pays détectés : ${esc(parsed.countries.join(', '))}</div>`;
    }
    // Le verdict ne se rend QUE s'il porte sur des items. `AdminCheck` renvoie
    // verdict "ok" avec zéro item dès qu'aucun pays n'est détecté, qu'aucune
    // nationalité n'est connue (le cas ordinaire : `nationalities` est optionnel
    // dans un seed) ou qu'aucune règle ne matche. « ✅ Rien à faire » y serait
    // exactement le faux feu vert que l'avertissement juste dessous corrige, et
    // il s'afficherait au-dessus de lui.
    const sentence = parsed.items.length ? verdictSentence(parsed.verdict) : '';
    if (sentence) html += `<div class="admin-verdict admin-verdict-${esc(parsed.verdict)}">${sentence}</div>`;
    if (parsed.summary) html += `<div class="admin-summary action-result-summary">${esc(parsed.summary)}</div>`;

    if (!parsed.items.length) {
      const empty = parsed.countries.length ? ADMIN_UNKNOWN_TRIP : UNKNOWN_DESTINATION;
      html += `<div class="admin-unknown">${empty}</div></div>`;
      showResults(html);
      return;
    }

    const groups = ConstructionContract.groupAdminItemsByTraveler(parsed.items, peopleForTrip(tripId));
    const serverTravelers = Array.isArray(parsed.travelers) ? parsed.travelers : [];

    function travelerBlock(t) {
      let block = `<div class="admin-traveler">`;
      block += `<div class="admin-traveler-name">${esc(t.name)}${t.nationalities && t.nationalities.length ? ` <span class="admin-nats">(${esc(t.nationalities.join(', '))})</span>` : ''}</div>`;
      if (t.items && t.items.length) {
        t.items.forEach(item => { block += adminItemHtml(item); });
      } else {
        block += `<div class="admin-check-item admin-unknown">${ADMIN_UNKNOWN_TRAVELER}</div>`;
      }
      block += `</div>`;
      return block;
    }

    if (serverTravelers.length) {
      serverTravelers.forEach(t => { html += travelerBlock(t); });
    } else if (groups.grouped) {
      groups.travelers.forEach(t => { html += travelerBlock(t); });
      if (groups.everyone.length) {
        html += `<div class="admin-traveler admin-everyone"><div class="admin-traveler-name">Tous les voyageurs</div>`;
        groups.everyone.forEach(item => { html += adminItemHtml(item); });
        html += `</div>`;
      }
      if (groups.unassigned.length) {
        html += `<div class="admin-traveler admin-unassigned"><div class="admin-traveler-name">Nationalités non rattachées à un voyageur</div>`;
        groups.unassigned.forEach(item => { html += adminItemHtml(item); });
        html += `</div>`;
      }
      html += `<div class="admin-limitation">ℹ️ ${ADMIN_UNION_NOTE}</div>`;
    } else {
      html += `<div class="admin-traveler admin-flat"><div class="admin-traveler-name">Voyageurs inconnus : liste par pays</div>`;
      groups.everyone.forEach(item => { html += adminItemHtml(item); });
      html += `</div>`;
      html += `<div class="admin-limitation">ℹ️ ${ADMIN_UNION_NOTE}</div>`;
    }

    html += '</div>';
    showResults(html);
  }

  // ── Health check ──

  async function handleSante(tripId) {
    setButtonLoading('action-sante', true);
    const res = await API.runHealthCheck(tripId);
    setButtonLoading('action-sante', false);

    if (!res.ok) {
      showResults(`<div class="construction-error">Erreur santé : ${esc(res.error || 'HTTP ' + res.status)}</div>`);
      return;
    }

    const parsed = ConstructionContract.parseHealthCheck(res.data);
    if (!parsed.ok) {
      showUnrecognized('les recommandations santé');
      return;
    }

    // Deux silences distincts, que le backend renvoie tous les deux avec
    // verdict "none" et zéro item :
    //  - pays détecté, aucune recommandation : silence voulu par la spec
    //    (construction/SPEC.md §7.2, « le check répond rien de particulier et
    //    n'affiche pas de section ») -> le ✅ vert reste légitime ;
    //  - `countries` vide, donc aucun pays déduit du voyage : le moteur n'a rien
    //    analysé. Le rendre en vert annoncerait « rien à faire » pour une
    //    destination inconnue, exactement le faux feu vert corrigé côté admin.
    if (!parsed.items.length && !parsed.countries.length) {
      showResults(`<div class="health-unknown">${UNKNOWN_DESTINATION}</div>`);
      return;
    }
    if (!parsed.items.length || String(parsed.verdict).toLowerCase() === 'none') {
      showResults(`<div class="action-result-ok">Aucune recommandation santé pour cette destination</div>`);
      return;
    }

    const n = parsed.items.length;
    let html = '<div class="action-results-health">';
    html += `<div class="action-results-header">Santé : ${n} recommandation${n > 1 ? 's' : ''}</div>`;
    if (parsed.countries.length) {
      html += `<div class="health-countries">Pays détectés : ${esc(parsed.countries.join(', '))}</div>`;
    }
    if (parsed.summary) html += `<div class="health-summary action-result-summary">${esc(parsed.summary)}</div>`;
    parsed.items.forEach(item => {
      html += `<div class="health-item">`;
      html += `<span class="check-badge">${statusBadge(item.status)}</span>`;
      if (item.country && item.country !== '*') html += `<span class="health-country">${esc(item.country)}</span> `;
      html += `<span class="health-title">${esc(item.label || item.type || '')}</span>`;
      if (item.status) html += ` <span class="health-status">${esc(statusLabel(item.status))}</span>`;
      if (item.detail) html += `<div class="health-detail">${esc(item.detail)}</div>`;
      html += `</div>`;
    });
    html += '</div>';
    showResults(html);
  }

  // ── GuidedForm ──────────────────────────────────────────────────────────────

  function renderGuidedForm() {
    const transports = [
      { id: 'avion', label: 'Avion', emoji: '✈️' },
      { id: 'train', label: 'Train', emoji: '🚆' },
      { id: 'voiture', label: 'Voiture', emoji: '🚗' },
      { id: 'bateau', label: 'Bateau', emoji: '⛴️' },
    ];

    const checkboxes = transports.map(t =>
      `<label class="guided-transport-option">
        <input type="checkbox" name="transport" value="${t.id}">
        <span>${t.emoji} ${t.label}</span>
      </label>`
    ).join('');

    return `<div class="construction-guided-form" id="construction-guided-form">
      <h3>Paramètres du voyage</h3>
      <form id="construction-guided-form-el">
        <div class="guided-field">
          <label for="guided-start-date">Date de départ</label>
          <input type="date" id="guided-start-date" name="startDate">
        </div>
        <div class="guided-field">
          <label for="guided-nb-days">Nombre de jours</label>
          <input type="number" id="guided-nb-days" name="nbDays" min="1" max="90" placeholder="ex: 14">
        </div>
        <div class="guided-field">
          <label for="guided-destination">Destination</label>
          <input type="text" id="guided-destination" name="destination" placeholder="ex: Japon, Islande...">
        </div>
        <div class="guided-field">
          <label>Transports</label>
          <div class="guided-transports">${checkboxes}</div>
        </div>
        <button type="submit" class="btn btn-primary guided-submit">Envoyer à Léo</button>
      </form>
    </div>`;
  }

  function bindGuidedForm() {
    const form = document.getElementById('construction-guided-form-el');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const startDate = form.elements.startDate ? form.elements.startDate.value : '';
      const nbDays = form.elements.nbDays ? form.elements.nbDays.value : '';
      const destination = form.elements.destination ? form.elements.destination.value.trim() : '';
      const transportEls = form.querySelectorAll('input[name="transport"]:checked');
      const transports = Array.from(transportEls).map(el => el.value);

      // Compose the ideation message for Leo
      const parts = [];
      if (destination) parts.push(`Destination : ${destination}`);
      if (startDate) parts.push(`Départ : ${startDate}`);
      if (nbDays) parts.push(`Durée : ${nbDays} jours`);
      if (transports.length) parts.push(`Transports : ${transports.join(', ')}`);

      if (!parts.length) return; // nothing to send

      const message = `Voici les paramètres pour l'idéation du voyage :\n${parts.join('\n')}`;

      // Send to Leo construction chat
      if (_leoInstance && _leoInstance.send) {
        _leoInstance.send(message);
      }
    });
  }

  function mountConstructionDiscovery(tripId, tripData) {
    const el = document.getElementById('construction-discovery');
    if (!el || typeof DiscoveryPanel === 'undefined' || !DiscoveryPanel.firstCorridorLeg) return;
    const found = DiscoveryPanel.firstCorridorLeg(tripData);
    if (!found) {
      el.innerHTML = '';
      return;
    }
    const day = (typeof DayHelpers !== 'undefined' && DayHelpers.enrich)
      ? DayHelpers.enrich(found.day, tripData)
      : found.day;
    DiscoveryPanel.render(el, {
      tripId,
      day,
      tripData,
      corridorOnly: true,
      leg: found.leg,
    });
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  function render(containerId, tripData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tripId = (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : null;

    // Tout ré-affichage (et a fortiori un changement de voyage) coupe le flux
    // nuisances en cours : sinon une trame `done` périmée afficherait les
    // résultats du voyage précédent dans la nouvelle vue.
    abortNuisanceStream();
    if (tripId !== _currentTripId) {
      _people = null;
      clearPhaseError();
      _currentTripId = tripId;
    }

    if (!tripId) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🏗️</div>
        <h3>Mode Construction</h3>
        <p>Aucun voyage sélectionné.</p>
      </div>`;
      return;
    }

    // Build layout: trip loop (seed), PhaseBar, TravelerContextBox, GuidedForm, Leo, ActionBar
    container.innerHTML = `
      <div class="page-header">
        <h1>🏗️ Mode Construction</h1>
        <button type="button" class="btn btn-sm" id="construction-quit-mode">Quitter le mode</button>
      </div>
      ${renderTripLoop(tripData)}
      ${renderPhaseBarLoading()}
      ${renderContextLoading()}
      ${renderGuidedForm()}
      <div id="construction-discovery"></div>
      <div id="construction-leo-section"></div>
      ${renderActionBar()}
    `;

    // Bind guided form submit
    bindGuidedForm();
    prefillGuidedForm(tripData);

    // Bind ActionBar check buttons
    bindActionBar(tripId);

    const quit = document.getElementById('construction-quit-mode');
    if (quit) {
      quit.addEventListener('click', () => {
        if (typeof App !== 'undefined' && App.toggleConstructionMode) {
          App.toggleConstructionMode(false);
        }
      });
    }

    // Load async data
    loadPhaseBar(tripId);
    loadTravelerContext(tripId);
    mountConstructionDiscovery(tripId, tripData);

    mountConstructionLeo('construction:ideation');
    const resumed = typeof NuisanceStream !== 'undefined' && NuisanceStream.resumeIfNeeded
      && NuisanceStream.resumeIfNeeded();
    const resultsEl = document.getElementById('action-bar-results');
    (async () => {
      if (resumed) return;
      let nuisancePainted = false;
      if (typeof NuisanceStream !== 'undefined' && NuisanceStream.hydrate) {
        const parsed = await NuisanceStream.hydrate(resultsEl, {
          tripId,
          onRendered: () => appendPinButton(resultsEl),
        });
        nuisancePainted = !!(parsed && parsed.locations && parsed.locations.length);
      }
      if (nuisancePainted) return;
      if (resultsEl && resultsEl.innerHTML && resultsEl.innerHTML.trim()) return;
      await hydrateQA(tripId);
    })();
  }

  return { render, handleNuisances, handleAdmin, handleSante, abortNuisanceStream, leoModeForPhase, statusBadge };
})();
;
/* ==== js/components/list.js ==== */
/**
 * list.js — Universal List Component
 * Renders any list type: shopping, packing, todo, inventory, custom
 * Same features everywhere: check, hide, custom items, progress, export/import
 */
var ListComponent = (() => {

  /**
   * Render a complete list into a container element.
   * @param {string} containerId - DOM element id to render into
   * @param {object} listData - { id, type, title, subtitle, store?, sections[], links[] }
   */
  function render(containerId, listData) {
    const el = document.getElementById(containerId);
    if (!el || !listData) return;

    const listId = listData.id;
    Store.rememberListType(listId, listData.type);
    const checks = Store.getChecks(listId);
    const custom = Store.getCustomItems(listId);
    const hidden = Store.getHidden(listId);

    // Compute totals
    let totalItems = 0, totalChecked = 0;

    // Build sections HTML
    let sectionsHtml = '';
    listData.sections.forEach((section, si) => {
      // Built-in items (not hidden)
      const builtinItems = section.items || [];
      const visibleItems = builtinItems.filter(it => !hidden.has(it.id));
      const hiddenItems = builtinItems.filter(it => hidden.has(it.id));

      // Custom items for this section
      const customForSection = Object.entries(custom)
        .filter(([, c]) => c.section === si)
        .map(([id, c]) => ({ id: 'custom-' + id, text: c.text, note: null, _customId: id, _isCustom: true, _shared: !!c.shared }));

      const allItems = [...visibleItems, ...customForSection];
      const sectionChecked = allItems.filter(it => checks[it.id]?.checked).length;
      const sectionTotal = allItems.length;
      totalItems += sectionTotal;
      totalChecked += sectionChecked;

      const allDone = sectionTotal > 0 && sectionChecked === sectionTotal;

      // Section header
      sectionsHtml += `<div class="section-wrap" data-section="${si}">
        <div class="section-head" data-action="toggle-section" data-section="${si}">
          <span class="s-emoji">${esc(section.emoji || '📋')}</span>
          <span class="s-title">${esc(section.title)}</span>
          ${section.subtitle ? `<span style="font-size:.72em;color:var(--muted);margin-right:4px">${esc(section.subtitle)}</span>` : ''}
          <span class="s-count">${sectionChecked}/${sectionTotal}</span>
          <span class="s-chevron">▼</span>
        </div>
        <div class="section-body">`;

      // Visible items
      visibleItems.forEach(item => {
        const isChecked = checks[item.id]?.checked;
        sectionsHtml += renderItem(item, isChecked, false, listId);
      });

      // Custom items
      customForSection.forEach(item => {
        const isChecked = checks[item.id]?.checked;
        sectionsHtml += renderCustomItem(item, isChecked, listId);
      });

      // Hidden items toggle
      if (hiddenItems.length > 0) {
        sectionsHtml += `<button class="hidden-toggle" data-action="toggle-hidden" data-section="${si}">
          👁️ ${hiddenItems.length} masqué${hiddenItems.length > 1 ? 's' : ''}</button>`;
        sectionsHtml += `<div class="hidden-list" data-hidden-section="${si}" style="display:none">`;
        hiddenItems.forEach(item => {
          sectionsHtml += `<div class="list-item is-hidden" data-item="${item.id}">
            <div class="item-label">${item.text}</div>
            <button class="item-restore-btn" data-action="restore" data-item="${item.id}">Restaurer</button>
          </div>`;
        });
        sectionsHtml += `</div>`;
      }

      // Add custom item button
      sectionsHtml += `<button class="add-item-btn" data-action="add-custom" data-section="${si}">
        <span class="plus-icon">+</span> Ajouter un item…</button>`;

      // Add input row (hidden by default)
      sectionsHtml += `<div class="add-input-row" data-input-section="${si}" style="display:none">
        <input type="text" placeholder="Nouvel item…" data-input-field="${si}">
        <button class="btn-confirm" data-action="confirm-add" data-section="${si}">OK</button>
        <button class="btn-cancel" data-action="cancel-add" data-section="${si}">✕</button>
      </div>`;

      sectionsHtml += `</div></div>`;
    });

    // Progress
    const pct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

    // Store card (for shopping type)
    let storeHtml = '';
    if (listData.store) {
      const s = listData.store;
      storeHtml = `<div class="store-card">
        <div class="store-name">📍 ${esc(s.name)}</div>
        <div class="store-meta">
          ${s.address ? `<div>${esc(s.address)}</div>` : ''}
          ${s.hours ? `<div>🕐 ${esc(s.hours)}</div>` : ''}
          ${s.mapsUrl ? `<div><a href="${esc(s.mapsUrl)}" target="_blank">📍 Ouvrir dans Maps</a></div>` : ''}
        </div>
      </div>`;
    }

    // Links — always include a bottom ← Retour (packing/valise lists are long;
    // seed links often omit it while shopping/todo lists have it).
    const links = Array.isArray(listData.links) ? listData.links.slice() : [];
    const hasRetour = links.some((l) => /retour/i.test(String(l && l.label || '')));
    if (!hasRetour) {
      links.unshift({ label: '← Retour', url: '#plus', style: 'muted' });
    }
    let linksHtml = '';
    if (links.length) {
      linksHtml = `<div class="btn-row">`;
      links.forEach(l => {
        const cls = l.style ? `btn btn-${l.style}` : 'btn btn-muted';
        linksHtml += `<a href="${esc(l.url)}" class="${cls}">${esc(l.label)}</a>`;
      });
      linksHtml += `</div>`;
    }

    const listShared = Store.isListShared(listId);

    // Assemble
    el.innerHTML = `
      <div class="page-header">
        <button class="back-btn" onclick="window.location.hash='plus'">◀ Retour</button>
        <h1>${esc(listData.title)}</h1>
        ${listData.subtitle ? `<div class="sub">${esc(listData.subtitle)}</div>` : ''}
      </div>
      <div class="list-share-bar">
        <span class="list-share-label">Liste partagée</span>
        <button type="button" class="list-share-toggle${listShared ? ' on' : ''}"
          data-action="toggle-list-shared"
          title="${listShared ? 'Les coches et nouveaux items partent au groupe' : 'Les coches restent sur cet appareil'}">
          ${listShared ? 'Oui ☁️' : 'Non 🔒'}
        </button>
      </div>
      <div class="list-sync-bar ${syncClass(listId)}" data-sync-bar="${esc(listId)}">
        <span class="list-sync-text">${esc(syncLabel(listId))}</span>
      </div>
      ${storeHtml}
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-text">${totalChecked}/${totalItems} — ${pct}%</div>
      </div>
      ${sectionsHtml}
      <div class="btn-row">
        <button class="btn btn-accent" data-action="export">📤 Export</button>
        <button class="btn btn-orange" data-action="import">📥 Import</button>
        <button class="btn btn-red" data-action="reset">🗑️ Reset</button>
      </div>
      ${linksHtml}
    `;

    // Bind events via delegation
    bindEvents(el, listData);
  }

  function renderItem(item, isChecked, isHidden, listId) {
    return `<div class="list-item${isChecked ? ' checked' : ''}" data-action="check" data-item="${esc(item.id)}">
      <div class="item-check"></div>
      <div class="item-label">
        ${esc(item.text)}
        ${item.note ? `<span class="item-note">${esc(item.note)}</span>` : ''}
      </div>
      <button class="item-action-btn" data-action="hide" data-item="${esc(item.id)}" title="Masquer">✕</button>
    </div>`;
  }

  function renderCustomItem(item, isChecked, listId) {
    const shareBtn = item._shared
      ? `<button class="item-share-btn shared" data-action="toggle-share" data-custom-id="${esc(item._customId)}" title="Partagé avec le groupe — appuyer pour garder en local">☁️</button>`
      : `<button class="item-share-btn" data-action="toggle-share" data-custom-id="${esc(item._customId)}" title="Local — appuyer pour partager avec le groupe">🔒</button>`;
    return `<div class="list-item custom${isChecked ? ' checked' : ''}" data-action="check" data-item="${esc(item.id)}">
      <div class="item-check"></div>
      <div class="item-label">${esc(item.text)}</div>
      ${shareBtn}
      <button class="item-delete-btn" data-action="delete-custom" data-custom-id="${esc(item._customId)}" title="Supprimer">🗑</button>
    </div>`;
  }

  function bindEvents(el, listData) {
    // Always refresh current list data — handlers read from here (no stale closure).
    el._listData = listData;

    // Bind once per container. Re-render replaces innerHTML; stacking click
    // listeners used to fire N toasts (and toggle share N times) per tap.
    if (el._listHandlersBound) return;
    el._listHandlersBound = true;

    el.addEventListener('click', (e) => {
      const data = el._listData;
      if (!data) return;
      const listId = data.id;
      const target = e.target.closest('[data-action]');
      if (!target || !el.contains(target)) return;

      const action = target.dataset.action;

      switch (action) {
        case 'check': {
          const itemId = target.dataset.item;
          if (!itemId) return;
          Store.toggleCheck(listId, itemId);
          render(el.id, data);
          backgroundSync(data);
          break;
        }
        case 'hide': {
          e.stopPropagation();
          const itemId = target.dataset.item;
          Store.hideItem(listId, itemId);
          render(el.id, data);
          backgroundSync(data);
          break;
        }
        case 'restore': {
          const itemId = target.dataset.item;
          Store.restoreItem(listId, itemId);
          render(el.id, data);
          backgroundSync(data);
          break;
        }
        case 'toggle-section': {
          const head = target;
          const si = head.dataset.section;
          const body = el.querySelector(`.section-wrap[data-section="${si}"] .section-body`);
          if (body) {
            body.classList.toggle('hidden');
            head.classList.toggle('collapsed');
          }
          break;
        }
        case 'toggle-hidden': {
          const si = target.dataset.section;
          const hiddenList = el.querySelector(`[data-hidden-section="${si}"]`);
          if (hiddenList) {
            hiddenList.style.display = hiddenList.style.display === 'none' ? 'block' : 'none';
          }
          break;
        }
        case 'add-custom': {
          const si = target.dataset.section;
          const inputRow = el.querySelector(`[data-input-section="${si}"]`);
          if (inputRow) {
            inputRow.style.display = 'flex';
            target.style.display = 'none';
            const input = inputRow.querySelector('input');
            if (input) input.focus();
          }
          break;
        }
        case 'confirm-add': {
          const si = parseInt(target.dataset.section);
          const input = el.querySelector(`[data-input-field="${si}"]`);
          if (input && input.value.trim()) {
            Store.addCustomItem(listId, si, input.value.trim());
            render(el.id, data);
            backgroundSync(data);
          }
          break;
        }
        case 'cancel-add': {
          const si = target.dataset.section;
          const inputRow = el.querySelector(`[data-input-section="${si}"]`);
          const addBtn = el.querySelector(`.add-item-btn[data-section="${si}"]`);
          if (inputRow) inputRow.style.display = 'none';
          if (addBtn) addBtn.style.display = 'flex';
          break;
        }
        case 'delete-custom': {
          e.stopPropagation();
          const customId = target.dataset.customId;
          if (customId) {
            Store.deleteCustomItem(listId, customId);
            render(el.id, data);
            backgroundSync(data);
          }
          break;
        }
        case 'toggle-share': {
          e.stopPropagation();
          const customId = target.dataset.customId;
          if (customId) {
            Store.toggleShareItem(listId, customId);
            render(el.id, data);
            backgroundSync(data);
            // No toast — ☁️/🔒 on the row is enough feedback.
          }
          break;
        }
        case 'toggle-list-shared': {
          e.stopPropagation();
          const next = !Store.isListShared(listId);
          Store.setListShared(listId, next);
          render(el.id, data);
          backgroundSync(data);
          showToast(next
            ? '☁️ Liste partagée — coches et items au groupe'
            : '🔒 Liste locale — coches sur cet appareil');
          break;
        }
        case 'export': {
          doExport(data);
          break;
        }
        case 'import': {
          doImport(el.id, data);
          break;
        }
        case 'reset': {
          if (confirm('Réinitialiser toutes les cases ?')) {
            Store.resetList(listId);
            render(el.id, data);
            showToast('✅ Liste réinitialisée');
          }
          break;
        }
      }
    });

    // Delegated — survives innerHTML re-renders (per-input binds used to die).
    el.addEventListener('keydown', (e) => {
      const input = e.target.closest('[data-input-field]');
      if (!input || !el.contains(input)) return;
      if (e.key === 'Enter') {
        const si = parseInt(input.dataset.inputField);
        const btn = el.querySelector(`[data-action="confirm-add"][data-section="${si}"]`);
        if (btn) btn.click();
      }
      if (e.key === 'Escape') {
        const si = input.dataset.inputField;
        const btn = el.querySelector(`[data-action="cancel-add"][data-section="${si}"]`);
        if (btn) btn.click();
      }
    });
  }

  function doExport(listData) {
    const data = Store.exportList(listData.id);
    const json = JSON.stringify(data, null, 2);

    // Also build readable text
    const checks = Store.getChecks(listData.id);
    let text = `${listData.title}\n`;
    if (listData.subtitle) text += `${listData.subtitle}\n`;
    text += '\n';
    listData.sections.forEach((section) => {
      text += `${section.emoji || ''} ${section.title}\n`;
      (section.items || []).forEach(item => {
        const c = checks[item.id]?.checked ? '✅' : '⬜';
        text += `  ${c} ${item.text}\n`;
      });
      text += '\n';
    });

    if (navigator.share) {
      navigator.share({ title: listData.title, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(json).then(() => {
        showToast('📋 Copié dans le presse-papier');
      }).catch(() => {});
    }
  }

  function doImport(containerId, listData) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          Store.importList(listData.id, data);
          render(containerId, listData);
          showToast('✅ Importé !');
          backgroundSync(listData);
        } catch (err) {
          showToast('❌ ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /** Sync status shown in the list header — a failing sync must be visible. */
  function syncLabel(listId) {
    const s = Store.getSyncState(listId);
    if (!Store.isListShared(listId)) {
      if (s && s.state === 'error') return '⚠️ ' + s.message;
      if (s && s.state === 'offline') return '🔌 ' + s.message;
      return '🔒 Coches sur cet appareil';
    }
    if (!s) return '⏳ Synchro…';
    if (s.state === 'ok') return '☁️ Synchronisé ' + ago(s.at);
    if (s.state === 'offline') return '🔌 ' + s.message;
    return '⚠️ ' + s.message;
  }

  function syncClass(listId) {
    const s = Store.getSyncState(listId);
    return s ? 'sync-' + s.state : 'sync-pending';
  }

  function ago(ts) {
    const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (sec < 10) return 'à l’instant';
    if (sec < 60) return 'il y a ' + sec + ' s';
    const min = Math.round(sec / 60);
    if (min < 60) return 'il y a ' + min + ' min';
    return 'il y a ' + Math.round(min / 60) + ' h';
  }

  /** Repaint the status bar only — a full re-render steals taps mid-list. */
  function paintSync(containerId, listId) {
    const el = document.getElementById(containerId);
    const bar = el && el.querySelector('.list-sync-bar');
    if (!bar || bar.dataset.syncBar !== listId) return;
    bar.className = 'list-sync-bar ' + syncClass(listId);
    const text = bar.querySelector('.list-sync-text');
    if (text) text.textContent = syncLabel(listId);
  }

  function backgroundSync(listData) {
    const tripId = Store.getCurrentTripId();
    if (tripId && typeof API !== 'undefined') {
      return API.syncList(tripId, listData.id, { mode: 'push' }).then((res) => {
        const el = document.getElementById('plus-content');
        const onList = el && el._listData && el._listData.id === listData.id;
        if (res && res.changed && onList) {
          render('plus-content', listData);
        } else if (onList) {
          paintSync('plus-content', listData.id);
        }
        return res;
      }).catch(() => null);
    }
    return Promise.resolve(null);
  }

  /**
   * Pull shared customs + checks when opening a list (Nicole sees René's ticks).
   * Re-renders if the merge brought new state.
   * Pull mode sends no checks so stale local timestamps cannot wipe peers.
   */
  function pullOnOpen(containerId, listData) {
    const tripId = Store.getCurrentTripId();
    if (!tripId || typeof API === 'undefined' || !listData) return;
    API.syncList(tripId, listData.id, { mode: 'pull' }).then((res) => {
      if (res && res.changed) render(containerId, listData);
      else paintSync(containerId, listData.id);
    }).catch(() => {});
  }

  /** While a list is open, re-pull periodically so peer ticks appear without leaving. */
  let _pullTimer = null;
  let _pullCtx = null; // { containerId, listId }

  function stopPullWhileOpen() {
    if (_pullTimer) {
      clearInterval(_pullTimer);
      _pullTimer = null;
    }
    _pullCtx = null;
  }

  function startPullWhileOpen(containerId, listData) {
    stopPullWhileOpen();
    if (!listData || !listData.id) return;
    _pullCtx = { containerId, listId: listData.id, listData };
    pullOnOpen(containerId, listData);
    _pullTimer = setInterval(() => {
      if (!_pullCtx) return;
      // Only if still viewing this list in the DOM
      const el = document.getElementById(_pullCtx.containerId);
      if (!el || !el.querySelector('.list-sync-bar')) {
        stopPullWhileOpen();
        return;
      }
      pullOnOpen(_pullCtx.containerId, _pullCtx.listData);
    }, 12000);
  }

  function showToast(msg, type = 'success') {
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(msg, type);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { render, pullOnOpen, startPullWhileOpen, stopPullWhileOpen, paintSync };
})();
;
/* ==== js/components/route-view.js ==== */
/**
 * route-view.js — Full trip overview with expandable day cards
 * Shows phases, daily cards with emoji/weather/distance, expand for details.
 * Weather: batch-fetches Open-Meteo for all unique coords, NWS overlay for USA.
 */

var RouteView = (() => {

  const WMO_ICONS = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌧️',55:'🌧️',61:'🌦️',63:'🌧️',65:'🌧️',71:'❄️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⚡',96:'⚡',99:'⚡'};
  let wxCache = null;
  let wxCacheTs = 0;

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /**
   * Render the route overview into a container.
   */
  function render(containerId, tripData) {
    const container = document.getElementById(containerId);
    if (!tripData || !tripData.days || !tripData.days.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🗺️</div>
        <h3>Aucun itinéraire</h3>
      </div>`;
      return;
    }

    const days = tripData.days.map(d => DayHelpers.enrich(d, tripData));
    const trip = tripData.trip || {};
    const phases = trip.phases || [];

    let html = `<div class="page-header">
      <h1>🗺️ Itinéraire</h1>
      <div class="sub">${esc(trip.name || '')}</div>
    </div>`;

    // Stats badges
    const totalKm = days.reduce((sum, d) => {
      const m = (d.dist || '').match(/(\d[\d\s]*)/);
      return sum + (m ? parseInt(m[1].replace(/\s/g, '')) : 0);
    }, 0);

    html += `<div style="text-align:center;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center">`;
    html += `<span class="badge badge-accent">${days.length} jours</span>`;
    if (totalKm > 0) html += `<span class="badge badge-sec">${totalKm.toLocaleString('fr')} km</span>`;
    if (trip.travelers) html += `<span class="badge" style="background:rgba(255,255,255,.1)">${trip.travelers.length} voyageurs</span>`;
    html += `</div>`;

    // Route map image (from backend assets or static fallback)
    if (trip.mapImage) {
      let mapSrc = trip.mapImage;
      if (!mapSrc.startsWith('http') && !mapSrc.startsWith('/') && !mapSrc.startsWith('data:')) {
        mapSrc = (typeof API !== 'undefined' && API.assetUrl) ? API.assetUrl(trip.id, trip.mapImage) : trip.mapImage;
      }
      const ncq = localStorage.getItem('tripkit_nocache') === '1' ? (mapSrc.includes('?') ? '&nocache=1' : '?nocache=1') : '';
      html += `<div style="margin-bottom:16px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1)">
        <img src="${mapSrc}${ncq}" alt="Carte itin\u00E9raire" style="width:100%;display:block;cursor:pointer" onclick="window.open(this.src,'_blank')" loading="lazy">
      </div>`;
    }

    // Google Maps full route link — stays at top
    if (trip.routeUrl) {
      html += `<div style="margin-bottom:16px">
        <a href="${esc(trip.routeUrl)}" class="map-btn map-btn-primary" target="_blank" style="display:block;text-align:center">🗺️ Itinéraire complet — Google Maps</a>
      </div>`;
    }

    // Phase tracking
    let currentPhaseIdx = -1;

    days.forEach((day, idx) => {
      // Phase label
      if (phases.length) {
        const phaseForDay = phases.findIndex(p => { const r = p.range || p.days; return r && idx >= r[0] && idx <= r[1]; });
        if (phaseForDay !== -1 && phaseForDay !== currentPhaseIdx) {
          currentPhaseIdx = phaseForDay;
          const phase = phases[phaseForDay];
          html += `<div class="phase-label">${esc(phase.label || phase.name || ('Phase ' + (phaseForDay + 1)))}</div>`;
        }
      }

      const cardId = `rc-${idx}`;
      const dist = day.dist && day.dist !== '0 km' ? day.dist : null;
      const dur = day.dur || '';

      // Weather placeholder
      const wxId = `wx-${idx}`;

      html += `<div class="route-card" id="${cardId}">
        <div class="rc-header" onclick="document.getElementById('${cardId}').classList.toggle('open')">
          <span class="rc-emoji">${esc(day.emoji || '📍')}</span>
          <div class="rc-info">
            <div class="rc-day">Jour ${(day.day !== undefined ? day.day : idx + 1)} — ${esc(day.dow || '')} ${esc(day.date || '')}</div>
            <div class="rc-label">${esc(day.label || day.to || '')}</div>
            ${dist ? `<div class="rc-dist">${esc(dist)}${dur ? ' · ' + esc(dur) : ''}</div>` : '<div class="rc-dist">Sur place</div>'}
          </div>
          <div id="${wxId}" class="rc-wx"></div>
          <span class="rc-arrow">›</span>
        </div>
        <div class="rc-detail">`;

      // Highlights
      if (day.highlights && day.highlights.length) {
        html += day.highlights.map(h => {
          // Allow safe links through (same as daily-view.js)
          const safe = h.replace(
            /<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/g,
            (m, href, label) => href.startsWith('#')
              ? `<a href="${href}">${esc(label)}</a>`
              : `<a href="${href}" target="_blank">${esc(label)}</a>`
          ).replace(/<(?!\/a>)(?!a\s)[^>]+>/g, '');
          return `<div class="rc-highlight">• ${safe}</div>`;
        }).join('');
      }

      // Hotel
      if (day.hotel && day.hotel !== '—') {
        html += `<div class="rc-hotel">🏨 ${esc(day.hotel)}</div>`;
      }

      // Link to day
      html += `<div style="margin-top:10px">
        <a href="#programme/${idx}" class="btn-day-link" onclick="App.goToDay(${idx});App.switchTab('programme')">📋 Programme du jour →</a>
      </div>`;

      html += `</div></div>`;
    });

    // mapHtml at bottom — meteoHtml only when online (Route OK sans météo)
    const pendingHtmlFrames = [];
    if (trip.mapHtml) {
      const mapFrameId = 'iframe-map-' + Date.now();
      html += `<div style="margin:20px 0 16px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1)">
        <iframe id="${mapFrameId}" style="width:100%;height:520px;border:0" title="Carte interactive" sandbox="allow-scripts allow-same-origin"></iframe>
      </div>`;
      pendingHtmlFrames.push([trip.mapHtml, mapFrameId]);
    }
    if (trip.meteoHtml && navigator.onLine) {
      const metFrameId = 'iframe-meteo-' + Date.now();
      html += `<div style="margin-bottom:16px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1)">
        <iframe id="${metFrameId}" style="width:100%;height:600px;border:0" title="Météo" sandbox="allow-scripts allow-same-origin"></iframe>
      </div>`;
      pendingHtmlFrames.push([trip.meteoHtml, metFrameId]);
    }

    container.innerHTML = html;
    pendingHtmlFrames.forEach(([ref, id]) => loadHtmlIntoIframe(trip, ref, id));

    // Weather batch: local cache OK offline; live fetch only online
    fetchRouteWeather(tripData, days);
  }

  /**
   * Batch-fetch weather for all unique coords via backend (centralized routing).
   * Backend handles US→NWS, CA→MSC, default→Open-Meteo automatically.
   */
  async function fetchRouteWeather(tripData, days) {
    const trip = tripData.trip || {};
    const startDate = trip.startDate;
    if (!startDate) return;

    // Check cache (3h TTL) — reused offline when still fresh
    const stored = localStorage.getItem('wxRouteCache-v2');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.ts < 3 * 3600000) {
          wxCache = parsed.data;
          renderWeatherInline(days, startDate);
          return;
        }
      } catch(e) {}
    }

    // Offline or no backend: skip (itinerary stays usable)
    if (!navigator.onLine) return;
    if (typeof API === 'undefined' || !API.isReachable()) return;

    // Collect unique coords
    const seen = new Set();
    const coords = [];
    days.forEach(d => {
      if (!d.geo) return;
      const k = `${d.geo.lat},${d.geo.lon}`;
      if (seen.has(k)) return;
      seen.add(k);
      coords.push({ lat: d.geo.lat, lon: d.geo.lon, key: k });
    });
    if (!coords.length) return;

    wxCache = {};
    const country = trip.country || '';

    // Fetch all coords in parallel via backend
    const promises = coords.map(async (c) => {
      try {
        const url = API.url(`/weather/forecast?lat=${c.lat}&lon=${c.lon}&country=${encodeURIComponent(country)}&days=16`);
        const resp = await fetch(url, {
          headers: { 'Authorization': 'Bearer ' + (API.getToken ? API.getToken() : '') },
          signal: AbortSignal.timeout(12000)
        });
        if (!resp.ok) return;
        const fc = await resp.json();
        if (!fc.days || !fc.days.length) return;

        wxCache[c.key] = {
          time: fc.days.map(d => d.date),
          tmin: fc.days.map(d => d.tempMin),
          tmax: fc.days.map(d => d.tempMax),
          rain: fc.days.map(d => d.precipProbability || 0),
          icon: fc.days.map(d => WMO_ICONS[d.weatherCode] || '🌤️'),
          source: fc.days.map(d => d.provider || 'open-meteo')
        };
      } catch(e) { /* silent */ }
    });

    await Promise.allSettled(promises);
    renderWeatherInline(days, startDate);

    // Save cache
    try {
      localStorage.setItem('wxRouteCache-v2', JSON.stringify({ ts: Date.now(), data: wxCache }));
    } catch(e) {}
  }

  /**
   * Inject weather icons + temps into route cards.
   * Use DayHelpers._isoDate (UTC noon) — local T00:00:00 + toISOString
   * shifted dates for Europe/Paris and emptied Québec outlook cards.
   */
  function renderWeatherInline(days, startDate) {
    if (!wxCache) return;

    days.forEach((day, idx) => {
      const el = document.getElementById(`wx-${idx}`);
      if (!el || !day.geo) return;
      const k = `${day.geo.lat},${day.geo.lon}`;
      const loc = wxCache[k];
      if (!loc) return;

      const iso = day._isoDate
        || (typeof DayHelpers !== 'undefined' && DayHelpers.isoDate
          ? DayHelpers.isoDate(day, { startDate })
          : '');
      if (!iso) { el.innerHTML = ''; return; }

      const di = loc.time.indexOf(iso);
      // Missing day OR last-window 200 with null temps (Open-Meteo accepts
      // the date then sends empty slots — do not paint 0°/0°).
      if (di === -1 || loc.tmax[di] == null || loc.tmin[di] == null) {
        el.innerHTML = `<div style="text-align:center;min-width:48px;color:var(--muted);font-size:.62em;line-height:1.2" title="Prévisions 16j max">16j+</div>`;
        return;
      }

      const icon = loc.icon[di] || '🌤️';
      const tmax = Math.round(loc.tmax[di]);
      const tmin = Math.round(loc.tmin[di]);
      const rain = loc.rain[di] || 0;
      const src = loc.source[di] || 'open-meteo';
      const srcBadge = src === 'nws' ? '<span style="font-size:.55em;color:var(--green)" title="NWS">★</span>'
        : src === 'msc' ? '<span style="font-size:.55em;color:var(--green)" title="MSC 🇨🇦">★</span>' : '';

      el.innerHTML = `<div style="text-align:center;min-width:48px">
        <div style="font-size:1.2em">${icon}</div>
        <div style="font-size:.68em;font-weight:700">${tmin}°/${tmax}°</div>
        ${rain >= 30 ? `<div style="font-size:.6em;color:var(--accent)">🌧${rain}%</div>` : ''}
        ${srcBadge}
      </div>`;
    });
  }

  /**
   * Fetch HTML content and inject into an iframe via srcdoc/blob URL.
   * This bypasses content-type issues (e.g. backend serving text/plain or application/octet-stream).
   */
  function loadHtmlIntoIframe(trip, htmlRef, iframeId) {
    const url = htmlRef.startsWith('http') ? htmlRef
      : (typeof API !== 'undefined' && API.assetUrl ? API.assetUrl(trip.id, htmlRef) : htmlRef);

    // Use setTimeout to ensure the iframe is in the DOM after container.innerHTML is set
    setTimeout(async () => {
      const iframe = document.getElementById(iframeId);
      if (!iframe) return;
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          iframe.srcdoc = `<body style="background:#1e293b;color:#f87171;padding:2rem;font-family:sans-serif"><h3>⚠️ Erreur chargement</h3><p>${url} — ${resp.status}</p></body>`;
          return;
        }
        const html = await resp.text();
        // Use blob URL for full isolation (scripts, styles, etc.)
        const blob = new Blob([html], { type: 'text/html' });
        iframe.src = URL.createObjectURL(blob);
      } catch (e) {
        const offline = !navigator.onLine;
        iframe.srcdoc = `<body style="background:#1e293b;color:#94a3b8;padding:2rem;font-family:sans-serif"><h3>${offline ? '📴 Hors ligne' : '⚠️ Erreur réseau'}</h3><p>${offline ? 'Carte interactive indisponible sans réseau (l’itinéraire texte reste OK).' : (e.message || '')}</p></body>`;
      }
    }, 0);
  }

  return { render };
})();
;
/* ==== js/components/culture-view.js ==== */
/**
 * culture-view.js — Cultural guide with multi-carnet swipe + expandable zones
 * Data comes from tripData.culture[] (array of zones with sections & facts)
 * 
 * Carnet 1: Road Trip (zones 0..N-1)
 * Carnet 2: Last zone = Montréal (if title contains 'Montréal' or 'Québec')
 */

var CultureView = (() => {

  let currentCarnet = 0;
  let carnetCount = 1;

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /**
   * Render the culture view with multi-carnet support.
   */
  function render(containerId, tripData) {
    const container = document.getElementById(containerId);
    const culture = tripData?.culture;

    if (!culture || !culture.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">📚</div>
        <h3>Carnet culturel</h3>
        <p style="color:var(--muted)">Pas encore de contenu culturel chargé.</p>
      </div>`;
      return;
    }

    // Split: detect if last zone is a separate carnet (e.g. Montréal)
    const lastZone = culture[culture.length - 1];
    const lastIsSeparate = lastZone.title && (
      lastZone.title.includes('Montréal') || lastZone.title.includes('Québec') || lastZone.title.includes('Montreal')
    );
    const roadTripZones = lastIsSeparate ? culture.slice(0, -1) : culture;
    const mtlZone = lastIsSeparate ? lastZone : null;
    carnetCount = mtlZone ? 2 : 1;
    currentCarnet = 0;

    let html = `<div class="page-header">
      <h1>📚 Carnet Culturel</h1>
      <div class="sub">Swipe ou tap pour changer de carnet</div>
    </div>`;

    // Carnet tabs (only if 2 carnets)
    if (carnetCount > 1) {
      html += `<div class="carnet-switcher">
        <div class="carnet-tabs">
          <button class="carnet-tab active" onclick="CultureView.switchCarnet(0)">🗺️ Road Trip</button>
          <button class="carnet-tab" onclick="CultureView.switchCarnet(1)">🍁 Montréal</button>
        </div>
      </div>`;
    }

    // Swipe container
    html += `<div id="carnetSwipe" class="carnet-swipe">`;
    html += `<div id="carnetTrack" class="carnet-track">`;

    // ── Carnet 1: Road Trip ──
    html += `<div class="carnet-panel" id="cultureList">`;
    html += renderZones(roadTripZones, 'rt');
    html += `</div>`;

    // ── Carnet 2: Montréal ──
    if (mtlZone) {
      html += `<div class="carnet-panel" id="cultureListMtl">`;
      html += `<div style="text-align:center;padding:16px;background:linear-gradient(135deg,rgba(233,69,96,.1),rgba(78,205,196,.1));border-radius:var(--radius);margin-bottom:14px">
        <div style="font-size:2em;margin-bottom:4px">🍁</div>
        <div style="font-size:1.1em;font-weight:700;color:var(--accent)">Bienvenue à Montréal !</div>
        <div style="color:var(--muted);font-size:.8em;margin-top:4px">Phase 3 • Jours 15-19 • La Belle Province</div>
      </div>`;
      html += renderZones([mtlZone], 'mtl');
      html += `</div>`;
    }

    html += `</div></div>`; // carnet-track, carnet-swipe

    // Dots
    if (carnetCount > 1) {
      html += `<div class="carnet-dots">
        <div class="dot active"></div>
        <div class="dot"></div>
      </div>`;
    }

    container.innerHTML = html;

    // Setup swipe
    if (carnetCount > 1) setupSwipe();
  }

  function renderZones(zones, prefix) {
    let html = '';
    zones.forEach((zone, zi) => {
      const zoneId = `cz-${prefix}-${zi}`;
      html += `<div class="culture-zone" id="${zoneId}">
        <div class="cz-header" onclick="document.getElementById('${zoneId}').classList.toggle('open')">
          <div class="cz-title">${esc(zone.title)}</div>
          ${zone.sub ? `<div class="cz-sub">${esc(zone.sub)}</div>` : ''}
          <span class="cz-arrow">›</span>
        </div>
        <div class="cz-body">`;

      if (zone.sections && zone.sections.length) {
        zone.sections.forEach((sec, si) => {
          const secId = `cs-${prefix}-${zi}-${si}`;
          html += `<div class="culture-section" id="${secId}">
            <div class="cs-header" onclick="document.getElementById('${secId}').classList.toggle('open')">
              <span class="cs-title">${esc(sec.h)}</span>
              <span class="cs-toggle">+</span>
            </div>
            <div class="cs-body"><p>${esc(sec.p)}</p></div>
          </div>`;
        });
      }

      if (zone.facts && zone.facts.length) {
        html += `<div class="culture-facts"><div class="cf-title">💡 Le saviez-vous ?</div>`;
        zone.facts.forEach(f => { html += `<div class="cf-item">${esc(f)}</div>`; });
        html += `</div>`;
      }

      html += `</div></div>`;
    });
    return html;
  }

  function switchCarnet(idx) {
    currentCarnet = idx;
    const track = document.getElementById('carnetTrack');
    if (track) track.style.transform = `translateX(-${idx * 100}%)`;
    document.querySelectorAll('.carnet-tab').forEach((t,i) => t.classList.toggle('active', i===idx));
    document.querySelectorAll('.carnet-dots .dot').forEach((d,i) => d.classList.toggle('active', i===idx));
  }

  function setupSwipe() {
    const el = document.getElementById('carnetSwipe');
    if (!el) return;
    let startX=0, dx=0, moving=false;
    el.addEventListener('touchstart', e => { startX=e.touches[0].clientX; dx=0; moving=false; }, {passive:true});
    el.addEventListener('touchmove', e => {
      const mx = e.touches[0].clientX - startX;
      const my = e.touches[0].clientY - (startX ? e.touches[0].clientY : 0); // approx
      if (!moving && Math.abs(mx) > 10) moving = true;
      if (moving) {
        dx = mx;
        const track = document.getElementById('carnetTrack');
        if (track) track.style.transform = `translateX(calc(-${currentCarnet*100}% + ${dx}px))`;
        e.preventDefault();
      }
    }, {passive:false});
    el.addEventListener('touchend', () => {
      if (Math.abs(dx) > 60) {
        if (dx < 0 && currentCarnet < carnetCount - 1) switchCarnet(currentCarnet + 1);
        else if (dx > 0 && currentCarnet > 0) switchCarnet(currentCarnet - 1);
        else switchCarnet(currentCarnet);
      } else {
        switchCarnet(currentCarnet);
      }
    }, {passive:true});
  }

  return { render, switchCarnet };
})();
;
/* ==== js/components/trip-selector.js ==== */
/**
 * trip-selector.js — Trip picker on Plus.
 * Participants + not finished stay visible (Voyage actif). Past trips I was
 * on, and trips I am not on, are collapsed. GH publish rows live in
 * « Publier depuis git », not here.
 *
 * Classification uses GET /trips list metadata (dates + data.travelers/users),
 * not only a fully downloaded seed.
 */

var TripSelector = (() => {
  let _login = undefined;

  async function currentLogin() {
    if (_login !== undefined) return _login;
    const stored = (typeof localStorage !== 'undefined'
      && (localStorage.getItem('tk-user') || localStorage.getItem('tk-user-name')))
      || '';
    if (typeof API !== 'undefined' && API.getMe && navigator.onLine) {
      try {
        const res = await API.getMe();
        if (res && res.ok && res.data && res.data.user) {
          _login = String(res.data.user);
          try { localStorage.setItem('tk-user', _login); } catch (_) {}
          return _login;
        }
      } catch (e) {
        console.debug('[TripSelector] /me failed:', e.message);
      }
    }
    _login = stored;
    return _login;
  }

  /**
   * Render trip selector into container.
   * Fetches backend trips list to discover new trips.
   * @param {HTMLElement} container
   */
  async function render(container) {
    if (!container) return;

    // Fetch backend trips: discover new + drop orphans (only on success).
    // Network failure → keep local registry (offline-safe).
    if (navigator.onLine && typeof API !== 'undefined') {
      try {
        const resp = await API.getTrips();
        const backendTrips = Array.isArray(resp)
          ? resp
          : (resp && Array.isArray(resp.results) ? resp.results : null);
        if (backendTrips) {
          Store.reconcileTripsFromServer(backendTrips.map(t => t && t.id).filter(Boolean));
          backendTrips.forEach(t => {
            const id = t && t.id;
            if (!id) return;
            if (typeof TripGroups !== 'undefined' && TripGroups.mergeListItem) {
              Store.setTripData(id, TripGroups.mergeListItem(Store.getTripData(id), t));
              return;
            }
            if (!Store.getTripData(id)) {
              const extra = t.data
                ? (typeof t.data === 'string' ? JSON.parse(t.data) : t.data)
                : {};
              Store.setTripData(id, {
                trip: {
                  id: id,
                  name: t.name || id,
                  emoji: t.emoji || '🌍',
                  startDate: t.start_date || extra.startDate,
                  endDate: t.end_date || extra.endDate,
                  travelers: extra.travelers || [],
                  phases: extra.phases || [],
                  users: extra.users || {},
                },
                people: extra.people || {},
                days: [],
                hotels: Array.isArray(extra.hotels)
                  ? extra.hotels.reduce((d, h) => { if (h.id) d[h.id] = h; return d; }, {})
                  : (extra.hotels || {}),
              });
            }
          });
        }
      } catch (e) {
        console.debug('[TripSelector] Backend fetch failed:', e.message);
      }
    }

    const tripIds = Store.getAllTripIds();
    const currentId = Store.getCurrentTripId();
    const login = await currentLogin();
    const allData = tripIds.map((id) => Store.getTripData(id)).filter(Boolean);
    const knownIds = (typeof TripGroups !== 'undefined' && TripGroups.identityPersonIds)
      ? TripGroups.identityPersonIds(allData, login)
      : null;

    if (!tripIds.length) {
      container.innerHTML = `<div class="empty-state">
        <div class="empty-emoji">🌍</div>
        <h3>Aucun voyage</h3>
        <p>Les données de voyage n'ont pas encore été chargées.</p>
      </div>`;
      return;
    }

    const groups = { open: [], past: [], others: [] };
    tripIds.forEach((id) => {
      const data = Store.getTripData(id);
      if (!data) return;
      const kind = (typeof TripGroups !== 'undefined' && TripGroups.bucket)
        ? TripGroups.bucket(data, login, undefined, knownIds)
        : 'open';
      (groups[kind] || groups.open).push({ id, data });
    });

    const byStart = (a, b) => {
      const sa = (a.data.trip || a.data).startDate || '';
      const sb = (b.data.trip || b.data).startDate || '';
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    };
    groups.open.sort(byStart);
    groups.past.sort((a, b) => byStart(b, a));
    groups.others.sort(byStart);

    let html = '';
    groups.open.forEach(({ id, data }) => { html += tripRow(id, data, currentId); });
    html += collapsedGroup('past', '🕰️ Voyages passés', groups.past, currentId);
    html += collapsedGroup('others', '👥 Autres voyages', groups.others, currentId);

    container.innerHTML = html;
    bindCollapse(container);
  }

  function collapsedGroup(key, title, tripItems, currentId) {
    if (!tripItems.length) return '';
    let body = '';
    tripItems.forEach(({ id, data }) => { body += tripRow(id, data, currentId); });
    return `<div class="section-wrap plus-docs-wrap plus-trips-wrap">
      <div class="section-head collapsed plus-docs-head plus-trips-head" data-trips-group="${key}"
        role="button" tabindex="0" aria-expanded="false" aria-controls="plus-trips-body-${key}">
        <span class="s-title">${title}</span>
        <span class="s-count">${tripItems.length}</span>
        <span class="s-chevron">▼</span>
      </div>
      <div class="section-body hidden plus-docs-body plus-trips-body" id="plus-trips-body-${key}">${body}</div>
    </div>`;
  }

  function tripRow(id, data, currentId) {
    const trip = data.trip || data;
    const isActive = id === currentId;
    const startDate = trip.startDate ? formatDate(trip.startDate) : '';
    const endDate = trip.endDate ? formatDate(trip.endDate) : '';
    const dateStr = (startDate && endDate) ? `${startDate} → ${endDate}` : (startDate || '');
    const people = data.people;
    const travelers = trip.travelers
      ? `<div class="trip-dates">${trip.travelers.map((t) =>
        (typeof PeopleHelpers !== 'undefined')
          ? PeopleHelpers.displayName(t, people)
          : (t.name || t.personId || '?')
      ).join(', ')}</div>`
      : '';
    return `<div class="trip-item ${isActive ? 'active' : ''}" onclick="TripSelector.select('${escapeAttr(id)}')">
        <span class="trip-emoji">${escapeHtml(trip.emoji || '🌍')}</span>
        <div class="trip-info">
          <div class="trip-name">${escapeHtml(trip.name || id)}</div>
          ${dateStr ? `<div class="trip-dates">${dateStr}</div>` : ''}
          ${travelers}
        </div>
        <span class="trip-arrow">${isActive ? '✓' : '›'}</span>
      </div>`;
  }

  function bindCollapse(root) {
    if (!root) return;
    root.querySelectorAll('.plus-trips-head').forEach((head) => {
      if (head.dataset.bound === '1') return;
      head.dataset.bound = '1';
      const key = head.getAttribute('data-trips-group');
      const body = root.querySelector(`#plus-trips-body-${key}`);
      if (!body) return;
      const toggle = () => {
        const open = body.classList.toggle('hidden') === false;
        head.classList.toggle('collapsed', !open);
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      head.addEventListener('click', toggle);
      head.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  /**
   * Select a trip and reload all views.
   * If trip data is minimal (just metadata), fetch full seed from backend.
   * @param {string} tripId
   */
  async function select(tripId) {
    Store.setCurrentTripId(tripId);

    // Keep local cache until a successful seed fetch (offline-safe).
    const hadLocal = !!Store.getTripData(tripId);

    if (navigator.onLine && typeof API !== 'undefined') {
      try {
        const up = API.isReachable && API.isReachable()
          ? true
          : (API.probe ? await API.probe() : true);
        if (up) {
          const ver = await API.checkVersion(tripId);
          const seed = await API.fetchSeed(tripId);
          if (seed) {
            const tripData = SeedMerge.merge(seed, Store.getTripData(tripId) || {});
            Store.setTripData(tripId, tripData);
            if (ver) Store.set(tripId + '-data-version', ver.version);
          } else if (!hadLocal) {
            App.showToast('Serveur injoignable — pas de données locales', 'error');
          }
        }
      } catch (e) {
        console.debug('[TripSelector] Failed to fetch trip data:', e.message);
      }
    }

    App.reloadAllViews();
    App.showToast(hadLocal || Store.getTripData(tripId) ? 'Voyage sélectionné !' : 'Chargement…', 'success');
  }

  function formatDate(isoDate) {
    try {
      const d = new Date(isoDate + 'T12:00:00');
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return isoDate; }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;');
  }

  return { render, select };
})();
;
/* ==== js/components/publish-panel.js ==== */
/**
 * publish-panel.js — Créer / Mettre à jour un voyage depuis git (family publish)
 */
var PublishPanel = (() => {
  let _jobId = null;
  let _pollTimer = null;
  let _sources = [];
  let _login = undefined;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function loadSources() {
    const res = await API.getPublishSources();
    if (!res.ok || !Array.isArray(res.data)) {
      _sources = [];
      return _sources;
    }
    _sources = res.data;
    return _sources;
  }

  function sources() { return _sources; }

  async function currentLogin() {
    if (_login !== undefined) return _login;
    const stored = (typeof localStorage !== 'undefined'
      && (localStorage.getItem('tk-user') || localStorage.getItem('tk-user-name')))
      || '';
    if (typeof API !== 'undefined' && API.getMe && navigator.onLine) {
      try {
        const res = await API.getMe();
        if (res && res.ok && res.data && res.data.user) {
          _login = String(res.data.user);
          try { localStorage.setItem('tk-user', _login); } catch (_) {}
          return _login;
        }
      } catch (e) {
        console.debug('[PublishPanel] /me failed:', e.message);
      }
    }
    _login = stored;
    return _login;
  }

  function allTripDatas() {
    if (typeof Store === 'undefined' || !Store.getAllTripIds) return [];
    return Store.getAllTripIds().map((id) => Store.getTripData(id)).filter(Boolean);
  }

  function groupByFamily(sources) {
    const order = [];
    const map = {};
    (sources || []).forEach((s) => {
      const id = String(s.sourceId || s.family || 'other');
      if (!map[id]) {
        map[id] = { id, family: s.family || id, repo: s.repo || '', items: [] };
        order.push(id);
      }
      map[id].items.push(s);
      if (!map[id].repo && s.repo) map[id].repo = s.repo;
    });
    return order.map((id) => map[id]);
  }

  function familyLabel(id, family) {
    const raw = String(family || id || '').trim();
    if (!raw) return 'Famille';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  function isMineFamily(fam, login, knownIds) {
    if (!fam || !fam.items || !fam.items.length) return true;
    if (typeof TripGroups === 'undefined' || !TripGroups.isMySource) return true;
    return fam.items.some((s) => TripGroups.isMySource(s, login, knownIds));
  }

  async function renderSection(container) {
    if (!container) return;
    if (!_sources.length) {
      container.innerHTML = '';
      return;
    }
    const login = await currentLogin();
    const knownIds = (typeof TripGroups !== 'undefined' && TripGroups.identityPersonIds)
      ? TripGroups.identityPersonIds(allTripDatas(), login)
      : null;
    const families = groupByFamily(_sources);
    const mine = [];
    const others = [];
    families.forEach((fam) => {
      (isMineFamily(fam, login, knownIds) ? mine : others).push(fam);
    });

    let html = `<div class="publish-section">
      <h3 class="section-title">Publier depuis git</h3>
      <p class="publish-hint">Créer ou mettre à jour un voyage depuis le repo famille (après QA).</p>`;
    mine.forEach((fam) => { html += familyBlock(fam); });
    if (others.length) {
      let body = '';
      others.forEach((fam) => { body += familyBlock(fam); });
      const n = others.reduce((acc, f) => acc + f.items.length, 0);
      html += collapsedGroup('others', '👥 Autres familles', n, body);
    }
    html += `<div id="publish-job-status" class="publish-job-status" hidden></div></div>`;
    container.innerHTML = html;
    bindPublishButtons(container);
    bindCollapse(container);
  }

  function familyBlock(fam) {
    const title = familyLabel(fam.id, fam.family);
    let rows = '';
    fam.items.forEach((s) => { rows += sourceRow(s); });
    return `<div class="publish-family" data-family="${escapeHtml(fam.id)}">
      <div class="publish-family-head">
        <span class="publish-family-name">${escapeHtml(title)}</span>
        ${fam.repo ? `<span class="publish-family-repo">${escapeHtml(fam.repo)}</span>` : ''}
      </div>
      ${rows}
    </div>`;
  }

  function collapsedGroup(key, title, count, body) {
    return `<div class="section-wrap plus-docs-wrap plus-trips-wrap">
      <div class="section-head collapsed plus-docs-head plus-trips-head" data-publish-group="${escapeHtml(key)}"
        role="button" tabindex="0" aria-expanded="false" aria-controls="plus-publish-body-${escapeHtml(key)}">
        <span class="s-title">${escapeHtml(title)}</span>
        <span class="s-count">${count}</span>
        <span class="s-chevron">▼</span>
      </div>
      <div class="section-body hidden plus-docs-body plus-trips-body" id="plus-publish-body-${escapeHtml(key)}">${body}</div>
    </div>`;
  }

  function sourceRow(s) {
    const label = s.operation === 'create' ? 'Créer le voyage' : 'Mettre à jour le voyage';
    const backendUp = typeof API !== 'undefined' && API.isReachable ? API.isReachable() : navigator.onLine;
    const disabled = !s.enabled || !navigator.onLine || !backendUp;
    const badge = s.enabled ? '' : ' <span class="publish-badge">inactif</span>';
    return `<div class="publish-row" data-source="${escapeHtml(s.sourceId)}" data-trip="${escapeHtml(s.tripId)}">
        <div class="publish-meta">
          <div class="publish-name">${escapeHtml(s.title || s.tripId)}${badge}</div>
          <div class="publish-sub">${escapeHtml(s.repo)} · ${escapeHtml(s.seedPath)} · ${escapeHtml(s.operation)}</div>
        </div>
        <button type="button" class="btn btn-primary publish-btn"
          ${disabled ? 'disabled' : ''}
          data-action="publish"
          data-source="${escapeHtml(s.sourceId)}"
          data-trip="${escapeHtml(s.tripId)}"
          data-op="${escapeHtml(s.operation)}">${escapeHtml(label)}</button>
      </div>`;
  }

  function bindCollapse(root) {
    if (!root) return;
    root.querySelectorAll('[data-publish-group]').forEach((head) => {
      if (head.dataset.bound === '1') return;
      head.dataset.bound = '1';
      const key = head.getAttribute('data-publish-group');
      const body = root.querySelector(`#plus-publish-body-${key}`);
      if (!body) return;
      const toggle = () => {
        const open = body.classList.toggle('hidden') === false;
        head.classList.toggle('collapsed', !open);
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      head.addEventListener('click', toggle);
      head.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  function bindPublishButtons(container) {
    if (!container) return;
    container.querySelectorAll('[data-action="publish"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceId = btn.dataset.source;
        const tripId = btn.dataset.trip;
        const op = btn.dataset.op;
        if (op === 'create') openCreateModal(sourceId, tripId);
        else startJob({ sourceId, tripId, confirmCreate: false });
      });
    });
  }

  function openCreateModal(sourceId, tripId) {
    const src = _sources.find(s => s.sourceId === sourceId && s.tripId === tripId);
    const overlay = document.createElement('div');
    overlay.className = 'weather-modal-overlay publish-modal-overlay';
    overlay.innerHTML = `<div class="weather-modal publish-modal" role="dialog">
      <button type="button" class="wm-close" aria-label="Fermer">×</button>
      <h2>Créer « ${escapeHtml(src?.title || tripId)} » ?</h2>
      <ul class="publish-modal-list">
        <li>Source : ${escapeHtml(src?.repo || '')} @ ${escapeHtml(src?.ref || 'main')}</li>
        <li>Fichier : ${escapeHtml(src?.seedPath || '')}</li>
        <li>Famille : ${escapeHtml(src?.family || '')}</li>
      </ul>
      <p class="publish-hint">La QA tourne avant l'import. En cas d'erreur, la prod reste intacte.</p>
      <div class="btn-row">
        <button type="button" class="btn" data-act="cancel">Annuler</button>
        <button type="button" class="btn btn-primary" data-act="confirm">Vérifier puis créer</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.querySelector('.wm-close').onclick = close;
    overlay.querySelector('[data-act="cancel"]').onclick = close;
    overlay.querySelector('[data-act="confirm"]').onclick = () => {
      close();
      startJob({ sourceId, tripId, confirmCreate: true });
    };
  }

  async function startJob({ sourceId, tripId, confirmCreate }) {
    stopPoll();
    const statusEl = document.getElementById('publish-job-status');
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.innerHTML = `<div class="progress-wrap publish-steps">
        <div class="progress-bar"><div class="progress-fill" style="width:10%"></div></div>
        <ol class="publish-step-list"><li class="active">Mise en file…</li></ol>
      </div>`;
    }
    document.querySelectorAll('.publish-btn').forEach(b => { b.disabled = true; });

    if (typeof API.probe === 'function') {
      const up = await API.probe();
      if (!up) {
        showErrors(statusEl, { ok: false, error: 'Backend injoignable — réessaie quand le réseau fonctionne vraiment' });
        document.querySelectorAll('.publish-btn').forEach(b => { b.disabled = true; });
        return;
      }
    }

    const res = await API.createPublishJob({ sourceId, tripId, confirmCreate: !!confirmCreate });
    if (!res.ok) {
      showErrors(statusEl, res);
      const up = typeof API.isReachable === 'function' ? API.isReachable() : navigator.onLine;
      document.querySelectorAll('.publish-btn').forEach(b => { b.disabled = !up; });
      return;
    }
    _jobId = res.data.id;
    try { sessionStorage.setItem('tk-publish-job', _jobId); } catch (_) {}
    pollJob();
  }

  function showErrors(el, res) {
    if (!el) return;
    const errs = (res.data && res.data.errors) || [];
    const msg = res.error || (res.data && res.data.error) || 'Échec';
    let body = `<div class="publish-errors"><strong>${escapeHtml(msg)}</strong>`;
    if (errs.length) {
      body += `<pre>${escapeHtml(errs.map(e => e.message || e).join('\n'))}</pre>`;
    } else if (res.data && res.data.error && res.data.error !== msg) {
      body += `<pre>${escapeHtml(res.data.error)}</pre>`;
    }
    body += `<button type="button" class="btn" onclick="this.closest('.publish-errors').remove()">Fermer</button></div>`;
    el.innerHTML = body;
    el.hidden = false;
  }

  function pollJob() {
    stopPoll();
    let netFails = 0;
    _pollTimer = setInterval(async () => {
      if (!_jobId) return;
      const res = await API.getPublishJob(_jobId);
      if (!res.ok) {
        netFails += 1;
        if (netFails >= 5) {
          stopPoll();
          const el = document.getElementById('publish-job-status');
          showErrors(el, { ok: false, error: 'Réseau instable — le job continue côté serveur. Réouvre Plus pour reprendre.' });
        }
        return;
      }
      netFails = 0;
      const job = res.data;
      renderJobProgress(job);
      if (job.status === 'succeeded' || job.status === 'failed') {
        stopPoll();
        const up = typeof API.isReachable === 'function' ? API.isReachable() : navigator.onLine;
        document.querySelectorAll('.publish-btn').forEach(b => { b.disabled = !up; });
        try { sessionStorage.removeItem('tk-publish-job'); } catch (_) {}
        if (job.status === 'succeeded') {
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast(job.operation === 'create' ? '✅ Voyage créé' : `Mis à jour · v${job.dataVersion || ''}`);
          }
          if (typeof TripSelector !== 'undefined' && TripSelector.render) {
            const host = document.getElementById('plus-trip-selector');
            if (host) TripSelector.render(host);
          }
          if (job.tripId && typeof App !== 'undefined' && App.selectTrip) {
            App.selectTrip(job.tripId);
          }
        }
      }
    }, 1500);
  }

  function renderJobProgress(job) {
    const el = document.getElementById('publish-job-status');
    if (!el) return;
    if (job.status === 'failed') {
      showErrors(el, { ok: false, error: job.errorCode || 'failed', data: job });
      return;
    }
    const pct = Math.max(5, Math.min(100, job.progress || 0));
    el.hidden = false;
    el.innerHTML = `<div class="progress-wrap publish-steps">
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <ol class="publish-step-list">
        <li class="${job.stage ? 'done' : ''}">Fetch repo…</li>
        <li class="${job.stage === 'validating' || job.stage === 'applying' || job.stage === 'acl' || job.status === 'succeeded' ? 'done' : (job.stage === 'parsing' ? 'active' : '')}">Parse / QA…</li>
        <li class="${job.stage === 'applying' || job.stage === 'acl' || job.status === 'succeeded' ? 'done' : (job.stage === 'applying' ? 'active' : '')}">Import…</li>
        <li class="${job.status === 'succeeded' ? 'done' : (job.stage === 'acl' ? 'active' : '')}">ACL…</li>
      </ol>
      <div class="progress-text">${escapeHtml(job.stage || job.status)} · ${pct}%</div>
    </div>`;
  }

  function stopPoll() {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  }

  async function resumeIfNeeded() {
    try {
      const id = sessionStorage.getItem('tk-publish-job');
      if (!id) return;
      _jobId = id;
      pollJob();
    } catch (_) {}
  }

  return { loadSources, sources, renderSection, resumeIfNeeded, startJob, sourceRow, bindPublishButtons };
})();
;
/* ==== js/components/polarsteps-panel.js ==== */
/**
 * polarsteps-panel.js — Plus « Polarsteps » (journal du jour, texte à coller).
 *
 * Visible when GET /trips/:id/polarsteps/status says enabled. If that call
 * fails, fall back to seed `trip.polarsteps.enabled` so the Plus landmark
 * does not vanish on a 5xx / timeout (looks like the box was deleted).
 * Explicit `enabled: false` from the API still hides the section.
 */
var PolarstepsPanel = (() => {
  const JOB_KEY = 'tk-polarsteps-job';
  const SEQ_KEY = 'tk-polarsteps-seq';

  let _status = null;
  let _busy = false;
  let _edited = false;
  let _baseline = '';
  let _jobId = null;
  let _lastSeq = 0;
  let _abort = null;

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function currentTripId() {
    return (typeof Store !== 'undefined' && Store.getCurrentTripId)
      ? Store.getCurrentTripId()
      : null;
  }

  function seedPolarsteps() {
    const tripId = currentTripId();
    if (!tripId || typeof Store === 'undefined' || !Store.getTripData) return null;
    const td = Store.getTripData(tripId);
    const ps = td && td.trip && td.trip.polarsteps;
    return (ps && typeof ps === 'object') ? ps : null;
  }

  function fallbackStatus(reason) {
    const seed = seedPolarsteps();
    return {
      enabled: !!(seed && seed.enabled),
      ready: false,
      reason: reason || 'unreachable',
      tripUrl: (seed && seed.tripUrl) || '',
    };
  }

  async function loadStatus() {
    const tripId = currentTripId();
    if (!tripId || typeof API === 'undefined' || !API.getPolarstepsStatus) {
      _status = fallbackStatus('no_trip');
      return _status;
    }
    try {
      const res = await API.getPolarstepsStatus(tripId);
      if (!res.ok || !res.data) {
        _status = fallbackStatus((res && res.error) || 'unreachable');
        return _status;
      }
      _status = res.data;
      const seed = seedPolarsteps();
      if (!_status.tripUrl && seed && seed.tripUrl) _status.tripUrl = seed.tripUrl;
      return _status;
    } catch (e) {
      _status = fallbackStatus((e && e.message) || 'unreachable');
      return _status;
    }
  }

  function backendUp() {
    if (typeof API !== 'undefined' && API.isReachable) return API.isReachable();
    return navigator.onLine;
  }

  function renderSection(container) {
    if (!container) return;
    const enabled = !!(_status && _status.enabled);
    if (!enabled) {
      container.innerHTML = '';
      return;
    }
    const ready = !!(_status && _status.ready) && navigator.onLine && backendUp();
    const tripUrl = (_status && _status.tripUrl) || '';
    const link = tripUrl
      ? `<p class="leo-hint"><a href="${escapeHtml(tripUrl)}" target="_blank" rel="noopener">Ouvrir Polarsteps</a></p>`
      : '';

    container.innerHTML = `<div class="publish-section polarsteps-section">
      <h3 class="section-title">Polarsteps</h3>
      <p class="leo-hint">Journal à coller dans Polarsteps. Plusieurs steps par jour OK — on ne répète pas ce qui a déjà été généré.</p>
      <div class="leo-compose">
        <textarea id="polarsteps-note" rows="2"
          placeholder="ex. on a vu 3 baleines, resto changé, Baptiste à YUL"
          ${!ready || _busy ? 'disabled' : ''}></textarea>
        <button type="button" class="btn btn-primary" id="polarsteps-generate"
          ${!ready || _busy ? 'disabled' : ''}>Générer le texte</button>
      </div>
      <div id="polarsteps-error" class="publish-errors polarsteps-error" hidden></div>
      <div id="polarsteps-result-wrap" hidden>
        <textarea id="polarsteps-result" class="polarsteps-result" rows="8"></textarea>
        <p id="polarsteps-qa-hint" class="leo-hint" hidden></p>
        <div class="polarsteps-actions">
          <button type="button" class="btn btn-primary" id="polarsteps-copy">Copier</button>
        </div>
      </div>
      ${link}
    </div>`;

    const gen = document.getElementById('polarsteps-generate');
    if (gen) gen.addEventListener('click', (e) => { e.preventDefault(); generate(); });
    const copy = document.getElementById('polarsteps-copy');
    if (copy) copy.addEventListener('click', (e) => { e.preventDefault(); copyResult(); });
    const result = document.getElementById('polarsteps-result');
    if (result) {
      result.addEventListener('input', () => {
        _edited = result.value !== _baseline;
      });
    }

    loadLast();
    resumeIfNeeded();
  }

  async function loadLast() {
    const tripId = currentTripId();
    if (!tripId || typeof API === 'undefined' || !API.getPolarstepsCaption) return;
    const res = await API.getPolarstepsCaption(tripId);
    if (!res.ok || !res.data || !res.data.text) return;
    paintResult(res.data.text, res.data.qa, false);
  }

  function setBusy(on) {
    _busy = !!on;
    const gen = document.getElementById('polarsteps-generate');
    const note = document.getElementById('polarsteps-note');
    const ready = !!(_status && _status.ready) && navigator.onLine && backendUp();
    if (gen) {
      gen.disabled = _busy || !ready;
      gen.textContent = _busy ? 'Génération…' : 'Générer le texte';
    }
    if (note) note.disabled = _busy || !ready;
  }

  function showError(msg) {
    const el = document.getElementById('polarsteps-error');
    if (!el) return;
    el.hidden = !msg;
    el.innerHTML = msg ? `<strong>${escapeHtml(msg)}</strong>` : '';
  }

  function paintResult(text, qa, fromGenerate) {
    const wrap = document.getElementById('polarsteps-result-wrap');
    const ta = document.getElementById('polarsteps-result');
    const hint = document.getElementById('polarsteps-qa-hint');
    if (!wrap || !ta) return;
    wrap.hidden = !text;
    ta.value = text || '';
    _baseline = text || '';
    _edited = false;
    if (hint) {
      const warn = qa && (qa.verdict === 'WARNING' || qa.Verdict === 'WARNING');
      hint.hidden = !warn;
      hint.textContent = warn ? ((qa.summary || qa.Summary || 'QA WARNING')) : '';
    }
    if (fromGenerate) showError('');
  }

  function persistJob() {
    try {
      if (!_jobId) {
        sessionStorage.removeItem(JOB_KEY);
        sessionStorage.removeItem(SEQ_KEY);
        return;
      }
      sessionStorage.setItem(JOB_KEY, _jobId);
      sessionStorage.setItem(SEQ_KEY, String(_lastSeq || 0));
    } catch (_) {}
  }

  function clearJob() {
    _jobId = null;
    _lastSeq = 0;
    persistJob();
  }

  async function generate() {
    const tripId = currentTripId();
    if (!tripId || _busy) return;
    const ta = document.getElementById('polarsteps-result');
    if (_edited && ta && ta.value.trim() && !window.confirm('Remplacer le texte déjà modifié ?')) {
      return;
    }
    const noteEl = document.getElementById('polarsteps-note');
    const userNote = noteEl ? String(noteEl.value || '').trim() : '';
    setBusy(true);
    showError('');
    try {
      const posted = await API.postPolarstepsCaption(tripId, {
        userNote,
        clientNowISO: new Date().toISOString(),
      });
      const jobId = posted && posted.data && posted.data.jobId;
      // Mixed rollout: old BE still answers 200 {text,qa} on the POST.
      if (posted && posted.ok && !jobId && posted.data && posted.data.text) {
        paintResult(posted.data.text, posted.data.qa, true);
        setBusy(false);
        return;
      }
      if (!posted || !posted.ok || !jobId) {
        const msg = (posted && (posted.data && posted.data.error || posted.error))
          || 'Génération impossible';
        paintResult('', null, true);
        showError(msg);
        setBusy(false);
        return;
      }
      _jobId = jobId;
      _lastSeq = 0;
      persistJob();
      await followJob(jobId, 0);
    } catch (e) {
      showError((e && e.message) || 'Génération impossible');
      setBusy(false);
    }
  }

  async function followJob(jobId, after) {
    if (!jobId || typeof API === 'undefined' || !API.leoJobStream) {
      setBusy(false);
      return;
    }
    if (_abort) {
      try { _abort.abort(); } catch (_) {}
    }
    const ac = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    _abort = ac;
    setBusy(true);
    try {
      for await (const ev of API.leoJobStream(jobId, after, { signal: ac ? ac.signal : undefined })) {
        if (ev && ev.data && typeof ev.data.seq === 'number') {
          _lastSeq = ev.data.seq;
          persistJob();
        }
        if (ev.event === 'error') {
          const msg = (ev.data && (ev.data.error || ev.data.detail)) || 'Génération impossible';
          paintResult('', (ev.data && ev.data.tool && ev.data.tool.qa) || null, true);
          showError(msg);
          clearJob();
          return;
        }
        if (ev.event === 'done') {
          let data = null;
          if (ev.data && ev.data.reply) {
            try { data = JSON.parse(ev.data.reply); } catch (_) { data = null; }
          }
          if (data && data.text) {
            paintResult(data.text, data.qa, true);
          } else if (data && !data.text) {
            paintResult('', data.qa, true);
            showError((data.qa && data.qa.summary) || data.error || 'QA FAILED');
          } else {
            await loadLast();
          }
          clearJob();
          return;
        }
      }
      await recoverFromStore();
    } catch (_) {
      await recoverFromStore();
    } finally {
      if (_abort === ac) _abort = null;
      if (!_jobId) setBusy(false);
    }
  }

  async function recoverFromStore() {
    const before = _baseline;
    await loadLast();
    const ta = document.getElementById('polarsteps-result');
    const now = ta ? ta.value : '';
    if (now && now !== before) {
      clearJob();
      showError('');
      return;
    }
    // Job still running (Safari lock) — keep busy, resume on visibility.
    if (_jobId) setBusy(true);
    else setBusy(false);
  }

  function resumeIfNeeded() {
    if (_busy && _abort) return;
    let id = _jobId;
    let seq = _lastSeq;
    try {
      if (!id) id = sessionStorage.getItem(JOB_KEY);
      if (id && !seq) seq = Number(sessionStorage.getItem(SEQ_KEY) || 0) || 0;
    } catch (_) {}
    if (!id) return;
    _jobId = id;
    _lastSeq = seq || 0;
    followJob(id, _lastSeq);
  }

  function fallbackCopy(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, el.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    document.body.removeChild(el);
    return ok;
  }

  async function copyResult() {
    const ta = document.getElementById('polarsteps-result');
    const text = ta ? ta.value : '';
    if (!text) return;
    let ok = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (_) {
        ok = fallbackCopy(text);
      }
    } else {
      ok = fallbackCopy(text);
    }
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast(ok ? '📋 Copié' : 'Copie impossible', ok ? 'success' : 'error');
    }
  }

  return { loadStatus, renderSection, resumeIfNeeded };
})();
