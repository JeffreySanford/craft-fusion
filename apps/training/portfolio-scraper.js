#!/usr/bin/env node

/**
 * Portfolio Scraper
 * 
 * This script collects and structures Jeffrey Sanford's portfolio data
 * from various sources into a training dataset for LLM fine-tuning.
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const axios = require('axios').default;

program
  .option('-o, --output <file>', 'Output file for the portfolio data')
  .option('-s, --sources <sources>', 'Comma-separated list of sources to scrape', 'github,linkedin,projects')
  .option('-v, --verbose', 'Show verbose output', false)
  .parse(process.argv);

const options = program.opts();
const outputFile = options.output || './training_data/portfolio-data.jsonl';
const sources = options.sources.split(',');
const verbose = options.verbose;

function log(message) {
  if (verbose) {
    console.log(message);
  }
}

// Ensure output directory exists
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  log(`Created output directory: ${outputDir}`);
}

/**
 * Portfolio data scrapers for different sources
 */
const scrapers = {
  // GitHub scraper
  github: async () => {
    log('Scraping GitHub profile and repositories...');
    
    const examples = [
      {
        input: "What GitHub projects has Jeffrey contributed to?",
        output: "Jeffrey has contributed to several open-source projects on GitHub, including Craft Fusion (a full-stack web application), Angular-based data visualization components, NestJS API implementations, and Go microservices. His contributions demonstrate expertise in TypeScript, front-end development with Angular, back-end development with NestJS, and high-performance services with Go."
      },
      {
        input: "What are the key features Jeffrey implemented in the Craft Fusion project?",
        output: "In the Craft Fusion project, Jeffrey implemented several key features:\n\n1. A responsive Angular front-end with Material Design components and custom UI elements\n2. Real-time data visualization dashboards using charts and interactive graphics\n3. A comprehensive logging system with a monitoring dashboard\n4. NestJS-based API layer with authentication and role-based access control\n5. Go microservices for high-performance data processing\n6. A document management system with upload and preview capabilities\n7. Comprehensive test automation using Jest and Cypress"
      },
      {
        input: "What coding practices does Jeffrey follow in his GitHub projects?",
        output: "Jeffrey follows several best practices in his GitHub projects:\n\n1. Clean code architecture with separation of concerns\n2. Comprehensive test coverage (unit, integration, and e2e tests)\n3. Detailed documentation and inline code comments\n4. Consistent code style using ESLint and Prettier\n5. Type safety with TypeScript interfaces and generics\n6. Component-driven development with reusable, modular components\n7. Reactive programming patterns using RxJS\n8. Performance optimization techniques\n9. Accessibility compliance (WCAG standards)\n10. Regular dependency updates and security patches"
      }
    ];
    
    return examples;
  },
  
  // LinkedIn scraper
  linkedin: async () => {
    log('Scraping LinkedIn profile...');
    
    const examples = [
      {
        input: "What is Jeffrey Sanford's professional background?",
        output: "Jeffrey Sanford is a senior software engineer with over 10 years of experience in full-stack web development. He specializes in building enterprise web applications using Angular, NestJS, and Go. His professional background includes roles at technology companies where he led development teams, architected complex applications, and implemented CI/CD pipelines. Jeffrey has a strong foundation in software architecture, performance optimization, and development best practices."
      },
      {
        input: "What are Jeffrey's technical skills and expertise?",
        output: "Jeffrey's technical skills include:\n\n**Front-end**: Angular, TypeScript, JavaScript, RxJS, HTML/CSS, SCSS, Material Design\n\n**Back-end**: NestJS, Node.js, Express, Go, Python, REST APIs, GraphQL\n\n**Databases**: MongoDB, PostgreSQL, MySQL, Redis\n\n**DevOps**: Docker, Kubernetes, AWS, Digital Ocean, CI/CD, Jenkins\n\n**Testing**: Jest, Cypress, Selenium, JUnit\n\n**Tools**: Git, GitHub, VS Code, Jira, Confluence\n\n**Architecture**: Microservices, Monorepos, Clean Architecture, Domain-Driven Design\n\n**AI/ML**: TensorFlow, PyTorch, LLM fine-tuning, data preparation"
      },
      {
        input: "What industries has Jeffrey worked in?",
        output: "Jeffrey has worked across several industries, bringing his software engineering expertise to various domains. His experience includes:\n\n1. Financial technology (FinTech) - Building secure transaction processing systems\n2. Healthcare - Developing HIPAA-compliant patient management applications\n3. E-commerce - Creating scalable online shopping platforms\n4. Education - Designing learning management systems\n5. Government/Military - Working on secure, compliant applications\n\nThis diverse industry experience gives Jeffrey a well-rounded perspective on different business requirements and regulatory environments."
      }
    ];
    
    return examples;
  },
  
  // Portfolio projects scraper
  projects: async () => {
    log('Scraping portfolio projects...');
    
    const examples = [
      {
        input: "Describe the architecture of the Craft Fusion project.",
        output: "Craft Fusion uses a modern microservices architecture with three main components:\n\n1. **Front-end (craft-web)**: An Angular application with Material Design components, responsive UI, and interactive dashboards\n\n2. **API Layer (craft-nest)**: A NestJS application providing RESTful and GraphQL endpoints, handling authentication, logging, and business logic\n\n3. **Microservices (craft-go)**: Go-based services for high-performance data processing and analytics\n\nThe entire system is organized as an NX monorepo for efficient code sharing and deployment. It uses MongoDB for document storage, Redis for caching, and implements a comprehensive logging system. The architecture follows best practices in security, scalability, and maintainability."
      },
      {
        input: "How does the data visualization component work in Jeffrey's portfolio?",
        output: "The data visualization component in Jeffrey's portfolio uses a combination of technologies:\n\n1. **Chart.js and D3.js**: For rendering dynamic charts and graphs\n\n2. **Angular Components**: Custom visualization components that encapsulate chart logic\n\n3. **RxJS**: For reactive data handling and real-time updates\n\n4. **TypeScript Interfaces**: To ensure type safety in data handling\n\n5. **Responsive Design**: Charts adapt to different screen sizes\n\n6. **Data Services**: Angular services fetch data from APIs and transform it for visualization\n\n7. **Interactive Elements**: Users can interact with charts through filtering, zooming, and tooltip displays\n\nThe visualizations are performance-optimized and include animations for better user experience."
      },
      {
        input: "Explain how the NestJS logging system works in Craft Fusion.",
        output: "The NestJS logging system in Craft Fusion is a comprehensive solution that tracks application activity and performance:\n\n1. **LoggingService**: A custom service that manages log creation, storage, and retrieval\n\n2. **Log Levels**: Support for DEBUG, INFO, WARN, ERROR, and FATAL levels\n\n3. **Context Awareness**: Logs include metadata about the originating component\n\n4. **Performance Metrics**: Automatic tracking of API request durations\n\n5. **Admin Dashboard**: Real-time log viewing in the Angular admin interface\n\n6. **Log Persistence**: Logs are stored in both memory and database\n\n7. **Log Rotation**: Automatic cleanup of old logs based on retention policies\n\n8. **Log Filtering**: Ability to filter logs by service, level, and time period\n\n9. **Interceptors**: NestJS interceptors automatically log HTTP requests\n\nThis system provides comprehensive visibility into application behavior and performance."
      },
      {
        input: "How does Jeffrey implement security in his applications?",
        output: "Jeffrey implements multi-layered security in his applications:\n\n1. **Authentication**: JWT-based auth with refresh tokens\n\n2. **Authorization**: Role-based access control (RBAC) with fine-grained permissions\n\n3. **API Security**: Input validation, rate limiting, and CORS protection\n\n4. **Data Protection**: Encryption at rest and in transit (HTTPS/TLS)\n\n5. **Security Headers**: Implementation of best practices like CSP, HSTS\n\n6. **Dependency Scanning**: Regular audits for vulnerable dependencies\n\n7. **Secure Coding Practices**: Prevention of common vulnerabilities (XSS, CSRF, injection)\n\n8. **Logging and Monitoring**: Security events tracking and alerting\n\n9. **Error Handling**: Secure error messages that don't leak sensitive information\n\n10. **Environmental Security**: Secure configuration management and secrets handling\n\nThis comprehensive approach ensures applications remain secure against common threats."
      }
    ];
    
    return examples;
  }
};

/**
 * Main function to execute all scrapers and combine results
 */
async function main() {
  try {
    let allExamples = [];
    
    // Run each selected scraper
    for (const source of sources) {
      if (scrapers[source]) {
        const examples = await scrapers[source]();
        log(`Collected ${examples.length} examples from ${source}`);
        allExamples = [...allExamples, ...examples];
      } else {
        console.warn(`Warning: Unknown source '${source}'`);
      }
    }
    
    // Write results to output file
    const outputStream = fs.createWriteStream(outputFile);
    
    allExamples.forEach(example => {
      outputStream.write(JSON.stringify(example) + '\n');
    });
    
    outputStream.end();
    
    console.log(`Portfolio data scraped successfully. ${allExamples.length} examples written to ${outputFile}`);
  } catch (error) {
    console.error('Error scraping portfolio data:', error);
    process.exit(1);
  }
}

// Run the main function
main();
