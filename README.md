# Pokido - פוקידו 🎴

מכשיר זיהוי קלפי פוקימון בסגנון פוקידקס אמיתי!

## תכונות

- 📸 סריקת קלפי פוקימון עם מצלמה
- 🧠 זיהוי חכם דרך Ximilar API
- 💰 הערכת ערך בשוק
- ⭐ דירוג נדירות
- 🎨 עיצוב פוקידקס אותנטי

## התקנה

### 1. Clone והתקנת תלויות

```bash
git clone https://github.com/Shukiclaw/pokido.git
cd pokido
git checkout nextjs
npm install
```

### 2. הגדרת משתני סביבה

העתק את הקובץ `.env.example` ל-`.env.local`:

```bash
cp .env.example .env.local
```

ערוך את הקובץ והוסף את ה-token שלך מ-Ximilar:

```env
XIMILAR_TOKEN=your_token_here
```

**איך מקבלים token:**
1. הרשמו ב-https://ximilar.com
2. לכו ל-dashboard → API Keys
3. העתיקו את ה-token

### 3. הרצה מקומית

```bash
npm run dev
```

פתחו http://localhost:3000

## פריסה ב-Vercel

### שלב 1: חיבור ל-Vercel

```bash
npx vercel
```

### שלב 2: הגדרת Environment Variable

1. כנסו ל-dashboard של Vercel
2. בחרו את הפרויקט
3. לכו ל-Settings → Environment Variables
4. הוסיפו:
   - Name: `XIMILAR_TOKEN`
   - Value: ה-token שלכם מ-Ximilar
5. לחצו Save

או דרך CLI:
```bash
npx vercel env add XIMILAR_TOKEN
# הדביקו את ה-token
npx vercel --prod
```

## מבנה הפרויקט

```
pokido/
├── pages/
│   ├── index.js          # מסך הראשי (פוקידקס)
│   └── api/
│       └── analyze.js    # API endpoint ל-Ximilar
├── styles/
│   ├── Pokedex.module.css # עיצוב הפוקידקס
│   └── globals.css
├── .env.example
└── package.json
```

## אבטחה

⚠️ **חשוב:** אף פעם אל תעלו את ה-API token ל-Git!
- הקובץ `.env.local` נמצא ב-`.gitignore`
- ה-token נשמר רק בשרת (API route)
- ה-frontend לא חושף את ה-token

## טרoubleshooting

### "XIMILAR_TOKEN not configured"
ודאו שהגדרתם את משתנה הסביבה ב-Vercel dashboard.

### "API Error"
בדקו שה-token תקין ופעיל ב-Ximilar dashboard.

## קרדיטים

- Powered by [Ximilar AI](https://ximilar.com)
- פוקימון הוא סימן מסחרי של Nintendo

לעידו וחברים 🎴
