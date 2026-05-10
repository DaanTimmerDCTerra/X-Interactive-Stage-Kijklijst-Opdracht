# Film en Serie Tracker
Kijklijst-app voor films en series.  
Backend: Symfony, Doctrine en SQLite.  
Frontend: React/Vite als uitbreiding op de basisopdracht.

## Voorgemaakt account
Gebruikersnaam: `admin@gmail.com`  
Wachtwoord: `admin123!`

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
- Symfony/Doctrine backend met SQLite database.
- ``User``, ``Title`` en ``Genre`` entities met Doctrine-relaties.
- Registreren en inloggen met JWT-authenticatie.
- Eigen kijklijst per gebruiker.
- API om titels op te halen, details te bekijken, toe te voegen, te bewerken en te verwijderen.
- Gezien- en favoriet-status aanpassen.
- Zoeken en filteren op type, gezien-status, favorieten en genre.
- Endpoints om genres op te halen, toe te voegen en te verwijderen.
- Inputvalidatie voor titels, genres, jaren en verplichte velden.
- Thumbnail upload voor titels.
- Profielfoto upload en profielpagina.
- React/Vite frontend met routes voor home, mijn lijst, toevoegen, detail, bewerken, profiel en Snake.
- Formulieren voor toevoegen en bewerken.
- Genreselectie en nieuw genre toevoegen.
- Uploadvelden voor thumbnails en profielfoto’s.
- Detailpagina voor titels.
- CORS-configuratie zodat frontend en backend met elkaar kunnen communiceren.
- Backendlogica opgesplitst in services voor auth, uploads, serialisatie, titelvalidatie/data en - Snake-score.
- Snake minigame met score-events en high score per gebruiker.

## Niet af
- Geen rating van 1 tot 5 sterren.

## Aanpak
- Ik ben op `4 mei` begonnen met de backend. Eerst heb ik het Symfony-project aangemaakt en de basis van het project opgezet. Daarbij heb ik de eerste entities gemaakt, namelijk ``User en Title``. In het begin zat daar nog niet veel logica in. Het was vooral bedoeld om alvast een goede structuur neer te zetten waar ik later op kon verder bouwen.

- Daarna ben ik begonnen met het gebruikerssysteem. Ik heb registreren en inloggen toegevoegd en daarvoor JWT gebruikt. Ik heb voor JWT gekozen omdat de backend dan geen gewone sessies hoeft bij te houden. De frontend kan het token opslaan en bij beveiligde API-requests meesturen via de Authorization header. Dit wilde ik eerst goed werkend hebben, omdat bijna alle andere functies afhankelijk zijn van de ingelogde gebruiker.

- Voor de database heb ik SQLite gekozen. Dat was voor mij de meest logische keuze, omdat ik daar vanuit mijn opleiding al mee bekend was. Ook is SQLite makkelijk lokaal te gebruiken, omdat je geen aparte database-server hoeft op te zetten.

- Toen de login en registratie werkten, ben ik verder gegaan met de ``Title`` entity. Ik heb de belangrijkste velden toegevoegd die ik nodig had voor films en series. Daarna heb ik titels gekoppeld aan de ingelogde gebruiker, zodat elke gebruiker zijn eigen kijklijst heeft. Vervolgens heb ik de eerste endpoints gemaakt om titels op te halen, toe te voegen en te verwijderen.

- Op ``5 mei`` ben ik begonnen met de React-frontend. Hiervoor heb ik Vite gebruikt, omdat dit snel werkt tijdens het designen. Als je een wijziging opslaat, zie je die bijna direct terug in de browser. Dat maakte het testen van formulieren, styling, filters en pagina’s een stuk makkelijker. React vond ik handig omdat ik veel state moest bijhouden, bijvoorbeeld voor ingelogd zijn, filters, favorieten en bewerkformulieren.

- In de frontend ben ik eerst begonnen met de basis. Ik heb helpers gemaakt voor API-calls, daarna de login- en registratieformulieren en vervolgens de hoofdschermen. Daarna heb ik pagina’s toegevoegd voor mijn lijst, titel toevoegen, detail bekijken, titel bewerken, profiel en Snake. De focus lag op dat moment vooral op een werkende flow: inloggen, data uit de backend ophalen en die via de frontend kunnen aanpassen.

- Op ``7 mei`` heb ik vooral code opgeschoond en beter verdeeld. In de backend merkte ik dat sommige controllers te groot werden, omdat daar validatie, uploads en andere logica door elkaar stonden. Daarom heb ik logica verplaatst naar services, zoals `TitleService`, `AuthService`, `FileUploadService`, `SerializerService` en `SnakeScoreService`. Hierdoor regelen de controllers vooral nog de request en response, terwijl de echte logica in aparte classes staat.

- Ook in de frontend heb ik onderdelen opgesplitst in duidelijkere componenten. Dat was nodig omdat zoeken, filteren, favorieten, bewerken en uploaden tegelijk snel rommelig werden. Door onderdelen losser te maken, werd de code overzichtelijker en makkelijker aan te passen.

- Daarna heb ik de uitbreidingen verder afgerond. Ik heb genres als aparte entity toegevoegd, zodat meerdere titels hetzelfde genre kunnen gebruiken. Dat maakt het filteren op genre ook logischer. Verder heb ik uploads toegevoegd voor thumbnails en profielfoto’s. Uploads moesten apart verwerkt worden, omdat bestanden via `multipart/form-data` binnenkomen en dus anders werken dan normale JSON-requests.

- Ook heb ik CORS ingesteld, omdat de frontend en backend op verschillende poorten draaien. Zonder die configuratie kon de frontend geen requests naar de backend sturen. Daarnaast heb ik nog kleine verbeteringen gedaan en onderdelen opgeschoond.

- De Snake-minigame heb ik als extra uitbreiding toegevoegd. Hierbij heb ik ervoor gezorgd dat er score-events zijn en dat de high score per gebruiker wordt opgeslagen. Daarbij moest ik opletten dat de frontend niet zomaar elke score kon overschrijven.

## Tijd
Bijgehouden werktijd:

- 4 mei: 01:26:14.40
- 5 mei: 03:02:42.28
- 7 mei: 01:33:17.59

- Totaal: 06:02:14.27

## Handmatig getest
Ik heb de volgende onderdelen handmatig getest:
- Registreren.
- Inloggen.
- Sessie herstellen.
- Titels toevoegen.
- Titels bewerken.
- Titels verwijderen.
- Favoriet-status aanpassen.
- Gezien-status aanpassen.
- Zoeken.
- Filters gebruiken.
- Genres toevoegen.
- Genres koppelen aan titels.
- Thumbnails uploaden.
- Profielfoto uploaden.
- Detailpagina bekijken.
- Snake score opslaan.

## Tegenaan gelopen
- Tijdens het project liep ik tegen meerdere dingen aan. CORS was een van de eerste problemen, omdat de frontend en backend op andere hosts/poorten draaien. Daardoor werden requests eerst geblokkeerd totdat de CORS-instellingen goed stonden.

- Ook moest ik JSON-requests en upload-requests naast elkaar laten werken. Normale data komt binnen als JSON, maar bestanden komen binnen via multipart/form-data. Daardoor moest ik uploads apart behandelen.

- JWT-authenticatie koppelen aan de frontend was ook even zoeken. Vooral het bewaren van het token en het meesturen bij beveiligde requests moest goed gebeuren, anders werkte de ingelogde gebruikersdata niet goed.

- Bij Doctrine moest ik goed letten op de relaties tussen gebruikers, titels en genres. Als die relaties niet goed stonden, kwamen data en filters niet logisch terug uit de API.

- Bij uploads moest ik rekening houden met bestandsnamen, de mapstructuur en situaties waarin een afbeelding leeg was of vervangen werd door een nieuwe afbeelding.

- De Snake high score was ook een aandachtspunt. Ik wilde dat de score per gebruiker eerlijk werd opgeslagen en dat de frontend niet zomaar een bestaande score kon overschrijven met een lagere of ongeldige score.

- In de frontend werd state snel rommelig toen zoeken, filteren, bewerken en favorieten tegelijk moesten werken. Daarom heb ik later onderdelen opgesplitst en code beter verdeeld.

- Ook was het soms lastig om de scope te bewaken. Ik heb extra functies toegevoegd bovenop de basisopdracht, zoals genres, uploads, een profielpagina en Snake. Daardoor moest ik opletten dat het project niet te groot werd.

## AI-tools
- Ik heb Codex gebruikt als hulpmiddel tijdens het project. Ik heb AI vooral gebruikt om mee te denken over backend functie-logica, Symfony/Doctrine beter te begrijpen, inconsistenties te vinden en keuzes voor refactoring te controleren.

- Ook heb ik AI gebruikt voor hulp bij frontend styling en de wiskundige logica van Snake, zoals beweging, botsingen en scoreverwerking.

- Ik heb de code wat AI was zelf weer aangepast, getest en passend gemaakt voor mijn project. Ook heb ik gecontroleerd of de onderdelen goed samenwerkten met mijn eigen backend, frontend en database-structuur.