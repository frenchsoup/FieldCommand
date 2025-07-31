# FieldCommand: Baseball Defense Planner

FieldCommand is a lightweight, web-based tool designed for baseball coaches to plan and visualize defensive strategies. Easily drag players, draw plays, and save strategies for your team. Built as a proof-of-concept, we’re actively seeking feedback to improve the app for the baseball coaching community.

## Live Demo

Try FieldCommand at: [https://fieldcommand.netlify.app/](https://fieldcommand.netlify.app/)

![Email Gate Screenshot](./email-gate.png)  
*Enter your email to unlock FieldCommand’s planning tools.*

![Main App Screenshot](./app.png)  
*Drag players and draw plays on an interactive baseball field.*

## Features

- **Drag-and-Drop Players**: Position players (e.g., pitcher, catcher, outfielders) on a virtual baseball field.
- **Draw Plays**: Create solid or dotted lines to map out defensive strategies (5-minute demo mode).
- **Save and Load Plays**: Store plays locally and reload them for quick access.
- **Mobile-Friendly**: Works seamlessly on desktop and mobile devices.
- **Privacy-First**: Email submissions are hashed for analytics, ensuring GDPR/CCPA compliance.

## Usage

1. **Access the App**: Visit [fieldcommand.netlify.app](https://fieldcommand.netlify.app/).
2. **Email Gate**: Enter a valid email to unlock the app (no credit card required). Your email is anonymized for analytics.
3. **Plan Your Strategy**:
   - Drag players to reposition them on the field.
   - Enable "Solid Line" or "Dotted Line" mode to draw plays.
   - Save plays by entering a name and clicking "Save Play."
   - Load saved plays from the sidebar or reset to default positions.
4. **Share Feedback**: Join the discussion on [r/baseballcoaching](https://reddit.com/r/baseballcoaching) or [r/homeplate](https://reddit.com/r/homeplate), or open a GitHub Issue.

## Analytics

FieldCommand uses Google Analytics (GA4) to track user engagement, such as page views and email submissions, in a privacy-compliant way:
- **Email Gate**: Tracked as `/email-gate` (initial landing page).
- **Main App**: Tracked as `/app` (after email submission).
- Email addresses are hashed before analytics tracking to ensure privacy.

This helps us understand user flow and improve the app. No personally identifiable information (PII) is stored in analytics.

## Development

### Tech Stack
- **HTML/CSS/JavaScript**: Core structure and interactivity.
- **React (via CDN)**: Manages dynamic UI components.
- **Tailwind CSS**: Responsive, modern styling.
- **Google Analytics (GA4)**: Tracks anonymized user interactions.
- **Netlify**: Hosts the app as a static site.
- **GitHub**: Source code management and deployment pipeline.