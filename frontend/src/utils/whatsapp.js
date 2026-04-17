/**
 * PermitHub WhatsApp Notification Utility
 * Uses anchor click instead of window.open to avoid browser popup blocking.
 * Messages are bilingual: Tamil + English + Voice TTS link.
 */

function formatPhone(phone) {
  if (!phone) return null
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) cleaned = '91' + cleaned
  else if (cleaned.length === 11 && cleaned.startsWith('0')) cleaned = '91' + cleaned.slice(1)
  else if (cleaned.length === 12 && cleaned.startsWith('91')) { /* already ok */ }
  else if (cleaned.length > 12) cleaned = cleaned.slice(-12) // trim excess
  return cleaned || null
}

function ttsVoiceLink(text) {
  const encoded = encodeURIComponent(text.substring(0, 200))
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=ta&client=tw-ob&q=${encoded}`
}

/** Opens WhatsApp via anchor click — not blocked by browsers */
function openWhatsApp(phone, message) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function sendLeaveWhatsApp({ parentWhatsapp, studentName, fromDate, toDate, totalDays, approved, remarks }) {
  const phone = formatPhone(parentWhatsapp)
  if (!phone) return false

  const statusEn = approved ? 'APPROVED ✅' : 'REJECTED ❌'
  const statusTa = approved ? 'அனுமதிக்கப்பட்டது ✅' : 'நிராகரிக்கப்பட்டது ❌'
  const emoji    = approved ? '✅' : '❌'
  const voiceText = `PermitHub. உங்கள் மாணவர் ${studentName} அவர்களின் விடுப்பு கோரிக்கை ${statusTa}.`

  const message = `${emoji} *PermitHub – Leave Notification*

*English:*
Dear Parent,
Your ward *${studentName}*'s leave has been *${statusEn}*.
📅 ${fromDate} → ${toDate} (${totalDays} day${totalDays !== 1 ? 's' : ''})${remarks ? `\n📝 Remarks: ${remarks}` : ''}

━━━━━━━━━━━━━━━━━━
*தமிழ் (Tamil):*
அன்பான பெற்றோர்,
உங்கள் மாணவர் *${studentName}* அவர்களின் விடுப்பு *${statusTa}*.
📅 ${fromDate} → ${toDate} (${totalDays} நாள்)${remarks ? `\n📝 குறிப்பு: ${remarks}` : ''}

━━━━━━━━━━━━━━━━━━
🔊 *Voice (Tamil):* ${ttsVoiceLink(voiceText)}

– PermitHub | ${new Date().toLocaleDateString('en-IN')}`

  openWhatsApp(phone, message)
  return true
}

export function sendOdWhatsApp({ parentWhatsapp, studentName, eventName, fromDate, toDate, totalDays, approved, remarks }) {
  const phone = formatPhone(parentWhatsapp)
  if (!phone) return false

  const statusEn = approved ? 'APPROVED ✅' : 'REJECTED ❌'
  const statusTa = approved ? 'அனுமதிக்கப்பட்டது ✅' : 'நிராகரிக்கப்பட்டது ❌'
  const emoji    = approved ? '✅' : '❌'
  const voiceText = `PermitHub. உங்கள் மாணவர் ${studentName} அவர்களின் OD கோரிக்கை ${eventName} நிகழ்வுக்காக ${statusTa}.`

  const message = `${emoji} *PermitHub – OD Notification*

*English:*
Dear Parent,
Your ward *${studentName}*'s On-Duty for *${eventName}* has been *${statusEn}*.
📅 ${fromDate} → ${toDate} (${totalDays} day${totalDays !== 1 ? 's' : ''})${remarks ? `\n📝 Remarks: ${remarks}` : ''}

━━━━━━━━━━━━━━━━━━
*தமிழ் (Tamil):*
அன்பான பெற்றோர்,
உங்கள் மாணவர் *${studentName}* அவர்களின் OD (*${eventName}*) *${statusTa}*.
📅 ${fromDate} → ${toDate} (${totalDays} நாள்)${remarks ? `\n📝 குறிப்பு: ${remarks}` : ''}

━━━━━━━━━━━━━━━━━━
🔊 *Voice (Tamil):* ${ttsVoiceLink(voiceText)}

– PermitHub | ${new Date().toLocaleDateString('en-IN')}`

  openWhatsApp(phone, message)
  return true
}

export function sendOutpassParentWhatsApp({ parentWhatsapp, studentName, destination, outTime, returnTime, approveLink, approveUrl, rejectUrl }) {
  const phone = formatPhone(parentWhatsapp)
  if (!phone) return false

  const voiceText = `PermitHub. உங்கள் மாணவர் ${studentName} வெளியேறு அனுமதிக்காக விண்ணப்பித்துள்ளார். 24 மணி நேரத்திற்குள் அனுமதி வழங்கவும்.`

  // Keep frontend path as /parent/approve/:token because that's the public route.
  const reviewUrl = approveUrl || approveLink

  const message = `🔔 *PermitHub – Outpass Approval*

*English:*
Dear Parent,
Your ward *${studentName}* has applied for an outpass.
📍 Destination: ${destination}
🕐 Departure: ${outTime}
🔙 Return by: ${returnTime}

━━━━━━━━━━━━━━━━━━
*தமிழ் (Tamil):*
அன்பான பெற்றோர்,
உங்கள் மாணவர் *${studentName}* வெளியேறு அனுமதிக்காக விண்ணப்பித்துள்ளார்.
📍 செல்லும் இடம்: ${destination}
🕐 புறப்படும் நேரம்: ${outTime}
🔙 திரும்பும் நேரம்: ${returnTime}

━━━━━━━━━━━━━━━━━━
⏰ *Valid for 24 hours*

👇 *Tap the link to Approve or Reject:*
${reviewUrl}

_(Page opens with Approve / அனுமதி and Reject / அனுமதி இல்லை buttons + Tamil voice message)_

– PermitHub`

  openWhatsApp(phone, message)
  return true
}
