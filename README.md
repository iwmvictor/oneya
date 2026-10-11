# Kigali Vibes Radio

Build a production-ready Rwanda Radio PWA
Build a real, deployable, mobile-first Progressive Web App for discovering and listening to radio stations broadcasting from Rwanda.
This is not a generic radio-themed landing page, SaaS dashboard, or AI-generated UI concept.
The product should feel like a polished, credible consumer media application similar in quality and usability to a serious music/radio streaming product.
The primary audience is:
People in Rwanda who have smartphones but do not have convenient access to a traditional FM radio or a dedicated radio app.
Rwandans and people interested in Rwanda who live outside the country and cannot receive Rwanda's terrestrial FM signals.
Secondary audience: anyone around the world who wants to listen to Rwanda radio online.
The core value proposition is:
Listen to Rwanda, wherever you are.
1. PRODUCT PRINCIPLE
The application is fundamentally a RADIO PLAYER.
Do not design it as a website with a radio player added afterward.
The most important action is:
Find a station → tap play → listen.
The interface must make that interaction extremely fast and obvious.
Prioritize:
station discovery
reliable audio playback
simple navigation
mobile usability
persistent playback
PWA installation
performance
accessibility
clear station information
good responsive behavior
Do not prioritize decorative animations or visual effects.
2. VERY IMPORTANT: AVOID GENERIC AI UI DESIGN
Do NOT use common AI-generated interface patterns such as:
excessive purple/blue gradients
neon colors
glowing cards
glassmorphism everywhere
excessive backdrop blur
floating blobs
excessive rounded cards
excessive pill-shaped buttons
huge hero sections
oversized headings
unnecessary shadows
cards nested inside cards
random decorative illustrations
emoji as UI icons
fake station artwork
random stock images
excessive animation
artificial dashboard aesthetics
"AI startup" visual language
unnecessary metric cards
fake statistics
fake listener counts
fake social proof
fake testimonials
The application should look like a real radio/media product, not something generated from a generic AI design template.
Use restraint.
The UI should be clean, confident, editorial, functional and information-dense.
When choosing between something visually impressive and something easy to use, choose usability.
3. VISUAL DIRECTION
Create a distinctive but restrained Rwanda-focused visual identity.
Do not overuse national colors.
Use Rwanda-inspired colors subtly and professionally.
Suggested design system:
primary: deep/controlled Rwanda-inspired red
background: warm white or very light neutral
surfaces: white
primary text: near-black/charcoal
secondary text: neutral gray
borders: subtle neutral gray
success/live state: restrained green
destructive/error state: restrained red
Avoid gradients unless they have a very specific functional/design purpose.
Avoid excessive shadows.
Use borders and spacing to establish hierarchy.
The interface should feel premium without looking expensive or flashy.
4. TYPOGRAPHY
Use a professional, highly readable modern typeface.
Typography should prioritize:
readability
hierarchy
station names
frequency information
player information
Do not use oversized typography simply to make the page look impressive.
Mobile should remain information-dense enough that users can see several stations without excessive scrolling.
5. ICONS
Do NOT use emojis as interface icons.
Use a consistent icon library such as Lucide React.
Examples:
Play
Pause
Volume2
VolumeX
Search
Radio
Heart
Share2
Settings
ChevronRight
ArrowLeft
Menu
MoreVertical
Wifi
WifiOff
Loader
AlertCircle
RefreshCw
Download
Headphones
Globe
MapPin
Icons must have consistent sizing and stroke weight.
6. MOBILE FIRST
Design the mobile experience first.
Desktop should be a deliberate responsive experience, not simply a stretched mobile page.
Primary mobile navigation can use:
Home
Stations
Favorites
Keep navigation simple.
The persistent player should remain accessible while browsing.
A mobile user should be able to:
Open the application.
Find a station.
Start playback.
Continue browsing.
Return to the player.
Favorite a station.
Share a station.
with minimal interaction.
7. CORE MOBILE STRUCTURE
Create a mobile experience approximately structured like:
Header
Rwanda Radio branding
search
optional overflow/settings menu
Main content:
featured/live section
categories
station list
Persistent mini-player at the bottom when a station is active.
Bottom navigation:
Home
Stations
Favorites
Do not overcrowd the screen.
8. HOME PAGE
Create a useful home page, not a marketing landing page.
The top of the home page should immediately help the user discover radio.
Possible sections:
Currently Live
Show stations that are currently available.
Featured Stations
A small number of curated stations.
Browse by Category
Examples:
Music
News
Talk
Sports
Religious
Community
Stations
A compact station list.
Recently Played
If the user has previously listened to stations, show them here.
Do not show fake listener numbers or fake popularity statistics.
9. STATION LIST
The station list is one of the most important components.
Do not make every station a huge card.
Use compact, scan-friendly rows.
Each station row can contain:
station logo
station name
frequency
location
category
live/online indicator
favorite button
play button
Example concept:
KISS FM
102.3 FM · Kigali
[Play]
Radio10
87.6 FM · Kigali
[Play]
Radio One
91.1 FM · Kigali
[Play]
Users should be able to scan many stations quickly.
10. STATION DETAIL PAGE
Each station should have its own route.
Example:
/station/kiss-fm
The page should contain:
station artwork/logo
station name
frequency
location
category
description
play button
favorite button
share button
website link if available
stream status
Do not invent information.
Use placeholders where real station information has not yet been verified.
11. RADIO PLAYER
The player is the heart of the application.
Build a proper reusable player architecture.
Do not scatter audio logic across components.
Create a centralized player state using a React Context/provider or equivalent architecture.
For example:
RadioPlayerProvider
Responsibilities:
current station
playing state
loading state
error state
volume
muted state
stream URL
reconnecting state
current metadata when available
play
pause
stop
switch station
retry
The actual audio implementation should use the browser's HTML5 Audio API.
Do not create a separate Audio element for every station.
There should be one controlled playback engine.
12. PLAYER STATES
Clearly distinguish:
Idle
No station selected.
Connecting
The user has selected a station and the stream is loading.
Display:
"Connecting..."
Playing
Display:
"Live"
or an equivalent clear live state.
Paused
Show pause/play state appropriately.
Error
Display:
"Unable to connect"
with:
"Try again"
Offline
Clearly indicate that the device has no internet connection.
Do not pretend a live stream can work without internet.
13. STREAM DATA
Keep station data completely separate from UI components.
Create a typed station model.
For example:
export interface RadioStation {
  id: string;
  name: string;
  frequency?: string;
  location?: string;
  province?: string;
  categories: string[];
  logo?: string;
  description?: string;
  streamUrl?: string;
  website?: string;
  isFeatured?: boolean;
  status?: "online" | "offline" | "unknown";
}

Create a dedicated data layer such as:
src/data/stations.ts
Do not hard-code station information directly into JSX components.
This is important because the station database will eventually move to a backend/API.
14. INITIAL VERIFIED STATION EXAMPLE
Use the verified KISS FM stream as an example station.
Station:
KISS FM
Frequency:
102.3 FM
Location:
Kigali / Rebero
Stream:
https://kissfm-atunwadigital.streamguys1.com/kissfm
Website:
https://kissfm.rw/
Treat this stream URL as configuration/data, not as something embedded inside the player component.
Do not invent additional stream URLs.
For stations whose real stream has not been verified, use a clearly marked placeholder state rather than pretending the station is playable.
15. STREAM VERIFICATION / STATION STATUS
The application needs to understand that not every FM station necessarily has a publicly usable internet stream.
Support these states:
Online
Offline
Stream unavailable
Coming soon
Unknown
Do not display a working play button for an unverified stream.
If a station does not yet have a verified stream, show something such as:
"Online stream coming soon"
instead of a broken player.
16. SEARCH
Implement station search.
Search by:
station name
frequency
location
category
Search should be fast and work well on mobile.
Include a clear empty state:
"No stations found"
with an option to clear the search.
17. FILTERING
Provide simple filters/categories.
Examples:
All
Music
News
Talk
Sports
Religious
Community
Do not make filters visually excessive.
The user should never feel like they are operating a database.
18. FAVORITES
Implement favorites using local persistence initially.
Use localStorage or an appropriate client-side persistence mechanism.
Users should be able to:
favorite a station
unfavorite it
view Favorites
persist favorites after closing/reopening the application
Do not require account creation for basic favorites in the first version.
The architecture should allow account-based synchronization later.
19. RECENTLY PLAYED
Persist a small list of recently played stations locally.
For example:
last 5–10 stations
Use this to improve discovery.
Do not collect unnecessary personal information.
20. SHARING
Each station should have a shareable URL.
For example:
/station/kiss-fm
Use the Web Share API on supported mobile devices.
Fallback gracefully if Web Share is unavailable.
The URL should allow someone to directly open the station page.
21. PWA REQUIREMENTS
This is a PWA from the beginning.
Implement:
web app manifest
service worker
installable application
standalone display mode
application icons
theme color
background color
responsive layout
offline application shell
cached static assets
proper app name
short name
description
appropriate start URL
The application should be installable on:
Android
iOS where browser/PWA capabilities permit
desktop browsers supporting PWAs
Do not claim that live audio works offline.
The offline functionality should mean the application shell and previously cached station metadata can still load.
22. PWA APP IDENTITY
Use a proper product identity.
Working product name:
Rwanda Radio
Use this consistently throughout the application.
Create placeholders for:
app icon
favicon
PWA icon
station logos
Do not generate fake station logos.
Make it obvious where the real assets will be inserted.
23. RESPONSIVE DESKTOP EXPERIENCE
On desktop, use the extra space intelligently.
A possible structure:
Left navigation/sidebar:
Home
Stations
Favorites
Categories
Main content:
featured stations
station discovery
station lists
Persistent player at the bottom.
Do not simply stretch mobile cards across the entire screen.
Desktop should feel like a real media application.
24. ACCESSIBILITY
Implement:
semantic HTML
keyboard navigation
visible focus states
accessible labels
proper button semantics
sufficient contrast
screen-reader-friendly controls
accessible player status
reduced-motion support
large enough touch targets
Do not rely on color alone to communicate state.
25. PERFORMANCE
Optimize for mobile users and potentially slower connections.
Avoid:
unnecessarily large libraries
excessive animation
huge images
loading every station image immediately
unnecessary network requests
Use:
lazy-loaded images where appropriate
responsive image sizing
code splitting where useful
efficient React rendering
memoization only when it provides a real benefit
lightweight components
The initial application shell should load quickly.
26. IMAGES
Do not invent or fabricate station logos.
Use real image placeholders.
Create a predictable structure such as:
/public/stations/
Examples:
/public/stations/kiss-fm.webp
/public/stations/radio10.webp
If an asset doesn't exist, show a clean neutral placeholder using the station's initials or a simple Radio icon.
Do not use emoji.
27. ERROR HANDLING
Handle:
failed streams
network loss
malformed stream URLs
unsupported audio format
browser playback restrictions
connection timeout
stream disconnect
retry
Give the user useful messages.
Avoid technical error messages such as:
"AbortError: The play() request was interrupted."
Translate technical failures into human-readable UI.
Log technical information for developers where appropriate.
28. BROWSER AUTOPLAY RULES
Do not attempt to autoplay audio when the browser does not allow it.
Playback should begin as a direct result of a user interaction.
The app should gracefully handle browser autoplay restrictions.
29. AUDIO EXPERIENCE
When changing stations:
Stop the current stream.
Update current station.
Start the new stream.
Show connecting state.
Show live state after successful playback.
Avoid overlapping audio streams.
There should never be two stations playing simultaneously.
30. VISUAL PLAYER
Mobile:
Use a persistent mini-player above bottom navigation.
Show:
station logo
station name
frequency
live/connection status
play/pause
optional volume/control
Tapping the mini-player should open a full-screen or expanded player.
Expanded player:
large station artwork
station name
frequency
status
large play/pause control
volume
favorite
share
station website
Do not make the expanded player unnecessarily complicated.
31. DESKTOP PLAYER
On desktop, create a persistent bottom player.
It should remain available while browsing stations.
It should not disappear when navigating between routes.
32. NAVIGATION
Use React Router or the project's appropriate routing system.
Suggested routes:
/
/stations
/favorites
/station/:stationId
/search
/settings
Keep routes clean and shareable.
33. SETTINGS
Create a lightweight settings screen.
Possible settings:
Dark/light/system theme
Audio behavior
About
PWA installation information
Privacy
Data usage information
Do not overbuild settings.
34. DARK MODE
Support light and dark themes if it can be implemented cleanly.
Dark mode should be a genuine design system, not simply inverted colors.
Avoid pure black backgrounds everywhere.
Use controlled dark neutral surfaces and appropriate contrast.
35. NO FAKE CONTENT
Do not invent:
listener counts
number of stations
ratings
reviews
popularity scores
"trending" data
song information
current programs
DJ names
station descriptions
unless supplied by verified data.
Use placeholders where real information is unavailable.
36. CODE QUALITY
Use clean, maintainable React + TypeScript.
Prefer:
reusable components
typed data models
separation of concerns
centralized player state
dedicated station data layer
reusable UI components
clear naming
small components
minimal duplication
Avoid putting the entire application in one giant component.
Do not create unnecessary abstractions either.
Keep the architecture understandable to another developer.
37. SUGGESTED PROJECT STRUCTURE
Use a structure similar to:
src/
  components/
    layout/
    navigation/
    stations/
    player/
    search/
    ui/

  pages/
    Home.tsx
    Stations.tsx
    Favorites.tsx
    StationDetail.tsx
    Settings.tsx

  components/player/
    RadioPlayer.tsx
    MiniPlayer.tsx
    FullPlayer.tsx
    PlayerControls.tsx

  context/
    RadioPlayerContext.tsx

  hooks/
    useRadioPlayer.ts
    useFavorites.ts
    useRecentlyPlayed.ts

  data/
    stations.ts

  types/
    station.ts

  services/
    stationService.ts

  lib/
    audio.ts
    storage.ts

  styles/

Adjust this structure if the existing project has a better established architecture, but maintain the same separation of concerns.
38. FUTURE SCALABILITY
The first version can use local station data.
However, design the data layer so it can later be replaced with an API/database.
Future backend capabilities may include:
station management
stream verification
stream health monitoring
station logos
station descriptions
categories
featured stations
schedules
currently playing metadata
analytics
user accounts
synced favorites
Do not tightly couple the UI to hard-coded station data.
39. FUTURE ADMIN PANEL
Do not necessarily build the admin panel now.
But architect the application so a future admin system can manage:
Station:
name
slug
frequency
province
city
categories
logo
description
stream URL
website
status
featured flag
ordering
This should eventually be manageable without editing frontend source code.
40. SECURITY / PRIVACY
Do not expose secrets in frontend code.
Do not create unnecessary user tracking.
Do not collect personal information simply because it is possible.
If analytics are added later, structure them in a privacy-conscious way.
41. IMPORTANT: STREAM URL HANDLING
Do not proxy audio through the frontend application unless there is a legitimate technical reason.
For publicly accessible streams, use the stream URL directly where browser/CORS/audio compatibility permits.
If a stream doesn't support browser playback because of CORS or format limitations, do not pretend it works.
Instead clearly identify the technical limitation so it can later be addressed with an appropriate backend streaming/proxy architecture if necessary.
42. FIRST VERSION SHOULD BE FUNCTIONAL
Do not stop at visual screens.
The first implementation should actually include:
working station browsing
working search
working favorites
working recently played
working station routes
working persistent player
working KISS FM stream
proper loading/error states
PWA configuration
responsive mobile UI
responsive desktop UI
The KISS FM stream provided for the initial verified station is:
https://kissfm-atunwadigital.streamguys1.com/kissfm
Use it as the first functional stream.
Do not fabricate additional working stream URLs.
43. DESIGN DETAILS TO AVOID
Do not create:
giant "Welcome to Rwanda Radio" hero taking most of the screen
unnecessary marketing sections
pricing sections
testimonials
fake statistics
oversized gradients
decorative waveforms that do not represent actual audio
fake equalizers
animated blobs
emoji-based categories
fake album artwork
excessive cards
excessive rounded corners
excessive floating elements
unnecessary modals
excessive onboarding
The user should get to radio quickly.
44. DESIGN DETAILS TO EMPHASIZE
Emphasize:
strong information hierarchy
excellent spacing
readable station names
clear frequencies
clear live status
excellent play controls
station discovery
persistent playback
clean navigation
subtle Rwanda identity
trustworthy visual language
responsive design
accessibility
performance
The application should feel calm, reliable and purposeful.
45. FINAL PRODUCT TEST
Before considering the build complete, test the following flows.
Flow 1
Open app → find KISS FM → play → hear audio → navigate to Stations → audio continues.
Flow 2
Open station → favorite → close app → reopen → station remains in Favorites.
Flow 3
Search "KISS" → result appears → play.
Flow 4
Open /station/kiss-fm directly → station page loads → play.
Flow 5
Share station → recipient opens station URL → station page loads.
Flow 6
Install PWA → launch standalone → application behaves like an installed app.
Flow 7
Disconnect internet → cached application shell remains usable → live playback correctly reports unavailable.
Flow 8
Resize from phone width to tablet to desktop → no broken layout.
Flow 9
Attempt to play an unavailable/unverified station → user receives a clear availability message rather than a broken player.
46. MOST IMPORTANT INSTRUCTION
Do not treat this as a design exercise.
Build the foundation of a real product.
The application should be:
Mobile-first.
PWA-first.
Radio-first.
Fast.
Accessible.
Scalable.
Clean.
Trustworthy.
It should feel like something a real company could deploy publicly, not a generated prototype.
Use the existing code supplied to you only as a functional reference for the intended concept. Improve the architecture and UX rather than blindly reproducing its styling.
When a design decision is ambiguous, prioritize:
clarity → usability → performance → maintainability → visual polish
in that order.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7967a5da-0079-4b84-8863-ff4c5573253e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
