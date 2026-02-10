# GGX Invoice Manager

A modern React application for Go Global Express logistics management. This system handles real-time rate calculations, invoice generation, and PDF/Label printing.

## Features

- **Smart Rate Engine**: Auto-calculates freight based on weight (Actual vs Volumetric) and destination rules.
- **AI Scanning**: Upload an image of a label or handwritten note to auto-fill shipment details using Google Gemini.
- **PDF Generation**: Generates A4 invoices and 4x6 shipping labels instantly.
- **WhatsApp Integration**: One-click sharing of invoice details to customers.
- **Cloud Sync**: (Optional) Syncs invoice history to Google Sheets.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for GitHub Pages deployment.

1. Update `package.json` with your homepage URL:
   ```json
   "homepage": "https://<username>.github.io/<repo-name>"
   ```
2. Run deployment script:
   ```bash
   npm run deploy
   ```
