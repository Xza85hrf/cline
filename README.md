# Deep-Cline

A powerful VS Code extension that integrates DeepSeek V3 model, providing an autonomous coding agent right in your IDE. Deep-Cline can create/edit files, run commands, use the browser, and more - with your permission every step of the way.

## Features

- 🤖 **DeepSeek V3 Integration**: Leverages DeepSeek's powerful 671B MoE model with 37B activated parameters
- 🔧 **Autonomous Coding**: Creates and edits files, runs commands, and uses the browser with user oversight
- 💻 **IDE Integration**: Seamlessly integrates with VS Code's interface and workflows
- 🚀 **High Performance**: Processes up to 60 tokens/second with 64K context length
- 📊 **Model Comparison**: Compare outputs from different prompts and analyze performance
- 🔄 **Batch Processing**: Process multiple files or inputs in one session
- 🎨 **Enhanced UI**: Rich configuration interface with real-time token usage tracking

## Installation

1. Install the extension from VS Code Marketplace
2. Configure your DeepSeek API key in the settings
3. Start using Deep-Cline from the activity bar

## Development Setup

```bash
# Clone the repository
git clone https://github.com/Xza85hrf/deep-cline.git

# Install dependencies
npm run install:all

# Start development
npm run watch

# Package the extension
npm run package

# Launch the extension in VS Code
code --extensionDevelopmentPath="path/to/deep-cline"

# Launch without other extensions (for testing)
code --disable-extensions --extensionDevelopmentPath="path/to/deep-cline"
```

## Current Progress (50% Complete)

### Completed Features

- ✅ DeepSeek API integration
- ✅ Core API handler implementation
- ✅ Rate limiting and error handling
- ✅ Enhanced webview UI
- ✅ Model comparison tool
- ✅ Batch processing functionality

### In Progress

- 🔄 Searchable documentation section
- 🔄 Unit testing
- 🔄 Performance optimization

## Known Issues & Limitations

1. Token Usage:
   - Maximum context length: 64K tokens
   - Maximum output tokens: 8K (default 4K)
   - Rate limits may apply during high traffic

2. API Integration:
   - May receive 429/503 errors during peak usage
   - Retry mechanism implemented for handling rate limits

## Future Plans

1. **Documentation Integration**
   - Searchable documentation section
   - Quick access to DeepSeek API references
   - Interactive examples and tutorials

2. **Testing & Optimization**
   - Comprehensive unit test coverage
   - Performance optimization for API calls
   - Enhanced error handling

3. **Additional Features**
   - Advanced model comparison metrics
   - Extended batch processing capabilities
   - Improved debugging tools

## Commands & Usage

### Development Commands

```bash
# Start development
npm run watch

# Run tests
npm run test

# Build webview UI
npm run build:webview

# Package extension
npm run package

# Format code
npm run format:fix

# Check types
npm run check-types

# Lint code
npm run lint
```

### VS Code Commands

- `Deep-Cline: New Task` - Start a new coding task
- `Deep-Cline: MCP Servers` - Manage MCP server connections
- `Deep-Cline: History` - View task history
- `Deep-Cline: Settings` - Configure extension settings
- `Deep-Cline: Open in Editor` - Open chat in a new editor

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Based on the Cline and Roo-Cline repositories, enhanced with DeepSeek V3 model integration and additional features.
