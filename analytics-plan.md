# Avante — Analytics Plan (PostHog)

## SDK & Config
- **SDK:** `posthog-react-native` v3.3.10
- **Host:** `us.i.posthog.com` (cloud free tier)
- **API Key:** `EXPO_PUBLIC_POSTHOG_KEY` (env variable, never hardcoded)
- **Persistence:** `memory` (Expo 54 compatibility)
- **GDPR:** Consent modal on first auth + toggle in Settings > Privacy

---

## Event Catalog

### Authentication

| Event | Properties | Trigger |
|-------|-----------|---------|
| `user_registered` | `method: "email" \| "google"` | Signup success |
| `user_logged_in` | `method: "email" \| "google"` | Login success |
| `user_logged_out` | — | Logout button |
| `onboarding_completed` | `turtle_name: string` | Onboarding finish |

### Calendar / Events

| Event | Properties | Trigger |
|-------|-----------|---------|
| `event_created` | `area: "family" \| "work" \| "personal"`, `has_recurrence: bool` | Event saved |
| `event_updated` | `area` | Event edited |
| `event_deleted` | `was_recurring: bool` | Event deleted |
| `calendar_viewed` | — | Agenda tab focused |

### Tasks

| Event | Properties | Trigger |
|-------|-----------|---------|
| `task_created` | — | Task added |
| `task_completed` | — | Task checked |
| `task_uncompleted` | — | Task unchecked |
| `task_deleted` | — | Task removed |
| `all_tasks_completed` | `total_today: number`, `streak_days: number` | All daily tasks done |

### Streak

| Event | Properties | Trigger |
|-------|-----------|---------|
| `streak_increased` | `days: number` | Streak goes up after completing all tasks |

### Google Calendar

| Event | Properties | Trigger |
|-------|-----------|---------|
| `google_calendar_connected` | — | OAuth callback success |
| `google_calendar_disconnected` | — | Disconnect confirmed |
| `calendar_sync_completed` | `events_imported: number` | Manual sync done |

### Settings

| Event | Properties | Trigger |
|-------|-----------|---------|
| `settings_viewed` | — | Settings tab focused |
| `language_changed` | `from: string`, `to: string` | Language pill tap |
| `country_changed` | `from: string`, `to: string` | Country pill tap |
| `support_tapped` | — | Ko-fi button tap |

### Navigation (screen views)

| Event | Properties | Trigger |
|-------|-----------|---------|
| `$screen` | `$screen_name: string` | Tab focus (PostHog native) |
| `balance_viewed` | — | Balance tab focused |
| `calendar_viewed` | — | Agenda tab focused |
| `settings_viewed` | — | Settings tab focused |

Screen names: `home`, `agenda`, `balance`, `settings`

---

## User Properties (set via `identify`)

| Property | Type | Source |
|----------|------|--------|
| `email` | string | Auth |
| `language` | string | Settings |
| `country` | string | Settings |
| `created_at` | ISO date | Backend |
| `turtle_name` | string | Onboarding |
| `platform` | `"ios" \| "android" \| "web"` | Device |
| `app_version` | string | Constants |
| `has_google_connected` | bool | Calendar status |

---

## Dashboard Metrics

### Adoption
- **Daily Active Users (DAU):** Unique users with any event per day
- **Weekly Active Users (WAU):** Unique users per week
- **New registrations:** `user_registered` count per day
- **Onboarding completion rate:** `onboarding_completed` / `user_registered`

### Engagement
- **Tasks created per day:** `task_created` count
- **Tasks completed per day:** `task_completed` count
- **Completion ratio:** `task_completed` / `task_created`
- **Events created per day:** `event_created` count
- **All tasks completed (aha moment):** `all_tasks_completed` count
- **Average streak days:** `streak_increased` avg `days` property

### Retention
- **Day 1/7/30 retention:** PostHog built-in retention analysis
- **Streak consistency:** Users with `streak_increased` where `days >= 7`

### Feature Usage
- **Most visited screens:** `$screen` breakdown by `$screen_name`
- **Google Calendar adoption:** `google_calendar_connected` / total users
- **Language distribution:** User property `language` breakdown
- **Platform split:** User property `platform` breakdown

### Monetization (future)
- Track `support_tapped` conversion rate
- When premium features exist: `premium_feature_clicked`, `subscription_started`

---

## Implementation Files

| File | Events |
|------|--------|
| `app/(auth)/login.tsx` | `user_logged_in` |
| `app/(auth)/signup.tsx` | `user_registered` |
| `app/onboarding.tsx` | `onboarding_completed` |
| `app/(tabs)/_layout.tsx` | `calendar_viewed`, `balance_viewed`, `settings_viewed`, screen views |
| `app/(tabs)/settings.tsx` | `user_logged_out`, `language_changed`, `country_changed`, `calendar_sync_completed`, `google_calendar_disconnected`, `support_tapped` |
| `app/calendar/connected.tsx` | `google_calendar_connected` |
| `src/features/auth/useGoogleAuth.ts` | `user_registered`, `user_logged_in` |
| `src/features/events/useCreateEvent.ts` | `event_created` |
| `src/features/events/useUpdateEvent.ts` | `event_updated` |
| `src/features/events/useDeleteEvent.ts` | `event_deleted` |
| `src/features/tasks/hooks.ts` | `task_created`, `task_completed`, `task_uncompleted`, `task_deleted` |
| `src/features/tasks/DailyTasksSection.tsx` | `all_tasks_completed`, `streak_increased` |
| `src/lib/analytics.ts` | Core wrapper (init, identify, capture, optIn/optOut, screenView) |
| `src/stores/analyticsConsentStore.ts` | GDPR consent persistence |
| `src/components/AnalyticsConsentSheet.tsx` | Consent UI |

---

## Naming Conventions
- All events: `snake_case`
- All properties: `snake_case`
- Screen names: lowercase (`home`, `agenda`, `balance`, `settings`)
- Boolean properties: `has_*` or `was_*` prefix
- No PII in events (no passwords, no event titles, no task text)
