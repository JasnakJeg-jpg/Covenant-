export type Usage = 'solo' | 'couple'

export const usageOptions: { value: Usage; title: string; text: string }[] = [
  { value: 'solo', title: 'On my own', text: 'Read, study and pray at your own pace.' },
  { value: 'couple', title: 'With my partner', text: 'Share studies, prayers and conversations together.' },
]

export const intentOptions: Record<Usage, { value: string; label: string }[]> = {
  couple: [
    { value: 'married', label: 'We’re married' },
    { value: 'engaged', label: 'We’re engaged' },
    { value: 'dating', label: 'We’re in a relationship' },
  ],
  solo: [
    { value: 'preparing_single', label: 'I’m single and preparing for marriage' },
    { value: 'study_single', label: 'I’m here to study and grow' },
  ],
}

export const CHANGE_LATER = 'You can change this at any time in My Space.'

const INVITE_KEY = 'covenant.invite'

export function rememberInvite(code: string) {
  try { localStorage.setItem(INVITE_KEY, code.toUpperCase()) } catch { /* storage unavailable */ }
}
export function recalledInvite(): string {
  try { return localStorage.getItem(INVITE_KEY) ?? '' } catch { return '' }
}
export function forgetInvite() {
  try { localStorage.removeItem(INVITE_KEY) } catch { /* storage unavailable */ }
}
