# Film en Serie Tracker
Kijklijst-app voor films en series. Backend: Symfony, Doctrine en SQLite. Frontend: React/Vite als uitbreiding op de basisopdracht.

## Starten
Back-end:
```bash
cd "Symfony Doctrine Back-End"
composer install
symfony serve
```

Front-end:
```bash
cd "React Front-End"
npm install
npm run dev
```

Open daarna `http://localhost:5173`.
`composer install` is alleen nodig als de back-end dependencies nog ontbreken. `npm install` is alleen nodig als de front-end dependencies nog ontbreken.

## Af
- Symfony/Doctrine backend met SQLite database en migraties voor gebruikers, titels en genres.
- `Title`, `User` en `Genre` entities met Doctrine-relaties.
- Registeren en inloggen met JWT-authenticatie.
- Eigen kijklijst per gebruiker.
- API voor titels ophalen, detail bekijken, toevoegen, bewerken en verwijderen.
- Gezien- en favoriet-status aanpassen.
- Zoeken en filteren op type, gezien-status, favorieten en genre.
- Genres als aparte entity met relatie naar titels, inclusief endpoints om genres op te halen, toe te voegen en te verwijderen.
- Inputvalidatie voor titels, genres, jaren en verplichte velden.
- Thumbnail upload voor titels.
- Profielfoto upload en profielpagina.
- React/Vite frontend met routes voor home, mijn lijst, toevoegen, detail, bewerken, profiel en Snake.
- Formulieren voor toevoegen/bewerken met genreselectie, nieuw genre toevoegen en uploadvelden.
- Detailpagina voor titels.
- CORS-configuratie voor communicatie tussen frontend en backend.
- Backendlogica opgesplitst in services voor auth, uploads, serialisatie, titelvalidatie/data en Snake-score.
- Snake minigame met score-events en high score per gebruiker.

## Niet af
- Geen rating van 1 tot 5 sterren.

## Aanpak
Ik ben op ``4 mei`` begonnen met de backend. Eerst heb ik het Symfony project opgezet en de basis entities aangemaakt (`User` en `Title`) als startpunt, zonder verdere logica. Daarna heb ik `User` uitgewerkt met register/login en JWT. JWT is gekozen omdat het stateless werkt, de backend hoeft geen sessie bij te houden en het token is makkelijk mee te sturen in elke API-request via een `Authorization` header. Zo stond authenticatie als fundament klaar voordat de rest erbovenop werd gebouwd.

Voor de database type is SQLite gekozen omdat dit het enige databasesysteem is waarmee ik bekend ben vanuit mijn opleiding.

Vervolgens heb ik `Title` uitgewerkt met de belangrijkste velden voor films en series, gekoppeld aan de ingelogde gebruiker, en de endpoints gebouwd om titels op te halen, toe te voegen en te verwijderen.

Op ``5 mei`` heb ik de React frontend opgezet en gekoppeld aan de API. Voor de frontend is gekozen voor React met Vite. Vite is snel in development omdat het bij elke opgeslagen wijziging de browser automatisch ververst zonder de hele pagina te herladen, waardoor je direct het resultaat ziet zonder handmatig te refreshen. React maakt het beheren van state, zoals filters, favorieten en bewerkformulieren, overzichtelijker dan plain JavaScript.

Eerst kwamen gedeelde helpers, auth-formulieren en de hoofdschermen. Daarna heb ik pagina's toegevoegd voor toevoegen, lijst, detail, profiel en Snake. De focus lag toen op een werkende flow van frontend naar backend.

Op ``7 mei`` heb ik vooral gerefactored. Frontend pagina's zijn opgesplitst in duidelijkere componenten en backendlogica is uit controllers gehaald. Services zoals `TitleService`, `AuthService`, `FileUploadService`, `SerializerService` en `SnakeScoreService` zorgen ervoor dat controllers vooral request en response regelen. Dit maakt de code beter leesbaar, voorkomt dat validatie, uploads en game-logica door elkaar staan, en maakt losse onderdelen makkelijker te isoleren.

Daarna heb ik uitbreidingen afgerond: genres als aparte entity, filters, uploads, CORS en kleine cleanup. Genres zijn gekoppeld aan titels, zodat dezelfde genres opnieuw gebruikt kunnen worden en filters logisch blijven. Uploads zijn apart verwerkt, omdat `multipart/form-data` anders binnenkomt dan JSON.

## Tijd
Bijgehouden werktijd: 4 Mei, 01:26:14.40, 5 Mei, 03:02:42.28 en 7 Mei, 01:33:17.59. Totaal 06:02:14.27.

## Handmatig getest
Registreren, inloggen, sessie herstellen, titels toevoegen/bewerken/verwijderen, favoriet/gezien toggles, zoeken, filters, genres toevoegen/koppelen, thumbnails uploaden, profielfoto uploaden, detailpagina en Snake score.

## Tegenaan gelopen
- CORS: frontend en backend draaien op andere hosts/poorten.
- JSON en upload requests moesten naast elkaar werken.
- Scope bewaken was lastig door de extra uitbreidingen.
- JWT-auth goed koppelen aan de frontend was even zoeken, vooral met tokens bewaren en meesturen bij requests.
- Doctrine relaties tussen gebruikers, titels en genres moesten goed staan, anders kwamen data en filters niet logisch terug.
- Bij uploads moest ik rekening houden met bestandsnamen, mapstructuur en oude/lege afbeeldingen.
- De Snake high score moest eerlijk worden opgeslagen per gebruiker, zonder dat de frontend zomaar een score kon overschrijven.
- Frontend state werd snel rommelig toen zoeken, filteren, bewerken en favorieten tegelijk moesten werken.

## AI-tools
Ik heb ChatGPT/Codex gebruikt als hulpmiddel tijdens het project. Ik heb AI gebruikt voor inspiratie bij backend functie-logica, als leerproces om Symfony/Doctrine beter te begrijpen, voor review op inconsistenties, refactor-keuzes en CORS/API-config. Daarnaast heb ik hulp gevraagd bij frontend styling en bij de wiskundige logica van Snake, zoals beweging, botsingen en scoreverwerking. De code heb ik zelf aangepast, getest en passend gemaakt voor mijn project.
