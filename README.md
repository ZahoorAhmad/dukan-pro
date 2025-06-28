# Dukaan Pro - POS & Inventory Management

Dukaan Pro is a comprehensive, offline-first Point of Sale (POS) and inventory management application designed for small to medium-sized shopkeepers. It allows users to manage their shop's customers, stock, and suppliers efficiently with a clean, intuitive interface. All data is stored locally in the browser using IndexedDB, ensuring the application is fully functional even without an internet connection.

## ✨ Features

- **📊 Dashboard:** Get a quick overview of your shop's performance, including total inventory value, realized profit, customer receivables (udhaar), and supplier payables. Includes a monthly performance chart.
- **🛒 Point of Sale (POS):** A fast and intuitive interface for making sales. Add products to a cart, select customers, and handle both paid and credit (`udhaar`) transactions.
- **📦 Stock Management:** Keep track of all your products. Add new items, update stock levels, set purchase and selling prices, and restock inventory.
- **👥 Customer Management:** Manage your customer database, track their outstanding balances (`udhaar`), and record payments received.
- **🚚 Supplier Management:** Maintain a list of your suppliers, track how much you owe them, and record payments made.
- **🧾 Sales Reports:** View a detailed history of all sales transactions, with the ability to inspect individual sale items and profits.
- **🔒 Offline First:** The application is built to work completely offline. All data is stored persistently in your browser, so your business keeps running even if your internet isn't.

## 🛠️ Tech Stack

- **Frontend:** React.js, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Dexie.js (a wrapper for browser IndexedDB)
- **Deployment:** No build step required. Can be run from any simple static file server.

## 🚀 Getting Started & How to Run

This application is designed to be extremely simple to run. There is no complex build process or installation required.

1. **Download the Files:**
   Make sure you have all the project files in a single folder:
    - `index.html`
    - `index.tsx`
    - `App.tsx`
    - `types.ts`
    - `db.ts`
    - `metadata.json`
    - `README.md`

2. **Serve the Files:**
   You need a simple local web server to run the application, as browser security policies prevent `file://` access for modules and database storage. The easiest way is to use `npx`.

    - Open your terminal or command prompt.
    - Navigate into the project folder.
    - Run the following command:
      ```bash
      npx serve .
      ```
    - This will start a local server and give you a URL (usually `http://localhost:3000`).

3. **Open in Browser:**
   Open the provided URL in your web browser to start using the application. All your data will be automatically saved in the browser for your next session.
