# Image Upload Testing App

A simple, self‑contained application to test image upload and deletion with strict IP whitelist protection.

## Overview

* **Purpose**: Demonstrate secure image handling and IP‑restricted access.
* **Whitelist**: Only requests from `20.218.226.24` (plus `127.0.0.1` in development) are allowed.
* **Storage**: Images are kept in memory and cleared on server restart.

## Features

* Upload up to **5 images** (JPEG, PNG, GIF, WebP), **5 MB** max each.
* View a gallery of uploaded images in real time.
* Delete individual images with confirmation.
* Health check endpoint (`/health`) for service status.

## Quick Start

1. **Install**

   ```bash
   npm install
   ```
2. **Run (dev)**

   ```bash
   npm run dev
   ```
3. **Deploy**

   * Push to GitHub and connect your repo to Vercel.
   * Set build: `npm run build`, output: `public`, install: `npm install`.

## Access & API

| Method | Endpoint          | Description     | Public? |
| ------ | ----------------- | --------------- | ------- |
| GET    | `/`               | Front‑end       | No      |
| GET    | `/health`         | Service status  | Yes     |
| GET    | `/api/images`     | List images     | No      |
| POST   | `/api/upload`     | Upload images   | No      |
| DELETE | `/api/images/:id` | Remove an image | No      |

## Error Handling

* **403**: Non‑whitelisted IP.
* **400**: Invalid file type, size, or count.
* **404**: Image not found.

---

*For testing purposes only. Images do not persist across restarts.*
