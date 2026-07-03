# Password Threat Scanner

## Overview

Password Threat Scanner is a client-side web application that analyzes password strength while ensuring complete user privacy. The application performs all computations locally within the browser, eliminating the need for server-side processing and preventing sensitive data from leaving the user's device.

It evaluates password complexity, estimates entropy, calculates brute-force crack times across multiple attack scenarios, detects common password vulnerabilities, and generates stronger password suggestions. The application also uses SHA-256 hashing to identify password reuse without storing passwords in plain text.

live demo:https://github.com/nandhujd32/Passsword-Threat-Scanner

## Features

* Real-time password strength analysis
* Entropy-based security scoring
* Multi-scenario brute-force crack time estimation
* Pattern-based vulnerability detection
* Configurable secure password generator
* SHA-256 hashed password reuse detection
* Responsive dark HUD-inspired user interface
* Fully client-side architecture with zero server communication

## Technologies Used

* HTML5
* CSS3
* Vanilla JavaScript
* Web Crypto API (SHA-256)

## Project Structure

```text
index.html
css/
 └── style.css
js/
 └── script.js
```

* **index.html** – Application structure and interface.
* **css/style.css** – Styling, animations, and responsive design.
* **js/script.js** – Password analysis engine, entropy calculation, crack-time estimation, password generator, hashing, and reuse detection logic.

## Running the Project

No installation, build tools, or external dependencies are required.

Simply open `index.html` in any modern web browser to start using the application.

## Deployment

The project can be deployed using GitHub Pages.

1. Create a GitHub repository and upload the project files while preserving the folder structure.
2. Navigate to **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Choose the `main` branch and the root (`/`) folder.
5. Save the configuration.

After deployment, the application will be available at:

```text
https://<your-username>.github.io/<repository-name>/
```

## Privacy and Security

The application is designed with a privacy-first approach.

* All password analysis is performed locally in the browser.
* No password data is transmitted to external servers.
* Password reuse detection uses SHA-256 hashing instead of storing plain-text passwords.
* No backend services or databases are required.

## Current Limitations

* Scan history and password reuse data exist only in memory and are cleared when the page is refreshed.
* Internet access is required on the first load to retrieve Google Fonts (Orbitron, Rajdhani, and Share Tech Mono).

## Future Improvements

* Persistent encrypted browser storage
* Password breach detection using privacy-preserving APIs
* Advanced password policy customization
* Exportable security reports
* Additional accessibility and UI enhancements

## Conclusion

Password Threat Scanner demonstrates how secure and privacy-focused web applications can be built using modern browser technologies without relying on backend infrastructure. By combining password analysis, entropy evaluation, vulnerability detection, crack-time estimation, and secure hashing into a lightweight client-side solution, the project emphasizes both usability and user privacy.
