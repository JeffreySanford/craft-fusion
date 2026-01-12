```markdown
# Changelog

All notable changes to the Craft Fusion project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Format Guidelines

This changelog follows the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

1. Most recent changes appear at the top (reverse chronological order)
2. Changes are grouped by type: Added, Changed, Fixed, Removed, etc.
3. All notable changes are documented, not just bug fixes
4. Unreleased changes appear in the "Unreleased" section at the top
5. When releasing a version, move items from "Unreleased" to a new version heading
6. Version headings include release date in ISO format: [x.y.z] - YYYY-MM-DD
7. Each change should be described in plain language with technical context

*Note: Please follow this format when updating the changelog. Keep entries concise, meaningful, and organized by type.*

## [Unreleased]

_Updated from Inanna (master) on 2025-04-28_

### Added
- implement TimelineService for event management with CRUD operations and logging (timeline)
- Add comprehensive documentation for all services in Craft Fusion project
- Implement WebSocket connection behavior and user state management
- refactor craft-nest application structure, enhance health check endpoint, and integrate socket functionality
- integrate socket.io for real-time communication
- Revise DigitalOcean deployment documentation and scripts
- enhance API routes for frontend compatibility and improve state management documentation
- add frontend-compatible routes for user records API
- add comprehensive contribution and deployment guides, including Ollama setup and Material Design 3 migration strategy
- update documentation with 'Last Updated' timestamps and add Markdown standards guide
- enhance documentation sections across multiple files and improve logger display component with time tracking
- add MatTooltipModule to enhance UI tooltips and improve logging details sanitization in logger service
- update .gitignore to include additional build and distribution directories
- remove unused font and image assets to optimize project size
- implement Material Design 3 migration with design tokens, updated README, and new animation keyframes
- enhance footer layout with separate logo sections and add new animation keyframes; update README with component alignment standards
- update style refactoring plan with vibrant patriotic colors and enhance README documentation
- add core styles, animations, and scrollbar customization; integrate style dictionary for design tokens
- refactor LoggerService constructor to eliminate circular dependency
- add training infrastructure with requirements, package.json, and dataset merging script
- remove remove_background.bat script to streamline image processing workflow
- remove package.json from craft-nest; add comprehensive documentation for installation, testing, and Ollama setup
- enhance logger display styles and update admin module imports for better component management
- update user state service to fetch all users without 'api/' prefix
- update SCSS to use color.adjust for improved color manipulation; refactor API endpoints in record service for consistency
- update logging controller route; enhance user tracking service and add user activity tracking; implement user service with user retrieval methods; expand user interface with additional fields; improve metrics interceptor logging
- add logging module with logging service and controller; integrate logging into recipes module and service
- implement footer expansion state management; enhance layout responsiveness and footer component interactions
- enhance logger display component with auto-scroll and log filtering options; update logger service to improve service call metrics
- enhance logger display styles and improve header component with user menu animations and transitions
- initialize logger display with default log entries for error, warn, info, and log levels
- update fetch paths for ping.txt, enhance logger service to exclude CPU Load messages, and improve logger display with sorting functionality and detailed log entries
- remove debugger statements from various services and components; enhance logger display with categorized log entries for better readability
- add logger display component and integrate with admin module; enhance header styling for logged-in state and implement admin guard for route protection
- implement auditing and authentication services; add authorization checks and enhance admin state management
- refactor recipe model and service; update countryOfOrigin to countryCode, enhance styling, and add new recipe service tests
- enhance recipe component with error handling, loading state, and default recipe display; improve layout and styling for better user experience
- integrate Finance module and enhance financial component with improved legend, status display, and chart controls
- enhance tile layout and styling for data visualizations, including improved handling of large and small charts
- add status message display and enhance legend functionality in data visualizations components
- integrate MapboxService into data visualizations module and enhance FireAlertComponent tests
- enhance responsive design of record list with dynamic column adjustments and improved styling for various screen sizes
- enhance record list and detail components with improved animations, mouse tracking, and phone number formatting
- enhance record list with improved expand/collapse animations and new flag wave effect for selected elements
- improve chart responsiveness and layout with minimum height, overflow handling, and enhanced resizing logic
- enhance chart components with responsive sizing, fixed heights, and improved styling for better readability
- enhance chart responsiveness and improve layout with new resizing logic and styling adjustments
- add SidebarStateService to manage sidebar state and enhance data visualizations component with active chart tracking
- refactor data visualizations layout and add responsive sizing for chart items
- integrate Quantum Fisher Information visualization and enhance equation rendering with KaTeX
- add animated directives module and integrate Katex for mathematical rendering
- add model selector component, update styles, and enhance image visibility handling
- update sidebar and footer styles, enhance myth content rendering, and implement theme variables
- enhance myth content processing with improved regex matching and logging, update styles for myth sections
- implement user state management with visit length and visited pages tracking
- update sidebar height, enhance button styles, and add background video support
- remove unused theme styles, update font handling, and configure stylelint and eslint
- add stylelint configuration and themed button styles for light and dark themes
- enhance mini-fab button styles for light and dark themes, and clean up unused styles
- enhance document parsing with numbered text detection and update image visibility in book component
- adjust max-width for book component elements and add padding to toolbar in light theme
- update toolbar styling in light theme with padding adjustments
- add book theme styles and enhance chat component with improved response handling
- enhance book component styling with vibrant colors and improved layout adjustments
- add file upload and save functionality in book component, improve layout and styling
- reorganize toolbar layout in book component and enhance font selection styling
- add font selection and size adjustment in book component, remove unused doc-parse service
- enhance book component with markdown preview functionality and improve file handling logic
- enhance book component with read-only mode and markdown preview toggle, add safe HTML pipe for rendering
- enhance book component styling and improve editor height, add smooth scrolling for headers
- add current title tracking and improve chapter parsing in book component
- enhance book component with improved document selection and outline display
- enhance document handling by allowing multiple file uploads and updating opened documents management
- update book component to improve document display and enhance markdown rendering options
- refactor file upload and user state services to use ApiService, improve document handling in user state
- enhance ApiService with user state management methods and update post method signature
- refactor user state management methods for clarity and consistency
- remove unused FlightAware API configuration from production environment
- enhance user state management with document color assignment and improve book component styling
- add user module and markdown pipe, enhance chat component with new styling and functionality
- refine chat component styles with improved spacing, padding, and font adjustments
- update chat component styles and enhance message handling with thinking time display
- enhance chat component with dynamic response height adjustment and styling improvements
- implement file upload service, file management module, and chat text splitting pipe
- add document and PDF parsing services, update sidebar and component styles, and add book routing
- add new dataset files and update model loading paths for training application
- add DeepSeek model configuration, tokenizer, and initial dataset files
- add requirements for training and update DeepSeek LoRA fine-tuning script with Hugging Face login
- implement LoRA fine-tuning for DeepSeek model with multi-threaded dataset loading and system performance logging
- add initial dataset files and setup configuration for training application
- improve chat message layout with flexible content and block display
- implement chat module with enhanced UI and routing
- add chat component and deepseek service with routing and styling
- enhance footer and fire alert components with improved styling and layout adjustments
- enhance fire alert component with new header styling and add fly-in animation
- update CORS configuration to allow both www and non-www origins
- simplify CORS configuration by removing localhost origin
- add new API proxy configuration for external service integration
- add scrollbar styling and enhance table wrapper for improved usability
- enhance fire alert component with improved alert display and priority handling
- enhance fire alert component with timezone display and improve time handling
- enhance fire alert component layout with city state display and improve styling for better visibility
- enhance fire alert component with tabbed interface for multiple cities and improve map initialization
- add Alpha Vantage service and controller for stock and crypto data retrieval; refactor data visualization components and update configurations
- implement Finnhub service and controller for stock and crypto data retrieval; refactor data visualization service to utilize Finnhub service
- add new endpoints for fetching flight and airport data in OpenSky service
- add Obsidian executable and update grape masthead styles for improved positioning and visibility
- add ESLint and Stylelint configurations for improved code quality
- add ESLint and Stylelint configurations for improved code quality
- add TypeScript interfaces and environment configurations for improved structure and API integration
- add TypeScript interfaces and environment configurations for improved structure and API integration
- add Jest and Node types to tsconfig for improved type support
- add Jest and Node types to tsconfig for improved type support
- update ecosystem.config.js for craft-go API to use fork mode and disable clustering
- update ecosystem.config.js for craft-go API to use fork mode and disable clustering
- change log level to debug for enhanced logging details
- change log level to debug for enhanced logging details
- update Playwright test setup and add trace report files
- update Playwright test setup and add trace report files
- add Playwright test results and configuration files for e2e testing
- add Playwright test results and configuration files for e2e testing
- update package.json and project.json for Playwright and Angular executors, enhance logging, and remove obsolete runtime.js
- update package.json and project.json for Playwright and Angular executors, enhance logging, and remove obsolete runtime.js
- update .gitignore to include Vite, Vitest, and distribution folders
- update .gitignore to include Vite, Vitest, and distribution folders
- implement drag-and-drop functionality for dashboard tiles and enhance styling
- implement drag-and-drop functionality for dashboard tiles and enhance styling
- remove IonicModule imports from app.module.ts and data-visualizations.module.ts
- remove IonicModule imports from app.module.ts and data-visualizations.module.ts
- add shapefile type definitions and library to package.json
- add shapefile type definitions and library to package.json
- remove deprecated deployment scripts and update default base branch to master
- remove deprecated deployment scripts and update default base branch to master
- enhance proxy configuration and improve logging for production environment
- enhance proxy configuration and improve logging for production environment
- update server listening address to 0.0.0.0 in main.ts
- update server listening address to 0.0.0.0 in main.ts
- update production environment configuration to use 0.0.0.0 as host
- update production environment configuration to use 0.0.0.0 as host
- define development and production environment variables in ecosystem configuration
- define development and production environment variables in ecosystem configuration
- update API configuration for production environment and improve proxy settings
- update API configuration for production environment and improve proxy settings
- enhance SSL handling in main.ts by adding error handling for SSL file reading
- enhance SSL handling in main.ts by adding error handling for SSL file reading
- update ecosystem configuration to use relative paths for scripts and log files
- update ecosystem configuration to use relative paths for scripts and log files
- simplify ecosystem configuration by removing environment variables and standardizing paths
- simplify ecosystem configuration by removing environment variables and standardizing paths
- restructure ecosystem configuration and improve SSL handling in main.ts
- restructure ecosystem configuration and improve SSL handling in main.ts
- add new JavaScript files for ion components and remove outdated versions
- add new JavaScript files for ion components and remove outdated versions
- add new runtime.js file and remove outdated runtime.dac6380cb2b2a567.js
- add new runtime.js file and remove outdated runtime.dac6380cb2b2a567.js
- update output directory and disable service worker in project configurations
- update output directory and disable service worker in project configurations
- update TypeScript configuration path and remove unused Angular service worker
- update TypeScript configuration path and remove unused Angular service worker
- remove ngsw-config and deployment script as they are no longer needed
- remove ngsw-config and deployment script as they are no longer needed
- update GitHub link in footer component to point to the correct repository
- update GitHub link in footer component to point to the correct repository
- remove browserslist file as it is no longer needed for the build system
- remove browserslist file as it is no longer needed for the build system
- update record list component with improved visibility and layout adjustments
- update record list component with improved visibility and layout adjustments
- enhance footer component with dynamic logo links and improved styling
- enhance footer component with dynamic logo links and improved styling
- adjust header width to 100% and refine sidebar margin for improved layout
- adjust header width to 100% and refine sidebar margin for improved layout
- implement user menu in header with dynamic items and action handling
- implement user menu in header with dynamic items and action handling
- enhance sidebar component to highlight active menu items based on router events
- enhance sidebar component to highlight active menu items based on router events
- update API documentation URL to use /api/api-docs path
- update API documentation URL to use /api/api-docs path
- update Swagger setup path and enhance record list component with performance metrics
- update Swagger setup path and enhance record list component with performance metrics
- refactor record generation timing logic and improve time retrieval methods
- refactor record generation timing logic and improve time retrieval methods
- add border-radius to expansion panel in footer styles
- add border-radius to expansion panel in footer styles
- adjust styles for record collection and report components
- adjust styles for record collection and report components
- update API routes to use /api-go prefix and adjust proxy configuration
- update API routes to use /api-go prefix and adjust proxy configuration
- update proxy configuration to change API path from /api/go to /go-api
- update proxy configuration to change API path from /api/go to /go-api
- update project structure and configurations, remove deprecated files, and enhance routing
- update project structure and configurations, remove deprecated files, and enhance routing
- update TypeScript and ESLint configurations, set components as non-standalone
- update TypeScript and ESLint configurations, set components as non-standalone
- export RecordListComponent from TableModule
- export RecordListComponent from TableModule
- update project configurations and TypeScript settings for craft-nest and craft-web applications
- update project configurations and TypeScript settings for craft-nest and craft-web applications
- update project configurations for craft-nest, craft-web, and craft-web-e2e applications, enhancing build and test targets
- update project configurations for craft-nest, craft-web, and craft-web-e2e applications, enhancing build and test targets
- update TypeScript and ESLint configurations, enable Ivy, and remove standalone flags from components
- update TypeScript and ESLint configurations, enable Ivy, and remove standalone flags from components
- update TypeScript configurations, enhance linting rules, and modify controller methods for improved functionality
- update TypeScript configurations, enhance linting rules, and modify controller methods for improved functionality
- restructure craft-web and craft-nest applications with updated polyfills, configurations, and improved layout
- restructure craft-web and craft-nest applications with updated polyfills, configurations, and improved layout
- update TypeScript configurations and enhance OpenSky service with improved error handling
- update TypeScript configurations and enhance OpenSky service with improved error handling
- add initial configuration and polyfills for craft-web application
- add initial configuration and polyfills for craft-web application
- enhance craft-nest and craft-web applications with new configurations and improvements
- enhance craft-nest and craft-web applications with new configurations and improvements
- update CI workflow to use 'main' branch and fetch all branches
- update CI workflow to use 'main' branch and fetch all branches
- update ecosystem configuration and TypeScript settings for improved compatibility and performance
- update ecosystem configuration and TypeScript settings for improved compatibility and performance
- update TypeScript configuration for improved type declaration and module resolution
- update TypeScript configuration for improved type declaration and module resolution
- update nx configuration and package dependencies for improved TypeScript support
- update nx configuration and package dependencies for improved TypeScript support
- remove nxCloudId from configuration and add Jest setup file for Angular testing
- remove nxCloudId from configuration and add Jest setup file for Angular testing
- add Stylelint configuration and integrate with existing projects
- add Stylelint configuration and integrate with existing projects
- setup nx cloud workspace (nx-cloud)
- enhance Jest configuration and add TypeScript support for e2e tests
- enhance Jest configuration and add TypeScript support for e2e tests
- improve CI workflow by caching npm dependencies and adjusting build steps
- improve CI workflow by caching npm dependencies and adjusting build steps
- add caching for npm dependencies in CI workflow
- add caching for npm dependencies in CI workflow
- enhance CI workflow with improved Jest configuration and reporting
- enhance CI workflow with improved Jest configuration and reporting
- update CI configuration and improve Jest setup for better test coverage
- update CI configuration and improve Jest setup for better test coverage
- update CI workflow to use ubuntu-latest instead of fedora-latest
- update CI workflow to use ubuntu-latest instead of fedora-latest
- add service worker configuration and remove unused styles in app component
- add service worker configuration and remove unused styles in app component
- update image source for grape masthead and remove debugger statement in app component
- update image source for grape masthead and remove debugger statement in app component
- enhance sidebar component with responsive behavior and improved input properties
- enhance sidebar component with responsive behavior and improved input properties
- adjust component styles for improved layout and add background video styling
- adjust component styles for improved layout and add background video styling
- update ESLint configuration and project settings for improved TypeScript support and linting
- update ESLint configuration and project settings for improved TypeScript support and linting
- update configuration paths and enhance project.json with serve, extract-i18n, test, and lint options
- update configuration paths and enhance project.json with serve, extract-i18n, test, and lint options
- simplify sidebar component usage, export header and footer components for better accessibility
- simplify sidebar component usage, export header and footer components for better accessibility
- enhance component structure by adding standalone flag and refining module exports for better organization
- enhance component structure by adding standalone flag and refining module exports for better organization
- update TypeScript target to ES2022, remove unused standalone flags, and enhance module imports for better organization
- update TypeScript target to ES2022, remove unused standalone flags, and enhance module imports for better organization
- refactor module structure and update component imports for improved organization (app)
- refactor module structure and update component imports for improved organization (app)
- refactor project configuration, remove obsolete scripts, and update TypeScript settings for improved compatibility
- refactor project configuration, remove obsolete scripts, and update TypeScript settings for improved compatibility
- streamline TypeScript configurations by removing unnecessary exclusions and cleaning up project files (tsconfig)
- streamline TypeScript configurations by removing unnecessary exclusions and cleaning up project files (tsconfig)
- clean up unused files and enhance AppModule for circular import detection
- clean up unused files and enhance AppModule for circular import detection
- update TypeScript configurations, enhance Jest setup, and refactor environment variables
- update TypeScript configurations, enhance Jest setup, and refactor environment variables
- update TypeScript configurations to target ES2022 and improve linting setup (tsconfig)
- update TypeScript configurations to target ES2022 and improve linting setup (tsconfig)
- update TypeScript configuration for improved build settings and enable Angular Ivy (tsconfig)
- update TypeScript configuration for improved build settings and enable Angular Ivy (tsconfig)
- update ESLint configuration and add linting options for TypeScript files (eslint)
- update ESLint configuration and add linting options for TypeScript files (eslint)
- enhance ESLint configuration with import cycle rule and fix formatting (eslint)
- enhance ESLint configuration with import cycle rule and fix formatting (eslint)
- refactor components to standalone and clean up providers (app)
- refactor components to standalone and clean up providers (app)
- update schematics configuration and simplify TypeScript options (project)
- update schematics configuration and simplify TypeScript options (project)
- add schematics configuration for Angular components (project)
- add schematics configuration for Angular components (project)
- update TypeScript configuration for strict templates and Ivy support (tsconfig)
- update TypeScript configuration for strict templates and Ivy support (tsconfig)
- upgrade TypeScript target to ES2022 for improved language features (eslint): update ESLint configuration for TypeScript support and enhance parser options feat(tsconfig)
- upgrade TypeScript target to ES2022 for improved language features (eslint): update ESLint configuration for TypeScript support and enhance parser options feat(tsconfig)
- add footer component and module with necessary imports and tests (footer)
- add footer component and module with necessary imports and tests (footer)
- remove unused typography definitions to streamline styles (sidebar): remove collapsed state binding and update component structure for improved clarity feat(space-video): remove standalone flag for consistency in component declaration feat(record-detail): remove standalone flag for consistency in component declaration feat(record-list): remove standalone flag for consistency in component declaration style(colors): delete unused color definitions to streamline styles style(theme): enhance theme structure and add support for light and dark themes style(styles): refactor main styles to improve theme management and component styling style(typography)
- remove unused typography definitions to streamline styles (sidebar): remove collapsed state binding and update component structure for improved clarity feat(space-video): remove standalone flag for consistency in component declaration feat(record-detail): remove standalone flag for consistency in component declaration feat(record-list): remove standalone flag for consistency in component declaration style(colors): delete unused color definitions to streamline styles style(theme): enhance theme structure and add support for light and dark themes style(styles): refactor main styles to improve theme management and component styling style(typography)
- update project configuration and enhance module imports for improved structure (core)
- update project configuration and enhance module imports for improved structure (core)
- enhance SCSS linting and update theme colors for improved styling consistency (styles)
- enhance SCSS linting and update theme colors for improved styling consistency (styles)
- add deployment, installation, testing, cleaning, and reset scripts for improved workflow automation (scripts)
- add deployment, installation, testing, cleaning, and reset scripts for improved workflow automation (scripts)
- implement navy and pink themes with updated typography and color configurations (styles)
- implement navy and pink themes with updated typography and color configurations (styles)
- refactor theme and typography integration for improved consistency and maintainability (styles)
- refactor theme and typography integration for improved consistency and maintainability (styles)
- update installation process and add dependency management script (installation)
- update installation process and add dependency management script (installation)
- implement project cleanup script with progress tracking and enhanced dependency management (cleanup)
- implement project cleanup script with progress tracking and enhanced dependency management (cleanup)
- integrate Angular Material's indigo-pink theme and enhance theme configuration (styles)
- integrate Angular Material's indigo-pink theme and enhance theme configuration (styles)
- redefine navy palette using Material's API and update theme application (styles)
- redefine navy palette using Material's API and update theme application (styles)
- update theme configuration with navy palette and adjust TypeScript target (styles)
- update theme configuration with navy palette and adjust TypeScript target (styles)
- update color palettes and theme configuration for improved design consistency (styles)
- update color palettes and theme configuration for improved design consistency (styles)
- implement Angular Material theming with custom navy and accent palettes (styles)
- implement Angular Material theming with custom navy and accent palettes (styles)
- implement Angular Material theming with primary and accent palettes (styles)
- implement Angular Material theming with primary and accent palettes (styles)
- add theme styles with primary, secondary, and accent colors (styles)
- add theme styles with primary, secondary, and accent colors (styles)
- add Angular Material theming and core styles (styles)
- add Angular Material theming and core styles (styles)
- setup nx cloud workspace (nx-cloud)

### Fixed
- improve error handling for token verification (auth.service.ts)
- update navigation route format in RecordListComponent to match defined routes
- update body width to 100vw for improved layout responsiveness
- correct routing syntax for record detail navigation
- correct routing syntax for record detail navigation
- update @nx/angular dependency version to allow minor updates
- update @nx/angular dependency version to allow minor updates
- update @nestjs/platform-express to version 10.4.15 and clean up .gitignore
- update @nestjs/platform-express to version 10.4.15 and clean up .gitignore
- restore background video in index.html
- restore background video in index.html
- enhance AppComponent with change detection and debug logs, update index.html for script loading
- enhance AppComponent with change detection and debug logs, update index.html for script loading
- update routing to redirect to landing component and change executor for development server
- update routing to redirect to landing component and change executor for development server
- update Angular and zone.js dependencies, adjust project configuration for Nx compatibility
- update Angular and zone.js dependencies, adjust project configuration for Nx compatibility
- update Jest and TypeScript configurations for improved compatibility and linting
- update Jest and TypeScript configurations for improved compatibility and linting
- update main and tsConfig paths in project.json for craft-nest application
- update main and tsConfig paths in project.json for craft-nest application
- format options in nx.json for better readability
- format options in nx.json for better readability
- add build configuration for craft-nest application in nx.json
- add build configuration for craft-nest application in nx.json
- add missing newline in nx.json configuration
- add missing newline in nx.json configuration
- comment out Jest test and coverage upload steps in CI workflow
- comment out Jest test and coverage upload steps in CI workflow
- simplify Jest test results upload step in CI workflow
- simplify Jest test results upload step in CI workflow
- update CI workflow to conditionally upload Jest test results if report file exists
- update CI workflow to conditionally upload Jest test results if report file exists
- update format check command in CI workflow to include base and head parameters
- update format check command in CI workflow to include base and head parameters
- enhance format check in CI workflow to handle empty NX_BASE
- enhance format check in CI workflow to handle empty NX_BASE
- change main branch name from 'main' to 'master' in CI workflow
- change main branch name from 'main' to 'master' in CI workflow
- change defaultBase from 'main' to 'master' in nx.json
- change defaultBase from 'main' to 'master' in nx.json
- update CI workflow to handle missing tests and downgrade codecov action version
- update CI workflow to handle missing tests and downgrade codecov action version
- update CI workflow to trigger on 'master' branch instead of 'main'
- update CI workflow to trigger on 'master' branch instead of 'main'
- remove cloud configuration and access tokens from nx.json (nx-cloud)
- remove cloud configuration and access tokens from nx.json (nx-cloud)
- refactor nx.json to use structured cloud configuration and remove hardcoded access token (nx-cloud)
- refactor nx.json to use structured cloud configuration and remove hardcoded access token (nx-cloud)
- remove hardcoded access token from configuration (nx-cloud)
- remove hardcoded access token from configuration (nx-cloud)
- update jest preset import and upgrade TypeScript ESLint packages to version 8.19.0
- update jest preset import and upgrade TypeScript ESLint packages to version 8.19.0
- correct plugin key from "plugins" to "plugin" in nx.json
- correct plugin key from "plugins" to "plugin" in nx.json
- change defaultBase from 'main' to 'master' in nx.json
- change defaultBase from 'main' to 'master' in nx.json
- correct syntax for Codecov action configuration (ci)
- correct syntax for Codecov action configuration (ci)
- correct theme color application for better accessibility (styles)
- correct theme color application for better accessibility (styles)

### Changed
- Implement code changes to enhance functionality and improve performance
- push from production
- 
- Merge
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fushion
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fushion
- remove the service intergration
- upgrade
- remove map component and update fire alert component for improved layout and styling
- remove legend from finance component and enhance tooltip functionality for better data visualization
- simplify workspace layout by removing libsDir; update tsconfig to include jest and node types; replace grape masthead image with a transparent PNG
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- update FlightRadarService to fetch flight data by track ID and improve error handling; add polyline drawing in MapboxService for flight tracks
- update TypeScript configuration and Jest setup for improved compatibility
- update TypeScript configuration and Jest setup for improved compatibility
- merge
- merge
- update app component styling to use full width for better layout
- remove files
- clean up Fire Alert component by removing commented code and improving flight data handling
- enhance Fire Alert component to integrate FlightRadar24 data and improve flight marker handling
- update environment configuration for FlightRadar24 and FlightAware APIs, enhance Fire Alert component with nearby flights display
- update environment configuration for FlightRadar24 and FlightAware APIs, enhance Fire Alert component with nearby flights display
- enhance Fire Alert component with Mapbox integration, improved styling, and alert handling
- enhance Fire Alert component with Mapbox integration, improved styling, and alert handling
- update ESLint configurations and package dependencies for improved compatibility and performance
- update ESLint configurations and package dependencies for improved compatibility and performance
- update stock data fetching to use Finnhub API and enhance Fintech component with stock data integration
- update stock data fetching to use Finnhub API and enhance Fintech component with stock data integration
- enhance Fire Alert component with alert display and improved styling
- enhance Fire Alert component with alert display and improved styling
- integrate Mapbox into Fire Alert component for enhanced visualization
- integrate Mapbox into Fire Alert component for enhanced visualization
- add Fire Alert component and integrate with data visualizations for enhanced environmental monitoring
- add Fire Alert component and integrate with data visualizations for enhanced environmental monitoring
- add API configurations for Mapbox, NASA FIRMS, CalFire, and FlightRadar24 to enhance environmental data integration
- add API configurations for Mapbox, NASA FIRMS, CalFire, and FlightRadar24 to enhance environmental data integration
- update space video component to use dynamic video and audio sources, enhancing media handling and user experience
- update space video component to use dynamic video and audio sources, enhancing media handling and user experience
- update peasant kitchen layout and styling for improved structure and visual clarity
- update peasant kitchen layout and styling for improved structure and visual clarity
- add new shapefiles and update versioning for improved geographic data representation
- add new shapefiles and update versioning for improved geographic data representation
- enhance space video component with improved controls, styling, and video source handling for better user experience
- enhance space video component with improved controls, styling, and video source handling for better user experience
- enhance fintech chart with improved data validation, legend display, and average line calculations for better visualization
- enhance fintech chart with improved data validation, legend display, and average line calculations for better visualization
- update bar chart data structure and enhance legend display for improved clarity and usability
- update bar chart data structure and enhance legend display for improved clarity and usability
- Update nest
- Update nest
- clean up HTML structure, enhance styling, and implement data visualization service for improved functionality
- clean up HTML structure, enhance styling, and implement data visualization service for improved functionality
- adjust landing component styles for improved visual consistency and animation timing
- adjust landing component styles for improved visual consistency and animation timing
- update record list component styles for improved layout and usability
- update record list component styles for improved layout and usability
- enhance sidebar styling and improve record list component structure for better usability
- enhance sidebar styling and improve record list component structure for better usability
- improve error handling in record service and enhance HTML structure for better readability
- improve error handling in record service and enhance HTML structure for better readability
- enhance line and fintech components with improved structure and data handling
- enhance line and fintech components with improved structure and data handling
- enhance bar chart component structure and styling for improved readability and user experience
- enhance bar chart component structure and styling for improved readability and user experience
- adjust height of app component for improved layout responsiveness
- adjust height of app component for improved layout responsiveness
- rename onDisplayRowChange to onTableChange and update paginator logic for improved data handling
- rename onDisplayRowChange to onTableChange and update paginator logic for improved data handling
- improve HTML structure and SCSS styles for better readability and maintainability
- improve HTML structure and SCSS styles for better readability and maintainability
- remove unused Jest configuration and clean up TypeScript settings
- remove unused Jest configuration and clean up TypeScript settings
- update TypeScript configuration for improved path management and type support
- update TypeScript configuration for improved path management and type support
- remove Jest type from tsconfig for cleaner type management and update exclude patterns
- remove Jest type from tsconfig for cleaner type management and update exclude patterns
- change build executor to use @nx/angular for improved performance
- change build executor to use @nx/angular for improved performance
- update build executor in project.json to use @angular-devkit
- update build executor in project.json to use @angular-devkit
- switch to ES module syntax in esbuild configuration
- switch to ES module syntax in esbuild configuration
- update ESLint configuration to use base config and remove unused lint settings
- update ESLint configuration to use base config and remove unused lint settings
- build
- build
- craft-web build
- craft-web build
- catching a build
- catching a build
- Forcefully merged working-angular into master, replacing all content.
- Forcefully merged working-angular into master, replacing all content.
- Merge branch 'working-angular'
- Merge branch 'working-angular'
- simplify app layout, update styles, and remove debug elements
- simplify app layout, update styles, and remove debug elements
- update app layout and styles, change routing redirect, and remove unused components
- update app layout and styles, change routing redirect, and remove unused components
- simplify module exports in data visualizations, peasant kitchen, and table modules
- simplify module exports in data visualizations, peasant kitchen, and table modules
- remove Ionic dependencies and update data visualizations layout
- remove Ionic dependencies and update data visualizations layout
- update output paths for craft-nest and remove nx-cloud configuration
- update output paths for craft-nest and remove nx-cloud configuration
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Merge pull request #2 from JeffreySanford/feat/nx-cloud/setup
- Merge pull request #2 from JeffreySanford/feat/nx-cloud/setup
- Merge commit 'b3094c43c14b99a4ece98b6a088205c44ee4d30d'
- Merge commit 'b3094c43c14b99a4ece98b6a088205c44ee4d30d'
- enhance base styles and update scrollbar customization (styles)
- enhance base styles and update scrollbar customization (styles)
- remove Angular Material theming files and update styles imports (styles)
- remove Angular Material theming files and update styles imports (styles)
- restructure typography imports and add Angular Material typography configuration (styles)
- restructure typography imports and add Angular Material typography configuration (styles)
- update Angular Material theming import for consistency (styles)
- update Angular Material theming import for consistency (styles)
- remove unused Material theme file and update styles import (styles)
- remove unused Material theme file and update styles import (styles)
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Refactor SCSS imports to utilize Angular Material theming; streamline style management and enhance consistency.
- Merge pull request #1 from JeffreySanford/feat/nx-cloud/setup
- Merge pull request #1 from JeffreySanford/feat/nx-cloud/setup
- Refactor Angular Material theming and remove deprecated files; streamline styles and enhance color usage across components.
- Add browserslist configuration and update TypeScript settings; enhance compatibility and modernize build process.
- Update Angular dependencies and implement patriotic theme in SCSS; remove migrations.json file.
- Refactor SCSS files to utilize updated Angular Material theming functions; enhance color usage and improve consistency across components.
- Refactor SCSS files to use updated Angular Material color functions; enhance theme consistency across components.
- Refactor SCSS files to use the new Angular Material theming syntax; enhance color palette usage and improve consistency across components.
- Refactor SCSS files to remove commented code and streamline styles; enhance consistency in theme usage across components.
- Update build commands and TypeScript paths for craft applications; streamline output paths and enhance module resolution.
- Refactor application structure; streamline module imports, enhance TypeScript configuration, and optimize output directory settings for improved consistency.
- Add Angular ESLint plugins, update component styles, and refactor SCSS color usage; set components as non-standalone and adjust TypeScript configuration for improved consistency.
- Refactor space-video, table, and data-visualizations modules; export SpaceVideoComponent, add components to table module imports, and clear exports in data-visualizations module. Clean up styles.scss by removing unused color palette definitions.
- Refactor app.module.ts; update BrowserAnimationsModule import, adjust module declarations for consistency, and streamline provider configuration.
- Refactor tsconfig.base.json; remove unused angularCompilerOptions to simplify configuration.
- Refactor craft-web application; update module imports for consistency, adjust TypeScript configuration paths, and streamline output directory settings.
- Refactor craft-nest and craft-web applications; remove unused axios library and related files, update package names, and correct styleUrl to styleUrls in components for consistency.
- Refactor craft-web application; remove unused main.ts file, update tsconfig references, and enhance error handling in components. Introduce new angular.json and tsconfig.app.json for improved project structure and configuration.
- Refactor DigitalOcean deployment script; remove redundant Nginx restart confirmation, environment variable update, and monitoring mode steps to streamline the deployment process.
- Refactor deployment script; enhance Nginx restart confirmation, add environment variable update step, and improve monitoring mode. Update package dependencies to latest versions.
- Refactor DigitalOcean deployment script; enforce sudo privileges, streamline Angular deployment steps, and remove redundant service validation checks.
- Refactor DigitalOcean deployment script; enhance SQLite database handling, improve Angular build error handling, and streamline PM2 service management.
- Refactor DigitalOcean deployment script; update script description, enhance logging for environment details, streamline build steps for Angular, NestJS, and Go, and improve service validation.
- Refactor DigitalOcean deployment script; update script description, enhance logging for debugging, streamline variable management, and improve service validation.
- Refactor DigitalOcean deployment script; update script description, enhance logging, add Angular build step, streamline SQLite permissions fix, and improve service validation.
- Refactor DigitalOcean deployment script; enhance logging with summaries for key steps, improve progress display, and streamline function calls for better readability.
- Refactor DigitalOcean deployment script; update script description, enhance logging for errors and system environment, and improve error handling during Go installation and SQLite permissions fix.
- Refactor DigitalOcean deployment script; update script description, remove NestJS build step, streamline SQLite permissions fix, and enhance deployment workflow.
- Refactor DigitalOcean deployment script; update script description, streamline variable management, enhance logging functions, and improve Go installation process.
- Refactor DigitalOcean deployment script; update script description, increase total steps, enhance logging and server stats functions, add SQLite permissions fix, and streamline PM2 management.
- Refactor DigitalOcean deployment script; update script description, increase total steps, enhance logging and system stats functions, and streamline PM2 process management.
- Refactor DigitalOcean deployment script; increase total steps, update Go build path, and enhance PM2 process restart logic.
- Refactor DigitalOcean deployment script; update Go build process, enhance PM2 restart command, and improve server health check logging.
- Refactor DigitalOcean deployment script; increase total steps, add metadata display functions for Node, NPM, NX, Angular CLI, NestJS, and Go, and streamline PM2 process management.
- Refactor DigitalOcean deployment script; increase total steps, add build functions for NestJS and Go, and enhance PM2 process management.
- Refactor DigitalOcean deployment script; enhance logging color for better visibility, update NX version command, and improve monitoring loop messaging.
- Refactor DigitalOcean deployment script; enhance logging, improve server information display, and streamline deployment workflow.
- Refactor logging in DigitalOcean deployment script; change log message color for better visibility.
- Refactor DigitalOcean deployment script; add PM2 process management function, enhance deployment logging, and improve environment update handling.
- Refactor DigitalOcean deployment script; increase total steps, enhance server uptime tracking, add VPS hardware and provider information, and improve logging functionality.
- Refactor DigitalOcean deployment script; increase total steps, enhance server health checks, add monitoring functionality, and improve log collection.
- Refactor DigitalOcean deployment script; increase total steps, enhance server update checks, and add detailed service checks and build processes.
- Refactor SSH identity setup; enhance key detection for special keys and improve logging for added identities.
- Refactor SSH identity setup; enhance key addition process, support multiple SSH keys, and improve logging for added identities.
- Refactor DigitalOcean deployment script; enhance logging format, improve SSH identity setup, and streamline OSINT data output.
- Refactor DigitalOcean deployment script; add SSH identity setup function, increase total steps, and streamline system metrics collection.
- Refactor DigitalOcean deployment script; enhance logging functionality, improve OSINT search output, and streamline dependency installation checks.
- Refactor DigitalOcean deployment script; improve user IP detection, enhance OSINT search functionality, and streamline deployment steps.
- Refactor DigitalOcean deployment script for Fedora; enhance dependency installation, improve system metrics collection, and add OSINT analysis.
- Refactor DigitalOcean deployment script; enhance time tracking, improve system metrics logging, and add cumulative duration reporting.
- Refactor logging in DigitalOcean deployment script; include timestamp in log entries for better tracking.
- Refactor DigitalOcean deployment script; enhance logging, streamline argument parsing, and improve system metrics collection.
- Refactor DigitalOcean deployment script; enhance logging, streamline argument parsing, and improve SSH key management.
- Refactor DigitalOcean deployment script; enhance logging, streamline argument parsing, and add system and OSINT metrics fetching.
- Refactor DigitalOcean deployment script; remove redundant system metrics fetching, streamline SSH key management, and enhance logging for deployment steps.
- Refactor craft-go project configuration; update build and serve commands, streamline paths, and enhance TypeScript settings.
- Refactor DigitalOcean deployment script; update shebang, streamline argument parsing, enhance time tracking, and improve SSH key handling.
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fusion
- Enhance DigitalOcean deployment script; improve argument parsing, add time tracking for deployment steps, and display resource metrics upon completion.
- Ensure deploy script is executable
- Refactor craft-go project configuration; update build and serve commands, streamline structure, and remove legacy deployment script.
- Enhance Craft-Fusion deployment script; add system metrics reporting, improve time tracking for deployment steps, and streamline argument parsing for full cleanup.
- Enhance Craft-Fusion deployment script; automate deployment steps, add connection metrics, manage dependencies, and improve service checks.
- Refactor craft-go project configuration; update executor commands, adjust source root, and streamline build and serve options.
- Enhance DigitalOcean deployment script; add NPM connection metrics, update deployment time estimation, and improve dependency management steps.
- Enhance DigitalOcean deployment script; add deployment time estimation, reorganize step numbering, and improve service checks for Snort.
- Enhance DigitalOcean deployment script; add console-style purpose and reminder messages, reorganize steps for clarity, and implement full cleanup option for dependencies.
- Enhance DigitalOcean deployment script; update SSH key path handling, improve error messaging for SSH key addition, and ensure proper SSH agent startup.
- Refactor DigitalOcean deployment script; implement step-by-step progress tracking, enhance error handling, and streamline environment setup.
- Enhance DigitalOcean deployment script; ensure SSH key path is correct, add error handling for SSH agent startup, and improve messaging for SSH key addition.
- Refactor DigitalOcean deployment script; improve PATH management, enhance error handling, and update health check procedures.
- Enhance Digital Ocean deployment script; adjust PATH handling for Go based on user permissions and improve error messaging for Go command verification.
- Enhance Digital Ocean deployment script; add comprehensive error handling, logging, and health checks for frontend and backend services.
- Add deployment script for Digital Ocean; include environment setup, build processes, and error handling
- Refactor ApiService; update API URL handling and server configuration for improved flexibility
- Add project configuration for craft-web; define build target and production settings in nx.json
- Remove unused project configuration for @craft-fusion/source in nx.json
- Add project configuration for craft-go; define build target and project structure in nx.json
- Refactor ApiService; update apiUrl to include server endpoint for Go server and NestJS server
- Update Swagger URLs in RecordListComponent to use production server addresses
- Update production environment configuration; add nestPort and goPort for service management
- Enhance server configuration; add HTTP server with timeouts and update .gitignore for NestJS build artifacts
- Add GetRecordByUID functionality; implement handler and service method for UID-based record retrieval, initialize record generation time, and update Swagger documentation
- Refactor RecordsController and RecordsService; streamline record retrieval logic, enhance error handling for UID lookups, and improve record generation timing
- Refactor ApiService and RecordListComponent; implement server configuration handling, enhance API URL management, and improve logging for server selection
- Refactor ApiService and RecordListComponent; update API URL handling, improve server selection logic, and enhance styling for header component
- Refactor record generation logic; implement new user record model and add endpoint for retrieving generation time
- Refactor environment configuration and API service; add record generation handler and enhance logging for API calls
- Refactor ApiService to use environment-specific API URL; add methods for setting record size and server type, and implement performance reporting functionality
- Add CORS support and set trusted proxies in main.go; enable access from localhost and specified domain
- Refactor landing and record list components; simplify HTML structure, update paginator settings, and enhance styles for better responsiveness and visual appeal
- Update asset paths in project configuration and HTML; remove favicon from assets array and adjust favicon link to new location
- Enhance sidebar styles; adjust padding and margin, update global styles to prevent overflow, and remove unused icon assets
- Optimize image assets; compress and update image paths in components, enhance video playback handling, and improve sorting functionality in RecordListComponent
- Refactor AppComponent and RecordListComponent; improve video playback handling, enhance sorting functionality, and update color variables in styles
- Add Prettier configuration and enhance sidebar and table styles; improve scrollbar design and clean up HTML structure
- Refactor RecordListComponent; improve paginator and sorting functionality, enhance styles, and clean up HTML structure
- Refactor RecordListComponent and styles; update dataset sizes, fix language typo, and enhance scrollbar styling
- Enhance server selection functionality in RecordListComponent; add API URL configuration for Craft Go and NestJS servers
- Update README.md with comprehensive installation guide and application details for Craft-Fusion monorepo
- Refactor project structure and naming conventions; update package names and add initial models for user, company, address, phone, and record.  Adds craft-go project.
- Refactor sidebar and footer components for improved styling and responsiveness; update HTML structure and SCSS styles
- Refactor sidebar component for improved collapse functionality and styling; update layout and responsiveness
- Refactor sidebar component for improved responsiveness and styling; update color variables for consistency
- Enhance sidebar component with responsive design and menu grouping; update project configurations for development and production
- Set global prefix for routes and enhance CORS configuration in main.ts
- Refactor HTTPS options and CORS configuration in main.ts
- Add protocol handling for server URL in main.ts
- Add HTTPS support in main.ts with Let's Encrypt certificates for production
- Update HOST declaration in main.ts to use production hostname for production environment
- Remove unused imports and simplify PORT declaration in main.ts
- Update ecosystem.config.js to correct script path for application startup
- Update ecosystem.config.js to correct script path and adjust environment variables for nginx integration
- Update main.ts to clarify PORT usage for nginx handling and remove unnecessary comments
- Refactor main.ts to remove SSL certificate handling and simplify server bootstrap for nginx integration
- Update main.ts to set PORT to 3000 for nginx handling and simplify environment configuration
- Add helmet middleware for security and refactor SSL certificate handling in bootstrap
- Refactor server bootstrap to use environment variables for configuration and improve SSL certificate handling
- Refactor environment configuration to remove unused keyPath and certPath properties
- Update ecosystem configuration to change environment variable scope from env_production to env
- Update ecosystem configuration to correct script path for craft-nest API
- Update project configuration to change build executor and update TypeScript configuration path
- Update project configuration to change build executor and add file replacements for production environment
- Update ecosystem configuration to correct script path and change environment variable scope
- Update ecosystem configuration to change environment variable scope to env_production
- Update ecosystem configuration to correct script path for craft-nest API
- Update ecosystem configuration to use relative paths for log files
- Update ecosystem configuration to use relative script paths and set working directory
- Update ecosystem configuration to use absolute script paths and consolidate environment variables
- Update ecosystem configuration to adjust working directory paths and enhance logging for development environment
- Update ecosystem configuration to correct script paths and log file locations
- Update ecosystem configuration to correct script path for application startup
- Rename application to 'craft-nest-api' and update script paths; add logging configuration for production and development environments
- Export Flight and OpenSkyResponse interfaces for external usage
- Refactor OpenSky module structure and update service implementation
- Refactor OpenSkyService to comment out unused API calls and HttpClient
- Update ApiService to use environment configuration for production mode
- Fix script path in ecosystem configuration for craft-nest
- Refactor ecosystem configuration and migrate to JavaScript
- Refactor axios library structure and update TypeScript configurations
- Add production and development environment configurations
- Add axios library with initial implementation and tests
- Update axios dependency to version 1.7.9 in package.json
- Remove extractCss option from project configuration
- Update NestJS dependencies to compatible versions in package.json
- Remove conflicting Angular DevKit dependencies from package.json
- Merge branch 'master' of https://github.com/JeffreySanford/craft-fushion
- Remove unused Angular DevKit dependencies from package.json
- Update Angular dependencies to use caret (^) versioning in package.json
- Update NestJS dependencies to version 10.0.0 in package.json
- Add PM2 ecosystem configuration for craft-nest application
- Refactor TypeScript configurations and environment files; remove unused files and update Jest configurations
- Remove unused e2e test files and update TypeScript configurations for improved type declaration support
- Update Angular PWA dependency to version 18.2.12 in package.json
- Refactor environment configurations and update API endpoints for development and production
- Refactor project structure by removing unused files and adding environment configurations
- Add initial project files, interfaces, and components for users, companies, and visualizations
- Initialize project structure with basic configurations and components
- Initial commit

### Maintenance
- update marked package to version 15.0.7 and remove unused interface files
- clean up unused imports and optimize component performance
- clean up unused imports and optimize component performance
- update @nx/eslint-plugin version to allow minor updates
- update @nx/eslint-plugin version to allow minor updates
- update CI workflow for improved Nx Cloud integration and dependency management (ci)
- update CI workflow for improved Nx Cloud integration and dependency management (ci)
- update CI workflow to trigger on 'master' branch and change runner to Fedora (ci)
- update CI workflow to trigger on 'master' branch and change runner to Fedora (ci)
- update CI workflow to trigger on 'main' branch instead of 'master' (ci)
- update CI workflow to trigger on 'main' branch instead of 'master' (ci)
- update CI workflow to trigger on 'master' branch instead of 'main' (ci)
- update CI workflow to trigger on 'master' branch instead of 'main' (ci)
- rename material styles file and adjust SCSS imports for better theming (ci): update CI workflow to use 'main' branch and improve Nx Cloud integration refactor(styles)
- rename material styles file and adjust SCSS imports for better theming (ci): update CI workflow to use 'main' branch and improve Nx Cloud integration refactor(styles)

### Build
- add production build outputs
- add production build outputs




### Added
- Enhanced service monitoring visualization in admin dashboard
- Admin logs component with advanced filtering capabilities
- Comprehensive documentation reorganization with logical folder structure
- New services index file for improved service discovery
- Unified API documentation with merged API service architecture docs

### Changed
- Improved logger service with patriotic color theme
- Optimized logger display component rendering
- Enhanced footer component with performance metrics visualization
- Standardized documentation file naming using kebab-case format
- Reorganized documentation into topic-based categories (architecture, guides, services, etc.)

### Fixed
- Type errors in category detection methods for logger service
- Rendering performance issues in admin dashboard
- Missing type safety in service monitoring components
- Documentation cross-references and broken links
- Inconsistent documentation structure and naming conventions

## [1.5.0] - 2023-10-30

### Added

- Style testing bench for component verification
- Comprehensive animation system with patriotic theme
- Style Dictionary integration for design tokens
- Reduced motion support for accessibility

### Changed

- Implemented patriotic theme improvements
- Enhanced responsive design across all components
- Updated Material theme implementation to MD3 standards

### Fixed

- SCSS compilation errors related to Material theming
- Fixed incorrect color contrast in dark mode
- Resolved animation issues on Safari browsers
- Fixed responsive layout bugs on mobile devices

## [1.4.0] - 2023-09-15

### Added

- Robust error handling for API calls
- Enhanced admin dashboard with real-time analytics
- Added service monitoring panel
- WebSocket event system
- Automated deployment pipeline

### Changed

- Optimized chart rendering performance
- Updated Angular Material to latest version
- Improved error message displays

### Fixed

- Fixed data loading issues in dashboard
- Resolved memory leaks in chart components
- Fixed inconsistent styling in form elements

## [1.3.0] - 2023-08-10

### Added

- Dark mode toggle
- Improved responsive layout for mobile devices 
- Performance monitoring for API requests
- User preference persistence
- Offline mode capabilities

### Changed

- Enhanced mobile navigation experience
- Improved form validation patterns
- Optimized bundle size

### Fixed

- Corrected alignment issues in dashboard cards
- Fixed theme switching memory leak
- Resolved WebSocket reconnection issues

## [1.2.0] - 2025-03-20

### Added

- Performance monitoring in footer component
- Realtime metrics display with chart visualization
- Service metrics tracking system
- Expandable footer with comprehensive system information

### Changed

- Refactored footer component for better performance
- Improved responsive behavior of main layout
- Enhanced patriotic styling across components

### Fixed

- Background video playback issues on some browsers
- Memory leaks in component destruction
- Login state persistence problems
- Route transition animations

## [1.1.0] - 2025-02-15

### Added

- User authentication system
- Admin dashboard and controls
- Patriotic banner animations
- Responsive sidebar navigation

### Changed

- Migrated to Angular Material MDC components
- Improved application startup performance
- Enhanced accessibility throughout the application
- Updated documentation for component standards

### Fixed

- Layout overflow issues on mobile devices
- Form validation error displays
- Image loading and compression
- Navigation menu active state tracking

## [1.0.0] - 2025-01-30

### Added

- Initial application release
- Core component library
- Patriotic theme implementation
- Dashboard analytics
- Data visualization components

## [0.8.0] - 2025-03-25

### Added
- Comprehensive logger service with patriotic color theme
- Category-based log classification system
- API endpoint monitoring dashboard
- Performance metrics visualization
- Responsive design system with _responsive.scss mixins
- Service call tracking and visualization

### Fixed
- Type errors in logger service category detection
- Service monitoring component rendering issues
- Chart visualization performance problems

### Changed
- Updated Material Design 3 implementation with vibrant patriotic theme
- Enhanced admin dashboard with expandable endpoint details
- Improved API logs with timeline visualization

## [0.7.0] - 2025-03-10

Last Updated: 2025-03-25
```
