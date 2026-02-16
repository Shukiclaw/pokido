# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pokido is a Pokemon TCG card scanner application built with Next.js, designed as a Pokedex-style interface for kids. It supports bilingual UI (Hebrew/English) with AI-powered card recognition via Gemini API and card data from TCGdex API.

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Production server
npm start
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure:
- `GEMINI_API_KEY` (required) - Get from https://aistudio.google.com/app/apikey
- `GEMINI_MODEL` (optional) - Defaults to `gemini-2.0-flash`
- `POKEMON_TCG_API_KEY` (optional) - Fallback for images from https://pokemontcg.io/

## Architecture

### Application Structure

- **Pages**: Next.js pages-based routing
  - `pages/index.js` - Main Pokedex UI with view state machine
  - `pages/api/analyze.js` - Image upload & Gemini AI card recognition (uses formidable for multipart)
  - `pages/api/search.js` - Manual card search by name/number via TCGdex API

- **Contexts** (both use localStorage for persistence):
  - `LanguageContext` - Bilingual support (he/en) with `t(key)` translation function
  - `CollectionContext` - Card album management with sets organization

- **Styles**: CSS Modules + global styles
  - `Pokedex.module.css` - Main component styles
  - `globals.css` & `retro.css` - Base styles + retro gaming aesthetics
  - Uses "Press Start 2P" font for Pokedex UI

### View State Machine

The app uses a view state machine in `index.js`:
1. `closed` - Pokedex closed with opening animation
2. `upload` - Camera/file upload or manual search input
3. `preview` - Image preview before scanning
4. `loading` - AI analysis with laser scan animation
5. `result` - Card details display (HP, type, rarity, price)
6. `album` - Collection organized by sets

### API Integration

**Primary Data Source: TCGdex API**
- Base URL: `https://api.tcgdex.net/v2/en` (or `/ja` for Japanese)
- Used in both `/api/analyze` and `/api/search`
- Returns: card name, number, HP, types, rarity, set info, prices

**Fallback: Pokemon TCG API**
- Base URL: `https://api.pokemontcg.io/v2/cards`
- Used only for image fallback when TCGdex image unavailable
- Requires `X-Api-Key` header if `POKEMON_TCG_API_KEY` is set

**AI Recognition: Gemini API**
- Model: `gemini-2.0-flash` (default) or configured via env
- Analyzes uploaded card images to extract Pokemon name and card number
- Called from `/api/analyze` endpoint

### Data Mappings

**Type Mapping** (`typeMapping` in index.js):
- 20 Pokemon types with Hebrew/English names and color codes
- Example: `water: { nameHe: 'מים', nameEn: 'Water', color: '#6890F0' }`

**Rarity Mapping** (`rarityMapping` in index.js):
- Common, Uncommon, Rare, Rare Holo, Ultra Rare, Secret Rare, Promo, etc.
- Bilingual labels for each rarity level

### Language System

- `LanguageContext` provides `t(key)` function for translations
- All UI strings defined in `translations` object (he/en)
- Automatically sets `dir="rtl"` for Hebrew, `dir="ltr"` for English
- Language preference persisted in localStorage as `pokido-language`

### Collection System

- `CollectionContext` manages card album with localStorage persistence
- Cards organized by sets with completion tracking
- Functions: `addCard()`, `removeCard()`, `getSetsWithStats()`, `getSetCards()`, `getTotalStats()`
- Data structure: `{ collection: { [setId]: [cards] }, sets: { [setId]: setInfo } }`
- Saved to localStorage as `pokido-collection`

## Key Implementation Details

- **File Uploads**: `/api/analyze` uses formidable with `bodyParser: false` config
- **Hydration Safety**: LanguageContext returns default values before mount to prevent hydration mismatches
- **API Timeouts**: All external API calls use AbortController with 5-10s timeouts
- **Error Handling**: Both API routes handle timeouts, HTTP errors, and missing data gracefully
- **Image Fallback Chain**: TCGdex image → Pokemon TCG API image → null

## Bilingual Considerations

- All user-facing text must have both Hebrew (he) and English (en) translations
- Add new translation keys to `translations` object in `LanguageContext.js`
- Use `t(key)` function from `useLanguage()` hook for all UI text
- Card data (names, types, rarity) should display localized versions from mappings
