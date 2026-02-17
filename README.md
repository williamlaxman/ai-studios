# Acne Away - AI Diagnostic Research Tool

Acne Away is a web-based application utilizing Computer Vision (YOLOv11 via Roboflow) and Generative AI (Google Gemini) to detect acne types and provide research-based skincare insights.

![App Screenshot](https://via.placeholder.com/800x400?text=Acne+Away+Dashboard)

## Features

*   **Real-time Object Detection**: Identifies Pustules, Blackheads, Papules, and Whiteheads.
*   **AI Analysis**: Uses Google Gemini to interpret detection results and provide skincare context.
*   **Visual Mapping**: Draws bounding boxes and confidence scores directly on the patient image.
*   **Statistics Dashboard**: Tracks detection counts and model confidence.

## Tech Stack

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS (CDN), Custom CSS
*   **AI/ML**: Roboflow Inference API, Google Gemini API

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/acne-away.git
    cd acne-away
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

## Configuration

The application comes pre-configured with a default Roboflow model.

### API Keys
To use the Generative AI features, you may need to supply a Google Gemini API Key in the application code or environment variables.

To change the Roboflow Model:
1.  Click the **Settings (Gear Icon)** in the top right of the application.
2.  Enter your Roboflow Private Key and Model ID.

## Disclaimer

**Scientific Support Panel**: Research funded through Sustainable Development Goals Initiative.
**Medical Disclaimer**: This tool is for diagnostic assistance and research evaluation purposes only. It does not replace professional medical advice.
