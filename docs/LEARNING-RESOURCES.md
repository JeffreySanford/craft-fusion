# Learning Resources for Craft Fusion

This guide provides curated resources to help you learn the core technologies used in Craft Fusion.

## 🚀 Getting Started

New to our tech stack? Don't worry! This learning path will guide you through the essentials:

### 1. Core Technologies

#### Angular (Frontend)

- 📚 [Official Angular Tutorial](https://angular.io/tutorial) - Start here!
- 📚 [Angular Material Documentation](https://material.angular.io/components/categories)
- 🎬 [Angular Crash Course](https://www.youtube.com/watch?v=3dHNOWTI7H8) - Quick intro video
- 💡 **Project Practice**: Examine our `craft-web` components for real-world examples

#### NestJS (Backend)

- 📚 [NestJS Official Documentation](https://docs.nestjs.com/)
- 🎬 [NestJS for Beginners](https://www.youtube.com/watch?v=F_oOtaxb0L8)
- 💡 **Project Practice**: Look at our services in `craft-nest/src/services`

#### Go (Backend)

- 📚 [Go by Example](https://gobyexample.com/) - Practical code examples
- 📚 [Tour of Go](https://tour.golang.org/) - Interactive tutorial
- 💡 **Project Practice**: Study our handlers in `craft-go/internal/handlers`

### 2. Design Patterns & Architecture

- 📚 [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- 📚 [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- 💡 **Project Practice**: See how we separate layers in both backend implementations

### 3. Style & CSS

- 📚 [Material Design 3 Guidelines](https://m3.material.io/)
- 📚 [SCSS Basics](https://sass-lang.com/guide)
- 💡 **Project Practice**: Explore our styles in `craft-web/src/styles`

## 📊 Visualizing the Tech Stack

```ascii
        ┌─────────────────────┐
        │     craft-web       │
        │  Angular + Material │
        └──────────┬──────────┘
                   │
                   │ HTTP/WebSocket
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────┴────────┐   ┌────────┴───────┐
│   craft-nest   │   │    craft-go    │
│     NestJS     │   │      Go        │
└───────┬────────┘   └────────┬───────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────┴──────────┐
        │      MongoDB        │
        └─────────────────────┘
```

## 🧠 Concept Glossary

| Term | Explanation | Where to See It |
|------|-------------|----------------|
| Component | Reusable UI element in Angular | `craft-web/src/app/shared/components` |
| Service | Business logic container | Throughout all applications |
| Middleware | Request/response processor | `craft-go/internal/middleware` |
| Repository | Data access abstraction | `craft-nest/src/repositories` |
| Pipe | Data transformation in Angular | `craft-web/src/app/shared/pipes` |

## 💪 Growth Path

As you become more comfortable, challenge yourself with:

1. **Add a small feature**: Start with a UI enhancement or API endpoint
2. **Fix a bug**: Look for issues marked with `good-first-issue`
3. **Improve tests**: Increase code coverage in an area you understand
4. **Document something unclear**: Your fresh perspective helps everyone!

## 🤝 Learning Together

- Schedule a pair programming session with senior devs
- Join our bi-weekly tech learning sessions
- Post questions in the `#learning` channel
- Share resources you find helpful!

Remember: Everyone on the team is still learning. Each day is an opportunity to grow your skills!
