# Full Screen (Spicetify Extension)

Standalone Full Screen extension (original project: [daksh2k/Spicetify-stuff](https://github.com/daksh2k/Spicetify-stuff)). Builds into `dist/fullScreen.js`. Portions of the lyrics rendering are inspired by/refactored from [solstice23/refined-now-playing-netease](https://github.com/solstice23/refined-now-playing-netease).

## Install
1. Copy `dist/fullScreen.js` into your Spicetify extensions directory  
   - Linux/macOS: `~/.config/spicetify/Extensions` (or `$XDG_CONFIG_HOME/spicetify/Extensions`)  
   - Windows: `%appdata%/spicetify/Extensions`
2. Enable and apply:
   ```bash
   spicetify config extensions fullScreen.js
   spicetify apply
   ```

## Develop
- Install deps: `npm install`
- Local build: `npm run build-local` (outputs to `dist`)
- Watch mode: `npm run watch`

## License & Credits
- Originally created by Daksh Khurana as part of [Spicetify-stuff](https://github.com/daksh2k/Spicetify-stuff);
- Lyrics behavior/animation draws inspiration by solstice23 from [solstice23/refined-now-playing-netease](https://github.com/solstice23/refined-now-playing-netease).
