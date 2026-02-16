# Pokido - פוקידו 🎴

מכשיר זיהוי קלפי פוקימון TCG בסגנון פוקידקס אמיתי - אפליקציית Next.js לילדים בעברית/אנגלית!

## מה זה?

פוקידו הוא פוקידקס דיגיטלי לקלפי פוקימון - סרוק קלף עם המצלמה וקבל מידע מלא עליו!

## תכונות ✨

- 📸 **סריקת קלפים** - העלאת תמונה מהמצלמה
- ⌨️ **חיפוש ידני** - לפי שם פוקימון ומספר קלף
- 🔍 **זיהוי חכם** - Gemini AI מזהה את הקלף מהתמונה
- 💰 **הערכת ערך** - מחירים חיים מ-cardmarket ו-TCGplayer
- ⭐ **דירוג נדירות** - Common → Secret Rare
- 🎨 **עיצוב פוקידקס** - אנימציית פתיחה, מסך תוצאות מלא
- 🌐 **תמיכה דו-לשונית** - עברית/אנגלית
- 📚 **אלבום קלפים** - אוסף אישי עם סטים

## APIs בשימוש

1. **TCGdex API** (ראשי) - https://api.tcgdex.net/v2/en
   - חיפוש קלפים לפי שם ומספר
   - מידע: HP, סוג, נדירות, תמונה, מחירים

2. **Pokemon TCG API** (fallback) - https://api.pokemontcg.io/v2/cards
   - גיבוי לתמונות

3. **Gemini API** 
   - זיהוי קלפים מתמונה

## התקנה 🚀

### 1. Clone והתקנה

```bash
git clone https://github.com/Shukiclaw/pokido.git
cd pokido
npm install
```

### 2. הגדרת משתני סביבה

העתק את `.env.example` ל-`.env.local`:

```bash
cp .env.example .env.local
```

ערוך והוסף את המפתחות:

```env
# Gemini API Key (חובה)
# קבל מפתח ב-https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Pokemon TCG API Key (אופציונלי)
# קבל מפתח ב-https://pokemontcg.io/
POKEMON_TCG_API_KEY=your_pokemon_tcg_api_key_here
```

### 3. הרצה מקומית

```bash
npm run dev
```

פתחו http://localhost:3000

## מבנה הפרויקט

```
pokido/
├── pages/
│   ├── index.js              # מסך הראשי (פוקידקס)
│   └── api/
│       ├── analyze.js        # זיהוי קלף מתמונה (Gemini)
│       └── search.js         # חיפוש ידני (TCGdex)
├── contexts/
│   └── LanguageContext.js    # ניהול שפה (he/en)
├── styles/
│   ├── Pokedex.module.css    # עיצוב הפוקידקס
│   └── globals.css
├── memory/
│   └── pokido.md             # תיעוד הפרויקט
└── README.md
```

## Type Mapping (20 סוגים)

מים, אש, עשב, חשמלי, פסיכי, לחימה, אופל, מתכת, פיה, דרקון, נטול צבע, מעופף, רעל, קרח, קרקע, סלע, חרק, רוח, פלדה

## Rarity Mapping

- Common (נפוץ)
- Uncommon (לא נפוץ) 
- Rare (נדיר)
- Rare Holo (הולוגרפי נדיר)
- Rare Ultra / Ultra Rare (אולטרה נדיר)
- Secret Rare (סודי נדיר)
- Promo (פרומו)
- Amazing Rare (מדהים נדיר)
- Shiny Rare (מבריק נדיר)
- Radiant Rare (זוהר נדיר)

## Views בממשק

1. `closed` - פוקידקס סגור עם אנימציית פתיחה
2. `upload` - מסך העלאה/חיפוש
3. `preview` - תצוגה מקדימה של התמונה
4. `loading` - אנימציית סריקה עם קו לייזר
5. `result` - תוצאות מלאות עם תמונה, HP, סוג, מחיר
6. `album` - אלבום קלפים עם סטים

## אבטחה 🔒

- אין secrets בקוד (env vars בלבד)
- `.env.local` ב-`.gitignore`
- API keys לא נחשפים ל-client

## קרדיטים

- פותח ע"י Shukiclaw למושון ולידו
- Powered by TCGdex API
- AI powered by Google Gemini
- Pokemon הוא סימן מסחרי של Nintendo/Game Freak

🎴 **Pokido - התחל את האוסף שלך!**
