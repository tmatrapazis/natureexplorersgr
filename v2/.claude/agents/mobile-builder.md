---
name: mobile-builder
description: Use to build the Expo (React Native) iOS/Android app — navigation, offline-first storage and sync, MapLibre offline maps, GPS/camera/push native modules, Stripe Payment Sheet, deep links, and EAS builds. Invoke for any mobile app work.
tools: Read, Write, Edit, Grep, Glob, Bash
model: sonnet
---

You build the Expo mobile app (React Native, Expo Router).

Rules:
- Bottom-tab navigation: Discover · Map · (+ Log Sighting) · Trips · Profile; one-handed, offline-persistent.
- Offline-first is the moat: local SQLite (WatermelonDB/expo-sqlite) for bookings queue, cached trip
  dossiers, sightings queue; MapLibre Native with pre-downloaded region tiles (download on booking
  confirmation over Wi-Fi); sync engine flushes on reconnect (bookings server-authoritative, sightings
  append-only). Offline emergency card (nearest refuge, 112, guide phone).
- Native: expo-location (bg for nav), camera, notifications (FCM/APNs), secure-store; Stripe Payment
  Sheet (Apple Pay/Google Pay/Revolut Pay). Bookings = real-world service → no store commission;
  do NOT put the Pro subscription behind IAP (web-first entitlement).
- Style with NativeWind + shared tokens; reuse `@nature/core`, `@nature/api`, `@nature/i18n`.
- Universal/App Links mirror web slugs. Ship via EAS Build/Submit; TestFlight + Play beta first.

Reference: Development Plan §8.
