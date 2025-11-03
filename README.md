# MCRC v3 – Firebase Workflow

This app uses Firebase (Auth + Firestore + Storage) with Next.js. No Docker or Payload CMS is required.

## 1) Prerequisites

- Node 18+ and pnpm installed
- Firebase project created
- Enable in Firebase Console:
  - Authentication → Anonymous sign-in
  - Firestore Database (rules below)
  - Storage (optional)

## 2) Environment Variables

Create `.env.local` in project root:

```
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Types are declared in `src/environment.d.ts`.

## 3) Firestore Rules (summary)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return isSignedIn() && request.auth.token.admin == true; }

    match /forms/{formId}/submissions/{submissionId} {
      allow create: if isSignedIn();
      allow read: if isAdmin() || (isSignedIn() && resource.data.submittedBy == request.auth.uid);
      allow update, delete: if isAdmin();
    }

    match /contacts/{messageId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }

    match /{document=**} { allow read, write: if false; }
  }
}
```

Deploy with Firebase CLI (optional):

```
firebase deploy --only firestore:rules
```

## 4) Local Development

```
pnpm install
pnpm dev
```

Forms use `useFirestoreFormSubmit`. If no user is signed in, the hook signs in anonymously and writes to:

```
forms/<formId>/submissions
```

Examples in this repo:

- `forms/mediationSelfReferral/submissions`
- `forms/communityEducationTrainingRequest/submissions`
- `forms/groupFacilitationInquiry/submissions`
- `forms/restorativeProgramReferral/submissions`

## 5) Production

1. Add the same NEXT_PUBLIC_* env vars in your host (e.g., Vercel).
2. Ensure Firestore rules are deployed.
3. Deploy the app.

## 6) Admin (optional)

Set custom claims to grant admin access used in rules:

```
await admin.auth().setCustomUserClaims('<UID>', { admin: true })
```

## 7) Troubleshooting

- Missing permissions: confirm Anonymous auth is enabled and the collection path matches your rules.
- Env var type errors: ensure `src/environment.d.ts` matches your `.env.local` keys.
- Webchannel 400s: usually transient; verify rules and auth state.

## TODO

- Set up authors for blog posts (Firestore schema + dashboard UI)
- Add Firebase email/password login:
  - Friendly error handling and loading states
  - Add sign-out and optional reset-password later
- Migrate any remaining Payload-dependent components to Firebase or remove
- Replace legacy RichText rendering with a portable content renderer (optional)

## Setup Guide (TODO Checklist)

1) Firebase Project
- [ X ] Create a Firebase project and enable:
  - [ X ] Authentication → Providers: Email/Password and Google
  - [ X ] Authentication → Anonymous (optional, used by public forms)
  - [ X ] Firestore Database
  - [ X ] Storage (optional, for media)

2) Environment Variables (create `.env.local`)
- [ X ] Fill all `NEXT_PUBLIC_FIREBASE_*` keys
- [ ] Optionally set `NEXT_PUBLIC_SERVER_URL`

3) Firestore Rules
- [ ] Deploy: `firebase deploy --only firestore:rules`

4) Client Auth 
- [ X ] Email login in `LoginForm` with `signInWithEmailAndPassword`
- [ X ] Google login with `signInWithPopup`
- [ X ] On first login, ensure `users/{uid}` doc with `role: 'participant'`

5) Server Session (if your server checks a cookie)
- [ X ] Create `/api/session` POST route: verify ID token with Admin SDK, set HttpOnly cookie (e.g., `firebase-token`)
- [ X ] Update `LoginForm` to call `/api/session` after sign-in (send `idToken`)
- [ X ] Create `/api/session` DELETE to clear cookie on sign-out
- [ X ] Server guard reads and verifies cookie for protected routes

6) Dashboard Access Policy
- [ ] If everyone signed-in should access dashboard, change guards to only check “is authenticated”

7) Roles & Admin
- [ ] Default role is `participant` in `users/{uid}`
- [ ] Use Admin SDK to set custom claims for staff:
  - `admin: true` or `coordinator: true`

8) Forms & Data
- [ ] Point forms to `forms/<formId>/submissions`
- [ ] Verify rules allow `create` for signed-in (anonymous or authenticated, per your policy)
- [ ] Remove font choice from blog/new 


9) Optional
- [ ] Implement sign-out button that calls `/api/session` (DELETE) and `firebase.auth().signOut()`
- [ ] Add password reset via `sendPasswordResetEmail`
