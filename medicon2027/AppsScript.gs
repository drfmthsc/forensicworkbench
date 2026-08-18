/**
 * MEDICON 2027 — Accommodation & Travel back end
 * Lives in the Sheet that holds Hotels / Categories / Responses.
 *
 * Redeploy: Deploy > Manage deployments > pencil > Version: New version > Deploy
 * (keeps the same /exec URL)
 */

var TAB       = 'Responses';
var TAB_HOTEL = 'Hotels';
var TAB_CAT   = 'Categories';

var CONF_EMAIL = '2027forensicmedicon@gmail.com';
var DESK_URL   = 'https://forensicworkbench.com/medicon2027/rates.html';

var HEADERS = [
  'timestamp','ref','name','mobile','email','institution','city','state',
  'delegate_type','category','occupancy','share_partner','nights','n_nights',
  'accompanying','share_optin','gender','share_notes',
  'arrival_point','arrival_date','arrival_window',
  'departure_date','departure_window','airport_shuttle',
  'accessibility','dietary','notes','consent','edit_count','user_agent',
  'rates_sent','chosen_hotel','booking_ts'
];

/* ---------- helpers ---------- */

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TAB);
  if (!sh) {
    sh = ss.insertSheet(TAB);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    return sh;
  }
  var width = Math.max(sh.getLastColumn(), 1);
  var have  = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
  var missing = HEADERS.filter(function (h) { return have.indexOf(h) < 0; });
  if (missing.length) {
    sh.getRange(1, width + 1, 1, missing.length)
      .setValues([missing]).setFontWeight('bold');
  }
  return sh;
}

function colMap_(sh) {
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  var m = {};
  for (var i = 0; i < head.length; i++) m[head[i]] = i;
  return m;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function digits_(v) { return String(v || '').replace(/\D/g, '').slice(-10); }

function rowToRec_(row, m) {
  var rec = {};
  for (var k in m) rec[k] = row[m[k]];
  return rec;
}

function findRow_(sh, m, ref) {
  var n = sh.getLastRow();
  if (n < 2) return 0;
  var refs = sh.getRange(2, m.ref + 1, n - 1, 1).getValues();
  for (var i = refs.length - 1; i >= 0; i--) {
    if (String(refs[i][0]).toUpperCase() === ref) return i + 2;
  }
  return 0;
}

function ratedHotels_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_HOTEL);
  if (!sh) return [];
  var v = sh.getDataRange().getValues();
  var head = v.shift().map(String);
  var ix = {};
  head.forEach(function (h, i) { ix[h] = i; });

  return v.filter(function (r) {
    return r[ix.name] && String(r[ix.status]) !== 'hidden' &&
           (r[ix.rate_single] || r[ix.rate_twin] || r[ix.rate_triple]);
  }).map(function (r) {
    return {
      name:     r[ix.name],
      category: String(r[ix.category]),
      distance: r[ix.distance_km],
      phone:    r[ix.phone],
      single:   r[ix.rate_single],
      twin:     r[ix.rate_twin],
      triple:   r[ix.rate_triple],
      incl:     r[ix.inclusions],
      shuttle:  String(r[ix.shuttle]).toUpperCase() === 'TRUE'
    };
  }).sort(function (a, b) { return (a.distance || 0) - (b.distance || 0); });
}

function catName_(id) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_CAT);
  if (!sh) return id;
  var v = sh.getDataRange().getValues();
  var head = v.shift().map(String);
  var iId = head.indexOf('id'), iNm = head.indexOf('name');
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][iId]) === String(id)) return v[i][iNm];
  }
  return id;
}

/* ---------- web endpoints ---------- */

function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var ref = String(p.ref || '').trim().toUpperCase();
  var mob = digits_(p.mobile);
  var eml = String(p.email || '').trim().toLowerCase();

  if (!ref && !(mob && eml)) {
    return out_({ ok: true, service: 'MEDICON 2027', status: 'ready' });
  }

  var sh = sheet_(), m = colMap_(sh);
  var data = sh.getDataRange().getValues();

  for (var i = data.length - 1; i >= 1; i--) {
    var hit = ref
      ? (String(data[i][m.ref]).toUpperCase() === ref)
      : (digits_(data[i][m.mobile]) === mob &&
         String(data[i][m.email]).trim().toLowerCase() === eml);
    if (hit) return out_({ ok: true, found: true, record: rowToRec_(data[i], m) });
  }
  return out_({ ok: true, found: false });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents);
    return (d.action === 'book') ? book_(d) : submit_(d);
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function submit_(d) {
  var sh = sheet_(), m = colMap_(sh);
  var ref = String(d.ref || '').trim().toUpperCase();
  if (!ref) return out_({ ok: false, error: 'missing ref' });

  var nights = Array.isArray(d.nights) ? d.nights : [];
  var target = findRow_(sh, m, ref);
  var width  = sh.getLastColumn();
  var row    = [];
  for (var z = 0; z < width; z++) row.push('');

  function set(k, v) { if (m[k] !== undefined) row[m[k]] = v; }

  set('timestamp', new Date());   set('ref', ref);
  set('name', d.name || '');      set('mobile', d.mobile || '');
  set('email', d.email || '');    set('institution', d.institution || '');
  set('city', d.city || '');      set('state', d.state || '');
  set('delegate_type', d.delegate_type || '');
  set('category', d.category || '');   set('occupancy', d.occupancy || '');
  set('share_partner', d.share_partner || '');
  set('nights', nights.join(', ')); set('n_nights', nights.length);
  set('accompanying', d.accompanying || 0);
  set('share_optin', d.share_optin || ''); set('gender', d.gender || '');
  set('share_notes', d.share_notes || '');
  set('arrival_point', d.arrival_point || '');
  set('arrival_date', d.arrival_date || '');
  set('arrival_window', d.arrival_window || '');
  set('departure_date', d.departure_date || '');
  set('departure_window', d.departure_window || '');
  set('airport_shuttle', d.airport_shuttle || '');
  set('accessibility', d.accessibility || ''); set('dietary', d.dietary || '');
  set('notes', d.notes || '');
  set('consent', d.consent ? 'YES' : 'NO');
  set('edit_count', 0);
  set('user_agent', d.ua || '');

  var mode = 'created';
  if (target) {
    var old = sh.getRange(target, 1, 1, width).getValues()[0];
    ['rates_sent','chosen_hotel','booking_ts'].forEach(function (k) {
      if (m[k] !== undefined) row[m[k]] = old[m[k]];
    });
    set('edit_count', (Number(old[m.edit_count]) || 0) + 1);
    sh.getRange(target, 1, 1, width).setValues([row]);
    mode = 'updated';
  } else {
    sh.appendRow(row);
  }

  mailRef_(d, ref, mode);
  return out_({ ok: true, ref: ref, mode: mode });
}

function book_(d) {
  var sh = sheet_(), m = colMap_(sh);
  var ref = String(d.ref || '').trim().toUpperCase();
  var hotel = String(d.hotel || '').trim();
  if (!ref || !hotel) return out_({ ok: false, error: 'missing ref or hotel' });

  var target = findRow_(sh, m, ref);
  if (!target) return out_({ ok: false, error: 'reference not found' });

  sh.getRange(target, m.chosen_hotel + 1).setValue(hotel);
  sh.getRange(target, m.booking_ts + 1).setValue(new Date());

  var row = sh.getRange(target, 1, 1, sh.getLastColumn()).getValues()[0];
  mailBooking_(rowToRec_(row, m), hotel);
  return out_({ ok: true, ref: ref, hotel: hotel });
}

/* ---------- outgoing mail ---------- */

function sig_() {
  return 'Organising Committee, FORENSIC MEDICON 2027\n' +
         '48th Annual Conference of the Indian Academy of Forensic Medicine\n' +
         '2-6 February 2027, Swami Rama Himalayan University, Jolly Grant, Dehradun\n' +
         CONF_EMAIL + '\n' + DESK_URL + '\n';
}

function mailRef_(d, ref, mode) {
  try {
    if (!d.email || String(d.email).indexOf('@') < 0) return;
    if (MailApp.getRemainingDailyQuota() < 5) return;
    var nights = Array.isArray(d.nights) ? d.nights.join(', ') : '';
    MailApp.sendEmail({
      to: String(d.email).trim(),
      name: 'FORENSIC MEDICON 2027',
      subject: 'FORENSIC MEDICON 2027 — your accommodation reference ' + ref,
      body:
        'Dear ' + (d.name || 'Delegate') + ',\n\n' +
        (mode === 'updated' ? 'Your accommodation interest has been updated.'
                            : 'Thank you for registering your accommodation interest.') +
        '\n\nYOUR REFERENCE CODE:  ' + ref + '\n\n' +
        'Keep this email — you will need the code to change your entry or to book later.\n\n' +
        '--- What you told us ---\n' +
        'Category: ' + catName_(d.category) + '\n' +
        'Room type: ' + (d.occupancy || '-') + '\n' +
        'Nights: ' + (nights || '-') + '\n' +
        'Arriving via: ' + (d.arrival_point || '-') + '\n\n' +
        'This is NOT a booking and there is nothing to pay. We are collecting numbers so we\n' +
        'can negotiate conference rates. We will email you once rates are confirmed.\n\n' +
        'If you lose this code you can retrieve your entry using your mobile number and email.\n\n' +
        sig_()
    });
  } catch (err) { Logger.log('mailRef_ ' + ref + ': ' + err); }
}

function mailBooking_(rec, hotel) {
  try {
    if (!rec.email) return;
    if (MailApp.getRemainingDailyQuota() < 5) return;
    MailApp.sendEmail({
      to: String(rec.email).trim(),
      name: 'FORENSIC MEDICON 2027',
      subject: 'MEDICON 2027 — accommodation choice recorded (' + rec.ref + ')',
      body:
        'Dear ' + (rec.name || 'Delegate') + ',\n\n' +
        'We have recorded your choice of:\n\n    ' + hotel + '\n\n' +
        'WHAT TO DO NEXT\n' +
        'Telephone the property directly and say you are booking on the\n' +
        'FORENSIC MEDICON 2027 conference rate, quoting reference ' + rec.ref + '.\n' +
        'We have sent them the delegate list, so reception can verify this.\n\n' +
        'Nights: ' + (rec.nights || '-') + '\n' +
        'Room type: ' + (rec.occupancy || '-') + '\n\n' +
        'Payment is made directly to the property. The Organising Committee does not\n' +
        'collect accommodation charges.\n\n' +
        'To change your choice, return to the travel desk and use your reference code.\n\n' +
        sig_()
    });
  } catch (err) { Logger.log('mailBooking_: ' + err); }
}

/* ---------- segmented rate announcement ---------- */

function sendRateEmails() {
  var sh = sheet_(), m = colMap_(sh);
  var n = sh.getLastRow();
  if (n < 2) { Logger.log('No responses.'); return; }

  var hotels = ratedHotels_();
  if (!hotels.length) {
    Logger.log('STOPPED: no hotels have rates filled in yet.');
    return;
  }

  var budget = Math.max(0, MailApp.getRemainingDailyQuota() - 10);
  if (!budget) { Logger.log('No quota left today.'); return; }

  var data = sh.getRange(2, 1, n - 1, sh.getLastColumn()).getValues();
  var sent = 0, skipped = 0;

  for (var i = 0; i < data.length && sent < budget; i++) {
    var r = data[i];
    if (String(r[m.rates_sent]).trim()) { skipped++; continue; }
    if (!r[m.email] || String(r[m.email]).indexOf('@') < 0) { skipped++; continue; }

    var cat = String(r[m.category] || '');
    if (cat === 'F') { skipped++; continue; }

    var list = hotels.filter(function (h) { return h.category === cat; });
    if (!list.length) list = hotels;

    try {
      MailApp.sendEmail({
        to: String(r[m.email]).trim(),
        name: 'FORENSIC MEDICON 2027',
        subject: 'MEDICON 2027 — conference accommodation rates are now confirmed',
        body: rateBody_(r, m, cat, list)
      });
      sh.getRange(i + 2, m.rates_sent + 1).setValue(new Date());
      sent++;
      Utilities.sleep(400);
    } catch (err) {
      Logger.log('Failed ' + r[m.ref] + ': ' + err);
    }
  }
  Logger.log('Sent ' + sent + ', skipped ' + skipped +
             '. Quota left: ' + MailApp.getRemainingDailyQuota());
}

function rateBody_(r, m, cat, list) {
  var lines = list.map(function (h) {
    var bits = [];
    if (h.single) bits.push('single ' + h.single);
    if (h.twin)   bits.push('twin ' + h.twin);
    if (h.triple) bits.push('triple ' + h.triple);
    return '  * ' + h.name + '  (' + h.distance + ' km' +
           (h.shuttle ? ', on shuttle route' : '') + ')\n' +
           '      ' + bits.join('  |  ') + ' per night\n' +
           (h.incl  ? '      Includes: ' + h.incl + '\n' : '') +
           (h.phone ? '      Tel: ' + h.phone + '\n' : '');
  }).join('\n');

  return 'Dear ' + (r[m.name] || 'Delegate') + ',\n\n' +
    'Conference rates have now been agreed with properties near the venue.\n' +
    'You told us you were looking for: ' + catName_(cat) + ', ' +
    (r[m.occupancy] || 'room') + ', for ' + (r[m.nights] || 'the conference nights') + '.\n\n' +
    'RATES IN YOUR CATEGORY\n\n' + lines + '\n' +
    'CHOOSE YOUR PROPERTY\n' + DESK_URL + '\n' +
    'Use your reference code ' + r[m.ref] + '. Lost it? You can find your entry\n' +
    'there using your mobile number and email.\n\n' +
    'Then telephone the property, quoting the MEDICON 2027 conference rate and your\n' +
    'reference. Payment is made directly to the property.\n\n' +
    'Rooms are limited and allocated first come, first served. The full list of all\n' +
    'properties, including those outside your category, is on the travel desk page.\n\n' +
    sig_();
}

function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendRateEmails') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendRateEmails').timeBased().atHour(7).everyDays(1).create();
  Logger.log('Daily trigger installed for 07:00.');
}

function removeDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendRateEmails') ScriptApp.deleteTrigger(t);
  });
  Logger.log('Trigger removed.');
}

/* ---------- diagnostics ---------- */

function testMail() {
  Logger.log('Quota: ' + MailApp.getRemainingDailyQuota());
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'MEDICON 2027 — mail test',
    body: 'Apps Script can send email from this account.',
    name: 'FORENSIC MEDICON 2027'
  });
  Logger.log('Sent.');
}

/** Dry run — logs who WOULD receive the rate email. Sends nothing. */
function previewRateEmails() {
  var sh = sheet_(), m = colMap_(sh);
  Logger.log('Hotels with rates filled in: ' + ratedHotels_().length);
  if (sh.getLastRow() < 2) { Logger.log('No responses.'); return; }

  var data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  var pending = 0, byCat = {};
  data.forEach(function (r) {
    if (String(r[m.rates_sent]).trim()) return;
    if (String(r[m.category]) === 'F') return;
    pending++;
    var c = String(r[m.category] || '?');
    byCat[c] = (byCat[c] || 0) + 1;
  });
  Logger.log('Pending: ' + pending);
  for (var k in byCat) Logger.log('  ' + k + ' (' + catName_(k) + '): ' + byCat[k]);
  Logger.log('Days needed at ~90/day: ' + Math.ceil(pending / 90));
}
