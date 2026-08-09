/**
 * tz-helpers.js — Local airport time → home (Nice) reference time
 *
 * Contract:
 *   - timeline[].t  = local time at the event (airport / city)
 *   - timeline[].tz = IANA zone of that local time (required for dual display)
 *   - timeline[].date (optional) = local calendar date YYYY-MM-DD when ≠ day date
 *   - trip.homeTz   = fixed reference zone (default Europe/Paris = Nice)
 *
 * Primary column stays local. Secondary shows home time only when it differs.
 */

var TzHelpers = (() => {

  const DEFAULT_HOME_TZ = 'Europe/Paris';

  const HOME_FLAGS = {
    'Europe/Paris': '🇫🇷',
    'Europe/Zurich': '🇨🇭',
    'America/Toronto': '🇨🇦',
    'America/New_York': '🇺🇸',
    'America/Los_Angeles': '🇺🇸',
    'America/Denver': '🇺🇸',
    'America/Phoenix': '🇺🇸',
    'Europe/Malta': '🇲🇹',
    'Europe/Madrid': '🇪🇸',
    'Atlantic/Canary': '🇪🇸',
  };

  function homeTz(trip) {
    const tz = trip && trip.homeTz;
    return (tz && String(tz).trim()) || DEFAULT_HOME_TZ;
  }

  function homeFlag(tz) {
    return HOME_FLAGS[tz] || '🏠';
  }

  /** Parse "HH:MM" or "H:MM" — null if not a clock time (emoji / text). */
  function parseHm(t) {
    const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const hh = +m[1];
    const mm = +m[2];
    if (hh > 23 || mm > 59) return null;
    return { hh, mm, label: (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm };
  }

  function getTimeZoneOffsetMs(timeZone, date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date);
    const map = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    const hour = (+map.hour === 24) ? 0 : +map.hour;
    const asUTC = Date.UTC(+map.year, +map.month - 1, +map.day, hour, +map.minute, +map.second);
    return asUTC - date.getTime();
  }

  /** Instant (UTC Date) for a wall-clock time in `tz`. */
  function localToUtc(ymd, hm, tz) {
    const parsed = parseHm(hm);
    if (!parsed || !ymd || !tz) return null;
    const [y, mo, d] = String(ymd).split('-').map(Number);
    if (!y || !mo || !d) return null;
    let utcMs = Date.UTC(y, mo - 1, d, parsed.hh, parsed.mm, 0);
    for (let i = 0; i < 4; i++) {
      const offset = getTimeZoneOffsetMs(tz, new Date(utcMs));
      utcMs = Date.UTC(y, mo - 1, d, parsed.hh, parsed.mm, 0) - offset;
    }
    return new Date(utcMs);
  }

  function formatInTz(date, tz) {
    if (!date || !tz) return null;
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const map = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    const hour = (map.hour === '24') ? '00' : map.hour;
    return {
      ymd: map.year + '-' + map.month + '-' + map.day,
      hm: hour + ':' + map.minute,
    };
  }

  /**
   * Secondary home-time label, or null if not useful.
   * @returns {{ text: string, hm: string, dayDelta: number }|null}
   */
  function homeTimeLabel(opts) {
    const localT = opts && opts.t;
    const eventTz = opts && opts.tz;
    const localDate = opts && opts.date;
    const home = (opts && opts.homeTz) || DEFAULT_HOME_TZ;
    if (!eventTz || !localDate) return null;
    if (eventTz === home) return null;

    const parsed = parseHm(localT);
    if (!parsed) return null;

    const utc = localToUtc(localDate, parsed.label, eventTz);
    if (!utc || isNaN(utc.getTime())) return null;
    const homeParts = formatInTz(utc, home);
    if (!homeParts) return null;

    // Same clock in home zone (e.g. Paris ↔ Zurich in summer) → no clutter
    if (homeParts.hm === parsed.label && homeParts.ymd === localDate) return null;

    let dayDelta = 0;
    if (homeParts.ymd > localDate) dayDelta = 1;
    else if (homeParts.ymd < localDate) dayDelta = -1;
    // Compare calendar days properly when localDate is event-local and home ymd differs
    if (homeParts.ymd !== localDate) {
      const a = new Date(localDate + 'T12:00:00Z').getTime();
      const b = new Date(homeParts.ymd + 'T12:00:00Z').getTime();
      dayDelta = Math.round((b - a) / 86400000);
    }

    const flag = homeFlag(home);
    const suffix = dayDelta > 0 ? '+' + dayDelta : (dayDelta < 0 ? String(dayDelta) : '');
    const text = homeParts.hm + (suffix ? suffix : '') + ' ' + flag;
    return { text, hm: homeParts.hm, dayDelta, ymd: homeParts.ymd };
  }

  return {
    DEFAULT_HOME_TZ,
    homeTz,
    homeFlag,
    parseHm,
    localToUtc,
    formatInTz,
    homeTimeLabel,
  };
})();
