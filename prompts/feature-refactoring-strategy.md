# Feature Refactoring Strategy Using Prompt Files

## Overview
This document outlines a consistent approach for using prompt files to track feature implementation and refactoring efforts within the Craft Fusion project. The prompt-driven development approach provides a centralized location for planning, tracking, and documenting changes to specific features or components.

## Vibrant Patriotic Color Usage
In our prompt-driven approach, all refactorings now emphasize a more vivid patriotic palette:
- Red: #B22234
- Navy: #002868
- Gold: #FFD700
- White: #FFFFFF

## Benefits of Prompt-Driven Development
- **Historical Context**: Preserves the thinking and rationale behind design decisions
- **Progress Tracking**: Clear visualization of completed and remaining tasks
- **Knowledge Sharing**: Helps new team members understand feature implementation
- **Consistency**: Promotes consistent implementation patterns across features
- **Coordination**: Allows team members to work independently with a common plan
- **Documentation**: Records both technical and design considerations

## Prompt File Structure

Each feature or refactoring effort should have a dedicated prompt file following this structure:

1. **Title and Overview**: Brief description of the feature/refactoring
2. **Current State Analysis**: Assessment of existing implementation (for refactoring)
3. **Goals**: Clear objectives of the implementation/refactoring
4. **Step-by-Step Plan**: Numbered steps with checkboxes
5. **Detailed Task List**: Granular tasks organized by category
6. **Style Migration Plan**: How styles should be structured (if applicable)
7. **Testing Criteria**: How to validate the implementation
8. **Done Criteria**: Clear definition of completion

## Using Prompt Files Effectively

### When to Create a Prompt File
- For major component refactoring
- When implementing new complex features
- For architectural changes
- For cross-cutting concerns (like theming or accessibility)
- When migrating patterns across multiple components

### Prompt File Lifecycle
1. **Creation**: Initial planning and task breakdown
2. **Refinement**: Team review and adjustments
3. **Implementation**: Regular updates as tasks are completed
4. **Review**: Team validation of implementation
5. **Archiving**: Keep as documentation after completion

### Task Tracking Syntax
Use consistent checkbox syntax for tracking:
- `[ ]` - Task not started
- `[x]` - Task completed
- `[~]` - Task in progress
- `[!]` - Task blocked or has issues

### Integration with Project Management
- Reference ticket/issue numbers in task lists
- Link to design documents or specifications
- Update sprint planning based on prompt file progress
- Use for sprint reviews and retrospectives

## Recommended Prompt Files

The following prompt files should be maintained for the Craft Fusion project:

| Prompt File | Purpose | Owner |
|-------------|---------|-------|
| style-refactoring-plan.md | Core styling system refactoring | Design System Team |
| footer-refactoring-plan.md | Footer component MD3 migration | UI Team |
| header-refactoring-plan.md | Header component MD3 migration | UI Team |
| sidebar-refactoring-plan.md | Sidebar component MD3 migration | UI Team |
| data-visualization-plan.md | Charts and visualization features | Data Team |
| accessibility-compliance.md | WCAG compliance implementation | A11y Team |
| performance-optimization.md | App-wide performance improvements | Core Team |
| animation-system.md | Unified animation framework | UI Team |
| state-management.md | Store implementation and patterns | Core Team |

## Best Practices

1. **Keep Files Updated**: Update prompt files as work progresses
2. **Regular Reviews**: Review prompt files in team meetings
3. **Be Specific**: Include concrete examples and code snippets
4. **Consider Edge Cases**: Document special considerations
5. **Include Visual References**: Link to mockups or design specs
6. **Cross-Reference**: Link between related prompt files
7. **Capture Decisions**: Document why certain approaches were chosen
8. **Include Performance Metrics**: Before/after measurements for refactoring

## Folder Structure

```
prompts/
├── core/ - System-wide architectural patterns
│   ├── style-refactoring-plan.md
│   ├── state-management.md
│   └── performance-optimization.md
├── components/ - Individual component refactoring
│   ├── footer-refactoring-plan.md
│   ├── header-refactoring-plan.md
│   └── sidebar-refactoring-plan.md
├── features/ - Product features
│   ├── data-visualization-plan.md
│   ├── user-authentication.md
│   └── reporting-system.md
└── cross-cutting/ - Non-functional requirements
    ├── accessibility-compliance.md
    ├── security-enhancements.md
    └── internationalization.md
```

## Coding Standards
Refer to [CODING-STANDARDS.md](../CODING-STANDARDS.md) for updated development guidelines.

## Conclusion

The prompt-driven development approach provides a structured way to plan, implement, and document features and refactoring efforts. By maintaining these living documents, we ensure consistency, preserve context, and promote collaboration across the team.

Last Updated: 2025-03-25
