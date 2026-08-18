# IVY HOUSE MARKETING — Static Firebase + GitHub/Vercel

A no-Node/no-npm marketplace starter for students to advertise products and services.

## What this version includes

- Customer and Advertiser registration/login
- Role-based dashboards
- Advertiser profile and business progress
- Goods/services adverts
- Location, contact/WhatsApp, price in USD/ZIG
- Product/service image and WhatsApp QR upload
- Delivery fee or free delivery
- $0.05 USD / 3-day advertising subscription workflow
- EcoCash recipient: 263785932494
- Payment reference submission for admin verification
- Automatic client-side expiry/locking logic
- Customer search and category filters
- Advertiser profile visibility
- Cart for goods
- Messaging area foundation
- Maroon, yellow, orange, black, white and cyan branding
- Uploaded Ivy House marketplace images already included
- Firebase CDN imports — NO Node.js and NO npm install

## 1. Create the Firebase project

In Firebase Console:

1. Create/open your Ivy House Marketing project.
2. Enable Authentication -> Sign-in method -> Email/Password.
3. Create Firestore Database.
4. Create Storage.
5. Add a Web App under Project settings -> Your apps.
6. Copy the Firebase web configuration.

Open `firebase-config.js` and replace the PASTE_ values.

## 2. Firestore

Use the rules in `firestore.rules`.

Create these collections naturally through the app:
- users
- adverts
- payments

For admin payment verification, create a user document:
`users/{adminUid}`

with:
`role: "admin"`

The admin dashboard is intentionally not exposed to ordinary users. The next stage can add a dedicated admin panel for approving payments, locking/unlocking adverts and viewing revenue.

## 3. Storage

Use `storage.rules`.

The app stores advert images under:
`adverts/{userId}/...`

## 4. Run it locally

No Node is required.

Because browser modules can be restricted when opening an HTML file directly with `file://`, use one of these:

- VS Code Live Server extension, then open the generated local URL.
- GitHub Pages after pushing the folder.
- Vercel after importing the GitHub repository.

You do NOT need `npm install`.

## 5. GitHub

Create a repository, for example:
`ivy-house-marketing`

Upload the whole folder contents. Do not upload service-account private keys.

## 6. Vercel

Import the GitHub repository into Vercel.

Framework preset: Other / static site.
Build command: leave empty.
Output directory: `.`

The site is plain HTML/CSS/JS, so Vercel does not need Node to build it.

## Important payment note

The $0.05 payment flow in this starter records a payment reference for administrator verification. It does NOT pretend to automatically verify EcoCash payments. Automatic payment verification requires a real payment provider/API integration and secure server-side credentials.

## Recommended next build stage

Add:
- Admin dashboard
- Admin payment approval buttons
- Automatic 3-day `expiresAt` extension after approval
- Proper Firestore real-time chat
- Customer/seller profile pages
- Reviews and ratings
- Seller business page showing all active adverts
- WhatsApp deep links
- Better cart/order records
- Revenue tracking
- Optional map/live-location support
- PWA/mobile install support
