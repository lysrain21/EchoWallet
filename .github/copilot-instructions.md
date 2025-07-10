# Echo Wallet - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a specialized Web3 wallet project designed for blind users using ERC-4337 Account Abstraction. Please follow these guidelines when assisting with code generation:

## Project Context
- **Target Users**: Blind and visually impaired users
- **Technology Stack**: Next.js 14, TypeScript, Tailwind CSS, ethers.js, ERC-4337
- **Core Features**: Voice interaction, account abstraction, gas sponsorship via Paymaster

## Development Guidelines

### Accessibility First
- Always prioritize accessibility in all components
- Use semantic HTML elements (nav, main, section, article, etc.)
- Include proper ARIA labels, roles, and properties
- Ensure all interactive elements are keyboard accessible
- Add screen reader announcements for dynamic content changes
- Follow WCAG 2.1 AA standards

### Voice Interface
- Implement voice commands using Web Speech API
- Use Web Speech Synthesis for audio feedback
- Create clear voice prompts and confirmations
- Handle voice input errors gracefully

### ERC-4337 Integration
- Use ZeroDev SDK for account abstraction
- Implement proper UserOperation construction
- Handle Bundler interactions correctly
- Integrate Paymaster for gas sponsorship
- Follow ERC-4337 standards strictly

### Code Style
- Use TypeScript strictly with proper type definitions
- Prefer functional components with hooks
- Use Zustand for global state management
- Implement proper error handling and loading states
- Add comprehensive JSDoc comments
- Use consistent naming conventions

### Security Considerations
- Never expose private keys in client-side code
- Validate all user inputs thoroughly
- Use secure random generation for entropy
- Implement proper session management
- Follow Web3 security best practices

### Testing
- Write unit tests for all utility functions
- Test accessibility with screen readers
- Test voice commands in different environments
- Validate ERC-4337 operations on testnets

## Key Dependencies
- @account-abstraction/sdk
- ethers.js
- @radix-ui components (for accessibility)
- Web Speech API
- ZeroDev SDK
- Zustand for state management

When generating code, always consider the unique needs of blind users and ensure the interface is fully accessible through screen readers and voice commands.
