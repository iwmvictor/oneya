# Oneya

**Listen to Rwanda, wherever you are.**

Oneya is a mobile-first Progressive Web App (PWA) for discovering and listening to radio stations broadcasting from Rwanda. Built for listeners at home and across the diaspora, it provides a simple, reliable way to stay connected to Rwanda through live radio.

> **Operations & release notes:** See [`docs/OPERATIONS.md`](docs/OPERATIONS.md) for live radio and TV, PWA installation and offline behavior, SEO, Google Analytics 4 (GA4), Search Console, asset preparation, and deployment instructions.

## Overview

Oneya is built around one essential experience:

**Find a station → Press play → Listen.**

The application prioritizes fast station discovery, reliable playback, mobile usability, and persistent audio controls over unnecessary visual effects or promotional content.

### Who is it for?

- **Listeners in Rwanda** who want convenient access to local radio on their smartphones.
- **Rwandans abroad** who want to stay connected to news, music, culture, and life back home.
- **International listeners** interested in discovering radio stations from Rwanda.

## Features

### Radio Discovery
- Browse available radio stations from Rwanda.
- Search by station name, frequency, location, or category.
- Filter stations by music, news, talk, sports, religious, and community content.
- Open dedicated station pages with shareable URLs.
- Clearly identify unavailable and unverified streams.

### Live Radio Player
- Stream compatible public radio stations using the HTML5 Audio API.
- Keep playback running while navigating between pages.
- Use a persistent mini-player on mobile and a player bar on desktop.
- Handle connecting, playing, paused, offline, and error states.
- Support retry and recovery after connection failures.
- Prevent overlapping audio streams when switching stations.

### Personalization
- Save favorite stations locally.
- Keep a recently played station history.
- Share station links using the Web Share API where supported.
- Access station pages directly through their URLs.
- Use favorites without requiring an account.

### Progressive Web App
- Install the application on supported devices.
- Provide a web app manifest and application icons.
- Cache application resources for offline access.
- Support responsive mobile, tablet, and desktop layouts.
- Provide an offline application shell where configured.

**Note:** Offline support does not mean offline radio. Live audio requires an internet connection and an accessible stream.

### SEO and Analytics
- Search-friendly station routes and page metadata.
- Google Search Console integration where configured.
- Google Analytics 4 integration where configured.
- Production deployment and operational documentation.

See [`docs/OPERATIONS.md`](docs/OPERATIONS.md) for implementation and configuration details.

## Technology Stack

The project is designed around a modern React and TypeScript architecture.

| Technology | Purpose |
|---|---|
| React | User interface and reusable components |
| TypeScript | Type safety and maintainable application logic |
| React Router or existing routing solution | Navigation and station pages |
| HTML5 Audio API | Live radio playback |
| Web App Manifest | PWA installation and application identity |
| Service Worker | Application caching and offline support |
| Local Storage | Favorites and recently played stations |
| Lucide React or equivalent | Consistent interface icons |

Refer to `package.json` for the actual dependencies, scripts, and build tooling used by the repository.

## Getting Started

### Prerequisites

- Node.js compatible with the project's dependencies.
- npm, pnpm, or Yarn.
- Git.

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd <repository-directory>
```

Install dependencies using the package manager associated with the repository's lockfile:

```bash
npm install
```

Start the development server if the project defines a `dev` script:

```bash
npm run dev
```

Build the application for production:

```bash
npm run build
```

Check `package.json` for the exact commands supported by the project. Replace the repository placeholders with the actual URL and directory name.

## Project Structure

A recommended structure is:

```text
src/
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── stations/
│   ├── player/
│   ├── search/
│   └── ui/
├── pages/
│   ├── Home.tsx
│   ├── Stations.tsx
│   ├── Favorites.tsx
│   ├── StationDetail.tsx
│   └── Settings.tsx
├── context/
│   └── RadioPlayerContext.tsx
├── hooks/
│   ├── useRadioPlayer.ts
│   ├── useFavorites.ts
│   └── useRecentlyPlayed.ts
├── data/
│   └── stations.ts
├── types/
│   └── station.ts
├── services/
│   └── stationService.ts
├── lib/
│   ├── audio.ts
│   └── storage.ts
└── styles/

public/
├── icons/
└── stations/

docs/
└── OPERATIONS.md
```

Adapt this structure to the existing repository rather than duplicating established functionality.

### Architecture Principles

- Separate station data from UI components.
- Centralize audio playback and player state.
- Use one controlled audio engine.
- Keep favorites and listening history in reusable storage utilities.
- Maintain stable station identifiers and shareable routes.
- Keep the data layer ready for a future API or database.
- Prefer small, reusable components over monolithic components.

## Station Data

Station records should be maintained in a dedicated data layer, such as `src/data/stations.ts`.

Example TypeScript model:

```typescript
export type StationStatus =
  | "online"
  | "offline"
  | "unavailable"
  | "coming-soon"
  | "unknown";

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
  status: StationStatus;
}
```

Only verified station information should be presented as fact. Do not invent stream URLs, descriptions, schedules, listener counts, or currently playing metadata.

## Verified Initial Station

KISS FM is the initial example for functional radio playback.

| Property | Value |
|---|---|
| Station | KISS FM |
| Frequency | 102.3 FM |
| Location | Kigali / Rebero |
| Website | [kissfm.rw](https://kissfm.rw/) |
| Stream | `https://kissfm-atunwadigital.streamguys1.com/kissfm` |
| Station route | `/station/kiss-fm` |

Keep the stream URL in station configuration rather than embedding it inside player components.

Verify stream availability and browser compatibility before production release. Stations without verified streams should display a clear availability message instead of a functional-looking play control.

## Radio Player

The radio player is the core of the application.

The player architecture should provide:

- Current station and stream URL.
- Playback, loading, and error state.
- Volume and mute controls.
- Station switching and retry functionality.
- Network connectivity awareness.
- Connection recovery and accessible status messages.

Use the HTML5 Audio API and centralize audio logic in a provider, context, or equivalent state-management layer.

When switching stations, stop the existing stream before starting another. Handle browser autoplay restrictions, unsupported formats, connection timeouts, and stream interruptions gracefully.

Never report playback as successful merely because a station was selected.

## Progressive Web App

The PWA implementation should include:

- Web app manifest.
- Appropriate application icons and favicon.
- Service worker registration.
- Installable application experience on supported browsers.
- Responsive layouts and standalone display mode.
- Cached application assets and station metadata where appropriate.
- Offline fallback and cache invalidation.
- Correct application name, theme color, and start URL.

Offline behavior should keep cached application resources accessible where possible. Live radio remains dependent on network connectivity and stream availability.

Installation capabilities vary by browser and operating system.

## Design Principles

Oneya should feel like a polished consumer radio product rather than a generic landing page or dashboard.

The interface prioritizes:

- Mobile-first navigation.
- Compact, readable station lists.
- Clear play and pause controls.
- Persistent playback while browsing.
- A restrained Rwanda-inspired visual identity.
- Accessible typography, spacing, and contrast.
- Minimal decoration and fast loading.

Avoid fake station artwork, invented popularity metrics, unnecessary gradients, excessive animation, and oversized promotional sections.

Use official station logos where available. When artwork is missing, display a neutral placeholder with the station's initials or a consistent radio icon.

## Accessibility and Performance

### Accessibility

- Use semantic HTML and accessible button labels.
- Support keyboard navigation and visible focus states.
- Maintain sufficient color contrast.
- Provide accessible player status announcements.
- Respect reduced-motion preferences.
- Use appropriately sized touch targets.
- Do not communicate playback state through color alone.

### Performance

- Keep the initial application shell lightweight.
- Lazy-load station images where appropriate.
- Avoid unnecessary dependencies and network requests.
- Preserve playback during route changes.
- Handle slow connections and interrupted streams.
- Use caching strategically.
- Optimize rendering without unnecessary memoization.

## Testing

Before deploying a production release, verify the following:

- [ ] Browse stations and search by name or frequency.
- [ ] Filter stations by category.
- [ ] Play the verified KISS FM stream.
- [ ] Navigate between pages without interrupting playback.
- [ ] Switch stations without overlapping audio.
- [ ] Pause, resume, and retry playback.
- [ ] Save and remove favorite stations.
- [ ] Confirm favorites persist after reopening the application.
- [ ] Confirm recently played stations persist as intended.
- [ ] Open `/station/kiss-fm` directly.
- [ ] Share a station URL and open it in another browser session.
- [ ] Confirm unverified stations cannot be played.
- [ ] Verify offline and connection-error states.
- [ ] Install and launch the PWA on supported devices.
- [ ] Confirm cached application resources remain accessible offline.
- [ ] Test mobile, tablet, and desktop layouts.
- [ ] Verify keyboard navigation and accessible controls.
- [ ] Check production metadata and configured analytics integrations.

## Deployment

Before deploying:

1. Install dependencies and run the production build.
2. Configure the required environment variables.
3. Verify station stream availability and browser compatibility.
4. Confirm HTTPS and direct navigation to station routes.
5. Validate the manifest, icons, and service worker.
6. Test offline behavior and cache updates.
7. Verify SEO metadata and analytics integrations where configured.
8. Document deployment and rollback procedures.

Configure the hosting platform to support client-side routing so direct requests to URLs such as `/station/kiss-fm` resolve correctly.

For project-specific deployment instructions, refer to [`docs/OPERATIONS.md`](docs/OPERATIONS.md).

## Privacy and Security

- Keep favorites and recently played history on the device by default.
- Do not require accounts for basic listening.
- Never expose private credentials or server-side secrets in frontend code.
- Avoid unnecessary tracking and personal data collection.
- Document analytics and third-party services.
- Review privacy implications before adding account synchronization or administrative functionality.

## Contributing

Contributions that improve station accuracy, playback reliability, accessibility, performance, and maintainability are welcome.

1. Fork the repository or create a feature branch.
2. Make a focused change following existing conventions.
3. Run the available tests and production build.
4. Test the affected user flows.
5. Update documentation where necessary.
6. Submit a pull request describing the change and any known limitations.

Do not introduce fabricated station information or unverified stream URLs.

## Documentation

- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — release notes, live radio and TV operations, PWA installation and offline behavior, SEO, GA4, Search Console, logo preparation, and deployment procedures.

## License

Add the project's chosen license here. Until a license is included in the repository, no specific open-source license should be assumed.

---

**Oneya — Listen to Rwanda, wherever you are.**