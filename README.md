# 🎨 Portfolio

<p align="center">
  <img src="apps/craft-web/src/assets/craft-fusion-logo.png" alt="Craft Fusion Logo" width="200"/>
  <br>
  <em>A modern, patriotic web development monorepo blending Angular, NestJS, and Go with best-in-class design.</em>
</p>

<p align="center">
  <a href="https://jeffreysanford.us"><img src="https://img.shields.io/badge/Live%20Demo-jeffreysanford.us-blue?style=for-the-badge" alt="Live Demo"></a>
  <a href="https://jeffreysanford.us/api/swagger"><img src="https://img.shields.io/badge/API%20Docs-Swagger-green?style=for-the-badge" alt="API Documentation"></a>
  <a href="https://angular.io/"><img src="https://img.shields.io/badge/Angular-19-DD0031?style=for-the-badge&logo=angular" alt="Angular 19"></a>
  <a href="https://nestjs.com/"><img src="https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS"></a>
  <a href="https://golang.org/"><img src="https://img.shields.io/badge/Go-1.21-00ADD8?style=for-the-badge&logo=go" alt="Go"></a>
</p>

---

## 🏅 Craft Fusion Badges

<p align="center">
  <img src="https://img.shields.io/badge/RxJS%20Streams-100%25-purple?style=for-the-badge&logo=rxjs" alt="100% RxJS Streams Badge">
  <img src="https://img.shields.io/badge/Real--Time%20Ready-WebSockets-red?style=for-the-badge&logo=socketdotio" alt="WebSocket Real-Time Badge">
  <img src="https://img.shields.io/badge/Patriotic%20Theme-Enabled-0033A0?style=for-the-badge&logo=united-states" alt="Patriotic Theme Badge">
  <img src="https://img.shields.io/badge/NX%20Workspace-Enterprise%20Grade-04C9C8?style=for-the-badge&logo=nx" alt="NX Enterprise Grade Badge">
  <img src="https://img.shields.io/badge/Accessibility%20First-WCAG2.1-ff69b4?style=for-the-badge" alt="Accessibility Badge">
  <img src="https://img.shields.io/badge/Documentation-Living%20System-blueviolet?style=for-the-badge&logo=readme" alt="Living Documentation Badge">
</p>

---

## 🔭 Overview

**Craft Fusion** is a modern, enterprise-grade NX monorepo blending Angular, NestJS, and Go backends — themed proudly with American spirit.

🌐 **Live Demo:** [jeffreysanford.us](https://jeffreysanford.us)  
📘 **Swagger Docs:** [API Swagger UI](https://jeffreysanford.us/api/swagger)

---

## 🛠 Tech Stack

- **Monorepo Management:** NX
- **Frontend:** Angular 19 with Material Design 3 (Patriotic Theme)
- **Backend Services:** NestJS & Go
- **Database:** (none required)
- **Real-Time:** WebSockets
- **Documentation:** Markdown + Swagger + Live SVGs

---

## 🧩 Applications

### 🎭 craft-web (Angular Frontend)

- Angular Material 3 UI
- WebSocket streaming
- Accessibility-first, responsive patriotic theme

```bash
nx serve craft-web
```

---

### 🪶 craft-nest (NestJS Backend)

- RESTful API
- WebSocket Gateway
- JWT Authentication + RBAC

```bash
nx serve craft-nest
```

---

### 🚀 craft-go (Go Backend)

- High-throughput parallel API
- Large-scale data optimization
- Mirrors NestJS endpoints for testing

```bash
nx serve craft-go
```

---

## 🕰️ Memorial Timeline Flow

<p align="center">
  <img src="apps/craft-web/src/assets/documentation/main/timeline-flow.svg" alt="Timeline Data Flow" width="800"/>
</p>

---

## 🔴 Live Update Architecture

<p align="center">
  <img src="apps/craft-web/src/assets/documentation/main/live-update-architecture.svg" alt="Live Update Streaming" width="600"/>
</p>

---

## Crafted in the USA in Legendary North Dakota

<p align="center">
  <img src="apps/craft-web/src/assets/documentation/main/crafted-in-usa-badge.svg" alt="Crafted in USA Badge" width="300"/>
</p>

---

## 📚 Documentation

| Document | Description |
|:---------|:------------|
| WEBSOCKET-BEHAVIOR.md | WebSocket Architecture |
| STATE-MANAGEMENT.md | App State Patterns |
| AUTHENTICATION.md | Auth & Authorization |
| API-SERVICE.md | API Architecture |
| See more | Located in `/documentation/` |

---

## � Deployment (Scripts)

Common flows using the repo’s deployment scripts:

- Full deploy (sequential backend then frontend):

  ```bash
  bash scripts/deploy-all.sh
  ```

- Performance-friendly and clean build:

  ```bash
  bash scripts/deploy-all.sh --power --full-clean
  ```

- SSL/WSS setup control:

  ```bash
  # Auto-run SSL/WSS without prompt
  bash scripts/deploy-all.sh --yes-ssl

  # Skip SSL/WSS
  bash scripts/deploy-all.sh --skip-ssl
  ```

- Frontend checks against a custom domain:

  ```bash
  DEPLOY_HOST=example.com bash scripts/deploy-frontend.sh
  ```

See the detailed guide: `documentation/deployment-digital-ocean.md` and the quick guide: `documentation/SIMPLE-DEPLOYMENT.md`.

---

## �📈 Performance Testing

```bash
curl http://localhost:3000/api/records/generate?count=100000
curl http://localhost:4000/records/generate?count=100000
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](documentation/CONTRIBUTING.md).

---

## 👨‍💻 About the Author

**Jeffrey Sanford** — Full-Stack Architect and American Patriot 🇺🇸  
🌐 [jeffreysanford.us](https://jeffreysanford.us)  
💼 [LinkedIn](https://linkedin.com/in/jeffreysanford)  
🐦 [Twitter](https://twitter.com/jeffreysanford)  
📧 [jeffreysanford@gmail.com](mailto:jeffreysanford@gmail.com)

---

## 📜 License

> WITH LOVE License: freely use, modify, and distribute with kindness and patriotism.

---

<p align="center">
🛡️ Built for Freedom • 🚀 Designed for Scale • 🖋️ Crafted with Care
</p>