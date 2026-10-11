# ONEYA update
- [x] Replace sidebar with unified navigation and theme toggle.
- [x] Apply ONEYA branding and installation identity.
- [x] Update 38-station registry, imported logos and availability tests.
- [x] Verify navigation, themes, search, logos and player persistence.
# Foundations pass
- [x] Media Session hardening (play/pause/stop only, safe fallbacks).
- [x] Service worker emitted into published output.
- [x] Transcript model + provider boundary (no data).
- [x] Entitlement/checkout boundary (no provider, no prices).
- [ ] Real-device audio + install check — needs published site and a phone.
- [ ] Transcript display on station page + admin sign-in screen — next pass.
# Stress-test pass
- [x] Player: backoff reconnect, stale-event guard, pause drops stream, resume on network return, sync on return from background.
- [x] Schedule: Kigali time, malformed/overlap/stale → no program shown.
- [x] Search typo/spacing tolerance.
- [x] Transcription: one in-flight job per station, stale job cleanup, structured logs, duplicate-line removal.
- [ ] Continuous live transcription worker — not built; needs a scheduled job design.
- [ ] Stream health monitoring + real-device verification — needs published site and phones.
