// ── Projects ──────────────────────────────────────────────────────────────

export type AccentColor = 'critical' | 'high' | 'medium' | 'low'
export type OutputLanguage = 'de' | 'en'

export interface MockProject {
  id: string
  title: string
  description: string
  sessionCount: number
  lastUpdated: string
  accentColor: AccentColor
}

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 'proj-001',
    title: 'E-Commerce Replatforming',
    description:
      'Migration to Shopify Plus including ERP integration and payment gateway setup.',
    sessionCount: 3,
    lastUpdated: 'Okt 24, 2023',
    accentColor: 'critical',
  },
  {
    id: 'proj-002',
    title: 'CRM Implementation',
    description:
      'Salesforce rollout for the sales team across 3 regions (EMEA, NA, APAC).',
    sessionCount: 5,
    lastUpdated: 'Okt 20, 2023',
    accentColor: 'high',
  },
  {
    id: 'proj-003',
    title: 'Mobile App Redesign',
    description:
      'UX/UI overhaul for iOS and Android customer apps based on Q3 user feedback.',
    sessionCount: 1,
    lastUpdated: 'Okt 15, 2023',
    accentColor: 'medium',
  },
  {
    id: 'proj-004',
    title: 'Internal Audit Tool',
    description:
      'Development of a compliance checking tool for the finance department.',
    sessionCount: 0,
    lastUpdated: 'Okt 12, 2023',
    accentColor: 'low',
  },
]

export const PROJECTS_PAGE_CONTENT = {
  pageTitle: 'Meine Projekte',
  newProjectLabel: 'Neues Projekt',
  activeSectionTitle: 'Aktive Projekte',
  sortLabel: 'Sortieren',
  emptyArchive: {
    heading: 'Noch keine Projekte im Archiv',
    body: 'Abgeschlossene Projekte erscheinen hier. Beginnen Sie, indem Sie Ihr erstes Projekt erstellen oder vorhandene Projekte analysieren.',
    ctaLabel: 'Neues Projekt erstellen',
  },
  sessionCountLabel: (n: number) => (n === 1 ? '1 Analyse' : `${n} Analysen`),
  footer: '© 2025 Requirements Extractor. All rights reserved.',
} as const

// ── New Session ────────────────────────────────────────────────────────────

export const NEW_SESSION_CONTENT = {
  pageTitle: 'Neue Analyse',
  tabs: {
    text: 'Text eingeben',
    files: 'Dateien hochladen',
  },
  textInput: {
    label: 'Anforderungstext',
    maxChars: 500_000,
  },
  analysisName: {
    label: 'Analysename (optional)',
    placeholder: 'z.B. Q1 Lageroptimierung',
  },
  language: {
    label: 'Ausgabesprache',
    options: [
      { value: 'de' as OutputLanguage, label: 'Deutsch', flag: '🇩🇪' },
      { value: 'en' as OutputLanguage, label: 'English', flag: '🇬🇧' },
    ],
  },
  fileUpload: {
    dropzoneLabel: 'Dateien hierher ziehen oder',
    browseLabel: 'Durchsuchen',
    hint: 'PDF, DOCX, XLSX, PPTX, TXT, MD · Max. 30 MB pro Datei, 50 MB gesamt',
  },
  actions: {
    cancel: 'Abbrechen',
    submit: 'Extraktion starten',
  },
} as const

export const MOCK_SAMPLE_TEXT = `Spezifikation für das neue ERP-Modul "Lagerhaltung"

1. Zielsetzung
Das System soll eine vollautomatisierte Bestandsüberwachung ermöglichen. Dabei ist sicherzustellen, dass Mindestbestände nicht unterschritten werden.

2. Funktionale Anforderungen
- Der Nutzer muss in der Lage sein, neue Artikel manuell anzulegen.
- Das System muss bei Wareneingang automatisch den Lagerbestand aktualisieren.
- Eine Schnittstelle zu SAP S/4HANA ist zwingend erforderlich.

3. Nicht-funktionale Anforderungen
- Die Antwortzeit bei Abfragen darf 200ms nicht überschreiten.
- Das System muss 24/7 verfügbar sein (99.9% Uptime SLA).`

// ── Login ──────────────────────────────────────────────────────────────────

export const LOGIN_CONTENT = {
  brand: {
    name: 'Requirements Extractor',
    tagline: 'Anforderungen. Strukturiert. Sofort.',
    description:
      'Das professionelle Werkzeug für Business Analysten und Projektmanager zur effizienten Anforderungsanalyse.',
    version: 'Internal Tool v2.4.0',
  },
  form: {
    headline: 'Willkommen zurück',
    subheadline: 'Bitte melden Sie sich an, um fortzufahren.',
    emailLabel: 'E-Mail-Adresse',
    emailPlaceholder: 'name@company.com',
    passwordLabel: 'Passwort',
    passwordPlaceholder: 'Passwort eingeben',
    forgotPasswordText: 'Passwort vergessen?',
    submitText: 'Anmelden',
  },
  footer: {
    copyright: '© 2025 Requirements Extractor',
    links: [
      { label: 'Impressum', href: '#' },
      { label: 'Datenschutz', href: '#' },
      { label: 'Hilfe', href: '#' },
    ],
  },
} as const

export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type NFRCategory =
  | 'Performance'
  | 'Security'
  | 'Usability'
  | 'Reliability'
  | 'Maintainability'
  | 'Compliance'
export type QuestionStatus = 'open' | 'answered' | 'deferred'

export interface UserStory {
  id: string
  title: string
  as_who: string
  i_want: string
  so_that: string
  acceptance_criteria: string[]
  priority: Priority
  labels: string[]
  source_snippet: string | null
  is_deleted: boolean
  sort_order: number
  linked_nfr?: string
}

export interface NFR {
  id: string
  title: string
  category: NFRCategory
  description: string
  metric: string | null
  priority: Priority
  source_snippet: string | null
  is_deleted: boolean
  sort_order: number
}

export interface OpenQuestion {
  id: string
  question_text: string
  owner: string | null
  status: QuestionStatus
  source_snippet: string | null
  is_deleted: boolean
  sort_order: number
}

export interface Session {
  id: string
  project_name: string
  session_name: string
  user_stories: UserStory[]
  nfrs: NFR[]
  open_questions: OpenQuestion[]
}

export const MOCK_SESSION: Session = {
  id: 'sess-001',
  project_name: 'ERP-Migration 2025',
  session_name: 'Analyse vom 12. Feb 2025',
  user_stories: [
    {
      id: 'US-104',
      title: 'Automatische Rechnungsstellung bei Warenversand',
      as_who: 'Logistikmanager',
      i_want: 'Rechnungen automatisch generiert und versendet werden',
      so_that: 'der Cashflow optimiert wird und manuelle Arbeit entfällt',
      acceptance_criteria: [
        'Rechnung wird innerhalb von 30s nach Statuswechsel generiert',
        'Rechnung wird per E-Mail an den Kunden versendet',
        'Fehler werden in einem Audit-Log erfasst',
      ],
      priority: 'critical',
      labels: ['billing', 'automation'],
      source_snippet:
        '"...und es ist absolut entscheidend, dass die Rechnungen sofort rausgehen. Wir können nicht warten, bis jemand am Ende der Woche Zeit hat. Sobald das Paket den Hof verlässt, muss die Rechnung beim Kunden sein."',
      is_deleted: false,
      sort_order: 0,
      linked_nfr: 'NFR-02',
    },
    {
      id: 'US-105',
      title: 'Echtzeit-Inventar Synchronisation',
      as_who: 'Lagerarbeiter',
      i_want: 'Bestandsänderungen sofort im ERP sichtbar sind',
      so_that: 'Überverkäufe im Webshop zu vermeiden',
      acceptance_criteria: [
        'Bestandsänderungen werden binnen 5s im ERP sichtbar',
        'Webshop zeigt korrekten Bestand in Echtzeit',
      ],
      priority: 'high',
      labels: ['inventory', 'sync'],
      source_snippet: null,
      is_deleted: false,
      sort_order: 1,
    },
    {
      id: 'US-106',
      title: 'Filterbare Kundenliste nach Region',
      as_who: 'Vertriebsmitarbeiter',
      i_want: 'Kunden nach PLZ-Gebieten filtern können',
      so_that: 'meine Tourenplanung effizienter zu gestalten',
      acceptance_criteria: [],
      priority: 'medium',
      labels: ['crm', 'filtering'],
      source_snippet: null,
      is_deleted: false,
      sort_order: 2,
    },
    {
      id: 'US-107',
      title: 'Dunkelmodus für das Dashboard',
      as_who: 'Administrator',
      i_want: 'zwischen Hell- und Dunkelmodus wechseln',
      so_that: 'bei schlechten Lichtverhältnissen augenschonend arbeiten zu können',
      acceptance_criteria: [],
      priority: 'low',
      labels: ['ui', 'accessibility'],
      source_snippet: null,
      is_deleted: false,
      sort_order: 3,
    },
  ],
  nfrs: [
    {
      id: 'NFR-01',
      title: 'API-Antwortzeiten',
      category: 'Performance',
      description:
        'Alle API-Endpunkte müssen unter Last innerhalb von 200ms antworten.',
      metric: 'P95 < 200ms bei 1000 gleichzeitigen Anfragen',
      priority: 'high',
      source_snippet:
        '"Das System muss auch bei Spitzenlast performant bleiben."',
      is_deleted: false,
      sort_order: 0,
    },
    {
      id: 'NFR-02',
      title: 'DSGVO-konforme Datenspeicherung',
      category: 'Compliance',
      description:
        'Kundendaten müssen DSGVO-konform gespeichert und verarbeitet werden.',
      metric: null,
      priority: 'critical',
      source_snippet: null,
      is_deleted: false,
      sort_order: 1,
    },
    {
      id: 'NFR-03',
      title: 'Systemverfügbarkeit',
      category: 'Reliability',
      description:
        'Das System muss eine Verfügbarkeit von 99.9% gewährleisten.',
      metric: '99.9% Uptime SLA',
      priority: 'high',
      source_snippet: null,
      is_deleted: false,
      sort_order: 2,
    },
    {
      id: 'NFR-04',
      title: 'Zugriffskontrolle',
      category: 'Security',
      description:
        'Alle API-Endpunkte müssen durch JWT-basierte Authentifizierung geschützt sein.',
      metric: null,
      priority: 'critical',
      source_snippet: null,
      is_deleted: false,
      sort_order: 3,
    },
    {
      id: 'NFR-05',
      title: 'Barrierefreiheit',
      category: 'Usability',
      description: 'Die Benutzeroberfläche muss WCAG 2.1 AA erfüllen.',
      metric: 'WCAG 2.1 AA',
      priority: 'medium',
      source_snippet: null,
      is_deleted: false,
      sort_order: 4,
    },
  ],
  open_questions: [
    {
      id: 'OQ-01',
      question_text:
        'Welches Rechnungsformat soll verwendet werden (PDF, ZUGFeRD, XRechnung)?',
      owner: 'Max Müller',
      status: 'open',
      source_snippet: null,
      is_deleted: false,
      sort_order: 0,
    },
    {
      id: 'OQ-02',
      question_text:
        'Soll der Webshop über eine direkte API-Integration oder über einen Middleware-Dienst synchronisiert werden?',
      owner: null,
      status: 'open',
      source_snippet: null,
      is_deleted: false,
      sort_order: 1,
    },
    {
      id: 'OQ-03',
      question_text:
        'Gibt es eine bestehende PLZ-Datenbank oder muss eine externe API angebunden werden?',
      owner: 'Sara Bauer',
      status: 'deferred',
      source_snippet: null,
      is_deleted: false,
      sort_order: 2,
    },
  ],
}
