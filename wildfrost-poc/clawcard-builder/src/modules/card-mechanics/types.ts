export interface KeywordDetail {
  definition_short: string
  ref: string
}

export interface EnrichedCard {
  id: string
  name: string
  game: 'slay_the_spire' | 'monster_train' | 'wildfrost'
  color?: string
  rarity?: string
  type?: string
  cost?: number
  image?: string
  desc_raw: string
  desc_clean: string
  desc_problems: string[]
  keywords: string[]
  keyword_details: Record<string, KeywordDetail>
  mechanic_summary: string
  verified_against_wiki: boolean
  wiki_url: string
  wiki_desc: string
  wiki_keywords: string[]
  discrepancies: string[]
  qa_status: 'pending' | 'approved' | 'needs_fix'
  qa_notes: string
  qa_critic_score: number | null
  enriched_at: string
  enriched_by: string
  verified_at?: string
}

export interface KeywordData {
  name: string
  game: string
  short_desc: string
  full_desc: string
  examples: string[]
  wiki_url: string
  verified: boolean
}
