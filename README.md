# eBay Order Helper Chrome Extension

A Chrome extension to help manage eBay orders more efficiently.

## Features

- Order management tools
- Shipping policy management
- Quick access to order information

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Load the extension in Chrome:
- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` directory from this project

## Development Workflow

- `npm run build` - Build the extension
- `npm run watch` - Watch for changes and rebuild automatically
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
ebay-order-helper/
├── assets/           # Static assets
│   └── icons/        # Extension icons
├── src/              # Source code
│   ├── background/   # Background service worker
│   ├── content/      # Content scripts
│   ├── popup/        # Popup UI
│   └── shared/       # Shared types and utilities
├── dist/             # Built extension (generated)
├── manifest.json     # Extension manifest
└── package.json      # Project configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
