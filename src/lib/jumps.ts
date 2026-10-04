// Entwicklungssprünge nach dem Modell "Oje, ich wachse!" (Plooij/van de Rijt). Wochen zählen ab
// errechnetem Termin (ET). Alle Zeiträume sind Richtwerte; Texte sind eigene Zusammenfassungen.

export interface Jump {
  number: number
  name: string
  /** Wochen ab ET, in denen der Sprung "ankommt" (Höhepunkt der stürmischen Zeit). */
  week: number
  /** Beginn und Ende der stürmischen (anhänglichen) Phase in Wochen ab ET. */
  stormStart: number
  stormEnd: number
  /** Kurzbeschreibung: was sich im Wahrnehmen/Denken ändert. */
  summary: string
  skills: string[]
  signs: string[]
  tips: string[]
  sleep: string
}

export const JUMPS: Jump[] = [
  {
    number: 1,
    name: 'Welt der Sinneseindrücke',
    week: 5,
    stormStart: 4.5,
    stormEnd: 5.5,
    summary:
      'Die Sinne werden schärfer: Das Baby nimmt Licht, Geräusche, Gerüche und Berührungen viel intensiver wahr als in den ersten Wochen.',
    skills: [
      'Schaut aufmerksamer, folgt Gesichtern und Lichtern',
      'Reagiert deutlicher auf Stimmen und Geräusche',
      'Wirkt wacher und interessierter an der Umgebung',
    ],
    signs: [
      'Weint mehr und lässt sich schwerer beruhigen',
      'Will ständig getragen werden, schreckhafter als sonst',
      'Trinkt unruhig oder häufiger',
    ],
    tips: [
      'Viel Körperkontakt, Tragen, Hautkontakt',
      'Reize dosieren: ruhige Umgebung, nicht zu viele Besucher',
      'Vertraute Rituale (Lied, Wiegen) geben Sicherheit',
    ],
    sleep:
      'Schlaf oft unruhiger und kürzer; Einschlafen klappt am besten auf dem Arm oder an der Brust.',
  },
  {
    number: 2,
    name: 'Welt der Muster',
    week: 8,
    stormStart: 7.5,
    stormEnd: 9.5,
    summary:
      'Das Baby erkennt einfache Muster: die eigenen Hände, wiederkehrende Formen, Töne und Berührungen.',
    skills: [
      'Entdeckt die eigenen Hände und Füße',
      'Betrachtet Muster und Gesichter länger',
      'Gibt erste "Gespräche" mit Lauten, spielt mit der Stimme',
    ],
    signs: [
      'Anhänglich und quengelig, will nicht abgelegt werden',
      'Weniger Appetit oder häufiges Anlegen',
      'Schläft weniger tief, wirkt launisch',
    ],
    tips: [
      'Hände, Rasseln und kontrastreiche Muster zeigen',
      'Viel mit dem Baby sprechen und Laute nachahmen',
      'Ruhige Spielphasen auf der Decke einplanen',
    ],
    sleep: 'Häufigeres Aufwachen und kürzere Nickerchen sind typisch; mehr Nähe hilft beim Einschlafen.',
  },
  {
    number: 3,
    name: 'Welt der fließenden Übergänge',
    week: 12,
    stormStart: 11.5,
    stormEnd: 13,
    summary:
      'Bewegungen, Geräusche und Veränderungen werden als fließend statt abgehackt erlebt – das Baby steuert sie zunehmend selbst.',
    skills: [
      'Bewegungen werden runder und gezielter (Greifen, Kopf drehen)',
      'Lautet vielfältiger, probiert Stimmlagen aus',
      'Verfolgt Bewegungen mit den Augen flüssig',
    ],
    signs: [
      'Wechselhafte Laune, schnell überfordert',
      'Wieder mehr Nähebedürfnis',
      'Unruhe beim Füttern und Wickeln',
    ],
    tips: [
      'Bewegungsspiele: Greifen, Strampeln, Bauchlage',
      'Mit Stimme und Mimik spielen, Lieder singen',
      'Neue Reize nur schrittweise anbieten',
    ],
    sleep: 'Unruhigere Nächte möglich; feste Einschlafrituale stabilisieren den Rhythmus.',
  },
  {
    number: 4,
    name: 'Welt der Ereignisse',
    week: 19,
    stormStart: 14.5,
    stormEnd: 19.5,
    summary:
      'Das Baby erkennt kurze Handlungsfolgen ("Ereignisse"): erst schütteln, dann Geräusch – es versteht Ursache und Wirkung.',
    skills: [
      'Greift gezielt und spielt mit Gegenständen',
      'Dreht sich vom Bauch auf den Rücken, erste Rollversuche',
      'Lacht bewusst, erkennt Abläufe wieder',
    ],
    signs: [
      'Oft die längste und anstrengendste Phase der ersten Monate',
      'Sehr anhänglich, wählerisch beim Trinken',
      'Schlafprobleme, "4-Monats-Regression"',
    ],
    tips: [
      'Spielzeug zum Schütteln, Drücken und Fallenlassen',
      'Abläufe (Wickeln, Baden) immer gleich gestalten',
      'Geduld: viel Trost, Tragen und ruhige Tage',
    ],
    sleep:
      'Häufig deutliche Schlafveränderung: kürzere Zyklen, mehr Aufwachen, Nickerchen werden kürzer.',
  },
  {
    number: 5,
    name: 'Welt der Beziehungen',
    week: 26,
    stormStart: 22,
    stormEnd: 27,
    summary:
      'Das Baby begreift Abstände und Beziehungen: nah und fern, drinnen und draußen, Mama weg – Mama wieder da.',
    skills: [
      'Erkundet Gegenstände mit Händen und Mund, Umlagern von Hand zu Hand',
      'Beginnt zu robben oder zu krabbeln',
      'Erkennt Vertraute und fremdelt',
    ],
    signs: [
      'Trennungsangst, will nicht aus den Augen gelassen werden',
      'Schnell weinerlich, klammert sich an',
      'Appetitschwankungen, Beikost-Interesse',
    ],
    tips: [
      'Kurze Abschiede mit klarem Ritual und Wiedersehen',
      'Guck-guck-Spiele und Verstecken üben Beziehung zu Distanz',
      'Sichere Umgebung zum Erkunden schaffen',
    ],
    sleep: 'Einschlafen wird oft anspruchsvoller; Trennungsangst kann nächtliches Wecken verstärken.',
  },
  {
    number: 6,
    name: 'Welt der Kategorien',
    week: 37,
    stormStart: 33.5,
    stormEnd: 37.5,
    summary:
      'Das Baby sortiert die Welt in Kategorien (Tiere, Essen, Menschen) und lernt Unterschiede zwischen ähnlichen Dingen.',
    skills: [
      'Unterscheidet bekannte von fremden Personen und Dingen',
      'Zeigt auf Dinge, ahmt Gesten nach (Winken)',
      'Mobilität: Hochziehen, Krabbeln, Möbel-Entdecken',
    ],
    signs: [
      'Launisch, mal anhänglich, mal trotzig',
      'Wählerisch beim Essen',
      'Schlaf wieder unruhiger (oft zusätzlich Zahnen/Mobilität)',
    ],
    tips: [
      'Dinge benennen, Bilderbücher ansehen',
      'Sortier- und Steckspiele anbieten',
      'Klare, ruhige Tagesstruktur',
    ],
    sleep: 'Aufwachen nachts und kürzere Nickerchen häufig; Rituale und feste Zeiten helfen.',
  },
  {
    number: 7,
    name: 'Welt der Reihenfolgen',
    week: 46,
    stormStart: 41,
    stormEnd: 46.5,
    summary:
      'Das Baby versteht, dass Handlungen in einer Reihenfolge geschehen – etwas stapeln, etwas einsetzen, etwas nacheinander tun.',
    skills: [
      'Stapelt Bausteine, steckt Dinge ineinander',
      'Macht beim Anziehen oder Essen mit',
      'Erste Schritte oder Gehen an der Hand',
    ],
    signs: [
      'Wut, wenn etwas nicht klappt, erste Trotzansätze',
      'Anhänglich, möchte alles selbst machen',
      'Appetit und Laune schwanken',
    ],
    tips: [
      'Stapeln, Einräumen und Ausräumen erlauben',
      'Handlungen ankündigen und in Schritten begleiten',
      'Frust mit Ruhe auffangen, Erfolge loben',
    ],
    sleep: 'Einschlafen kann sich verzögern, weil das Kind noch üben will; Schlafensrituale sind wichtig.',
  },
  {
    number: 8,
    name: 'Welt der Programme',
    week: 55,
    stormStart: 50.5,
    stormEnd: 55,
    summary:
      'Das Kind entwickelt flexible "Programme" – Handlungspläne wie Anziehen, Tisch decken oder Aufräumen – und führt sie auf eigene Weise aus.',
    skills: [
      'Spielt Alltagssituationen nach (telefonieren, kochen)',
      'Hilft mit, versteht einfache Anweisungen',
      'Probiert aus, wie man dasselbe Ziel auf verschiedene Wege erreicht',
    ],
    signs: [
      'Trotz und Nein-Phase beginnen',
      'Schwankende Stimmung, mal hilfsbereit, mal klammernd',
      'Weniger Geduld, Gefühle noch schwer zu steuern',
    ],
    tips: [
      'Mithelfen im Alltag ermöglichen (Lappen, Löffel, Aufräumen)',
      'Wahlmöglichkeiten geben (zwei Optionen)',
      'Grenzen freundlich, klar und konsequent halten',
    ],
    sleep: 'Trotz und Bewegungsdrang machen das Einschlafen oft schwieriger; der Mittagsschlaf wird kürzer.',
  },
  {
    number: 9,
    name: 'Welt der Prinzipien',
    week: 64,
    stormStart: 59.5,
    stormEnd: 64.5,
    summary:
      'Das Kind versteht Prinzipien hinter Handlungen und erkennt, dass man Verhalten anpassen kann – es testet Regeln und Grenzen.',
    skills: [
      'Sagt erste Wörter oder kurze Sätze, versteht viel mehr als es sagt',
      'Spielt flexibel und tauscht Rollen im Spiel',
      'Beginnt, auf Gefühle anderer zu reagieren',
    ],
    signs: [
      'Grenzen testen, Wutanfälle',
      'Sehr anhänglich bei Überforderung',
      'Wechselnde Essgewohnheiten',
    ],
    tips: [
      'Gefühle benennen und verständnisvoll begleiten',
      'Vorbild sein: Kinder spiegeln Verhalten',
      'Konsequent und gelassen bleiben',
    ],
    sleep: 'Einschlaf- und Durchschlafprobleme möglich, ebenso Widerstand gegen den Mittagsschlaf.',
  },
  {
    number: 10,
    name: 'Welt der Systeme',
    week: 75,
    stormStart: 70,
    stormEnd: 75.5,
    summary:
      'Das Kind erkennt sich selbst als Teil eines größeren Ganzen (Familie, Regeln, Werte) und beginnt, sein Verhalten daran auszurichten.',
    skills: [
      'Entwickelt Selbstbild und eigenen Willen',
      'Sprache und Rollenspiele werden vielfältiger',
      'Zeigt Mitgefühl und erste Verantwortung (helfen, trösten)',
    ],
    signs: [
      'Eigenwillig, will vieles allein entscheiden',
      'Trotz und Anhänglichkeit wechseln sich ab',
      'Schnell überfordert in neuen Situationen',
    ],
    tips: [
      'Selbstständigkeit zulassen, wo es sicher ist',
      'Regeln erklären statt nur durchsetzen',
      'Gemeinsame Rituale und Zuwendung im Alltag',
    ],
    sleep: 'Zubettgehen wird verhandelt; feste Abläufe und eine klare, liebevolle Linie helfen.',
  },
]

const DAY_MS = 24 * 60 * 60 * 1000

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + Math.round(days))
}

export function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Datum für eine Woche ab ET (Bruchteile von Wochen werden auf ganze Tage gerundet). */
export function dateAtWeek(due: Date, weeks: number): Date {
  return addDays(due, weeks * 7)
}

export interface JumpWindow {
  jump: Jump
  start: Date
  end: Date
  peak: Date
}

export function jumpWindows(due: Date): JumpWindow[] {
  return JUMPS.map((jump) => ({
    jump,
    start: dateAtWeek(due, jump.stormStart),
    end: dateAtWeek(due, jump.stormEnd),
    peak: dateAtWeek(due, jump.week),
  }))
}

export type JumpState = 'past' | 'running' | 'upcoming'

export const STATE_COLORS: Record<JumpState, string> = {
  past: 'var(--chart-5)',
  running: 'var(--primary)',
  upcoming: 'var(--chart-4)',
}

export function jumpState(window: JumpWindow, now: Date): JumpState {
  const today = startOfToday(now).getTime()
  if (today >= window.end.getTime()) return 'past'
  if (today >= window.start.getTime()) return 'running'
  return 'upcoming'
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

export interface JumpOutlook {
  state: 'running' | 'upcoming'
  window: JumpWindow
  /** Bei "upcoming": Tage bis Beginn; bei "running": Tage bis Ende der stürmischen Phase. */
  days: number
}

/** Laufender oder nächster Sprung; null, wenn alle zehn vorbei sind. */
export function jumpOutlook(due: Date, now: Date): JumpOutlook | null {
  const today = startOfToday(now)
  for (const window of jumpWindows(due)) {
    const state = jumpState(window, now)
    if (state === 'running') return { state, window, days: daysBetween(today, window.end) }
    if (state === 'upcoming') return { state, window, days: daysBetween(today, window.start) }
  }
  return null
}

/** Alter in Wochen ab ET (kann vor dem ET negativ sein). */
export function weeksSinceDue(due: Date, now: Date): number {
  return daysBetween(due, startOfToday(now)) / 7
}
