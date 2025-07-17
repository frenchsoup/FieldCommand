# FieldCommand: Baseball Defense Planner

FieldCommand is a web app for planning baseball defensive strategies. Position players, draw plays, add notes, and save your work. Designed for coaches and teams, it works great on desktop, tablet, and mobile.

## Features

- Drag and drop player markers on a baseball field
- Draw solid and dotted lines to illustrate plays (Premium)
- Save and load custom defensive plays (Premium)
- Add notes to each play (Premium)
- Email gate for free trial access
- Premium features unlock saving, drawing, and advanced tools
- Responsive design for desktop, tablet, and mobile
- Secure authentication and cloud sync via Firebase
- Stripe integration for premium upgrades

## Technologies

- [Preact](https://preactjs.com/) for UI
- [Firebase](https://firebase.google.com/) for authentication and Firestore database
- [Stripe](https://stripe.com/) for payments
- [PicoCSS](https://picocss.com/) for styling
- Google Analytics (enabled in production)
- Strict Content Security Policy (CSP)

## Getting Started (Local Development)

### Prerequisites

- [Python 3](https://www.python.org/) or [Node.js](https://nodejs.org/) (both are pre-installed in GitHub Codespaces)

### Running Locally

1. **Clone or open the repo in Codespaces or locally.**
2. **Start a local web server:**

   Using Python 3:
   ```sh
   python3 -m http.server 8000
   ```
   Or using Node.js:
   ```sh
   npx serve .
   ```

3. **Open your browser and go to:**
   ```
   http://localhost:8000
   ```
   (In Codespaces, use the "Ports" tab and click "Open in Browser" for port 8000.)

### File Structure

- `index.html` — Main HTML file, loads all scripts and styles externally
- `site.webmanifest` — PWA manifest
- `assets/` — Icons and images

### CSP & Security

- No inline `<script>` or `<style>` tags (all JS and CSS are external except for the main app logic)
- Content Security Policy (CSP) is strict for security
- Google Analytics is enabled in production

## Customization

- Update the main script in `index.html` to change UI logic or add integrations (Firebase, Stripe, etc.)
- Update styles in the `<style>` block or add external CSS for custom themes

## Deployment

- Deploy to Netlify, Vercel, GitHub Pages, or any static hosting provider
- Make sure all external scripts and styles are accessible

## Troubleshooting

- If you only see the spinner, check the browser console for errors
- Make sure all scripts are loaded and there are no CSP violations
- For Codespaces, use the provided port preview feature

## License

MIT

---

**Made with Preact, PicoCSS, Firebase, Stripe, and ❤️ for baseball