export interface ParsedPlaylist {
  aired_date: string
  title: string
  source_url: string
}

interface CollectionItem {
  articleLink: string
  cardTitle: string
  [key: string]: unknown
}

interface CollectionResponse {
  items: CollectionItem[]
  total: number
}

const MONTHS: Record<string, string> = {
  January: '01', February: '02', March: '03', April: '04',
  May: '05', June: '06', July: '07', August: '08',
  September: '09', October: '10', November: '11', December: '12',
}

function parseAiredDate(cardTitle: string): string {
  // e.g. "Thursday night 28 May 2026" → "2026-05-28"
  const match = cardTitle.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (!match) return ''
  const [, day, month, year] = match
  const mm = MONTHS[month]
  if (!mm) return ''
  return `${year}-${mm}-${day.padStart(2, '0')}`
}

const ABC_BASE = 'https://www.abc.net.au'

export function parseCollectionResponse(json: CollectionResponse): ParsedPlaylist[] {
  return json.items.map(item => ({
    source_url: item.articleLink.startsWith('http') ? item.articleLink : `${ABC_BASE}${item.articleLink}`,
    title: item.cardTitle ?? item.articleLink,
    aired_date: parseAiredDate(item.cardTitle ?? ''),
  }))
}
