# Workspaces Firefox Extension

A Firefox extension that provides tab grouping functionality similar to Microsoft Edge's Workspaces feature.

## Installation

### Development Installation

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" on the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the extension folder and select `manifest.json`

### Production Installation

The extension will be available on Firefox Add-ons store once approved.

## Features

- Create and manage work groups with custom names and colors
- Add tabs to work groups with drag-and-drop support
- Pin/unpin tabs within work groups
- Open work groups in dedicated windows
- Automatic session saving and restoration
- Visual indicators for work group membership

## Development

The extension follows Firefox WebExtensions API standards and includes:

- **Background script**: Handles window management, tab events, and data persistence
- **Popup interface**: Provides user interface for managing work groups
- **Content script**: Enhances pages with work group indicators
- **Data manager**: Handles work group storage and operations

## Permissions

- `tabs`: Access tab information and management
- `windows`: Create and manage browser windows
- `storage`: Local data persistence
- `sessions`: Session management
- `activeTab`: Access current tab information

## Browser Compatibility

- Firefox 78+
- Firefox ESR 78+

## License

This project is for demonstration purposes.
