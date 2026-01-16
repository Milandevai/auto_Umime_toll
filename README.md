
# 🧠 umauto.ai – Inteligentní asistent pro Umíme to

**umauto.ai** je pokročilý pomocník pro vzdělávací portál Umíme to. Využívá umělou inteligenci (Google Gemini 1.5 Flash) k analýze obrazovky v reálném čase, poskytování vysvětlení a automatickému řešení úloh pomocí "Cloud Bridge" technologie.

![Stav projektu](https://img.shields.io/badge/Status-Aktivn%C3%AD-brightgreen)
![Technologie](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Gemini%20API-blue)

## ✨ Hlavní funkce

*   **Analýza obrazovky**: Snímání vybrané karty prohlížeče nebo okna.
*   **AI Řešení**: Okamžitá identifikace otázky a správné odpovědi.
*   **Vysvětlení**: Krátké a srozumitelné zdůvodnění každé odpovědi.
*   **Turbo Cloud Bridge v3**: Automatické klikání na správné možnosti přímo na stránce Umíme to bez nutnosti instalace rozšíření.
*   **Fuzzy Matching**: Inteligentní algoritmus (Levenshtein), který najde správné tlačítko i při drobných odchylkách v textu.

## 🚀 Rychlý start (Lokální spuštění)

### 1. Prerekvizity
*   Nainstalované [Node.js](https://nodejs.org/) (verze 18 nebo novější).
*   [Google Gemini API Key](https://aistudio.google.com/app/apikey).

### 2. Instalace
Klonujte repozitář a nainstalujte závislosti:

```bash
git clone https://github.com/vas-uzivatel/umime-to-pomocnik.git
cd umime-to-pomocnik
npm install
```

### 3. Nastavení API klíče
Vytvořte soubor `.env` v kořenovém adresáři (nebo nastavte v prostředí):
```env
VITE_API_KEY=vás_api_klic_zde
```

### 4. Spuštění
```bash
npm run dev
```
Aplikace poběží na `http://localhost:3000`.

## 🛠️ Jak používat (Návod)

1.  Otevřete **umauto.ai** a klikněte na **"Spustit umauto"**.
2.  Vyberte kartu prohlížeče, kde máte otevřené **Umíme to**.
3.  V plovoucím panelu umauto.ai klikněte na **"KOPÍROVAT ULTRA SKRIPT"**.
4.  Přejděte na kartu s **Umíme to**, stiskněte **F12** (vývojářské nástroje) a v záložce **Console** vložte zkopírovaný kód a stiskněte **Enter**.
5.  Nyní v aplikaci umauto.ai klikněte na **"VYŘEŠIT HNED"**.
6.  Sledujte, jak AI najde řešení a automaticky na něj na druhé kartě klikne!

## 📦 Nasazení na Web (Netlify/Vercel)

Tato aplikace je připravena pro nasazení na **Netlify**:
1.  Nahrajte kód na GitHub.
2.  Propojte GitHub s Netlify.
3.  V nastavení Netlify (Build & Deploy) přidejte **Environment Variable**:
    *   Klíč: `API_KEY`
    *   Hodnota: *Váš Gemini API klíč*
4.  Build command: `npm run build`, Publish directory: `dist`.

## ⚠️ Právní upozornění
Tato aplikace slouží výhradně pro **vzdělávací účely** a jako demonstrace možností moderních AI modelů. Používání pomocníků může být v rozporu s pravidly portálu Umíme to. Používejte zodpovědně k učení, ne k podvádění!

---
Vytvořeno s ❤️ pro efektivnější učení.
