# Full Screen Spicetify Extension

## **Extension details live in [EXTENSIONS.md](EXTENSIONS.md)**

## Install Methods
- ### Method 1(Automatic updates) **Marketplace**:
  
  - Using [Spicetify Marketplace](https://github.com/spicetify/spicetify-marketplace). Follow it's README for installation instructions.
  
  - The extension is automatically updated.


- ### Method 2(Automatic Updates) **Wrappers**:
  - This method always fetches the latest version of extensions from this repo.

  - Use `fullScreenWrapper.js` from the [Wrappers](Extensions/Wrappers) folder.

  - If you want to modify the extension before using or don't want automatic updates, Use method 3.
- ### Method 3(Manual Updates) **Manual**:
  - Get the extension from the [Extensions/full-screen](Extensions/full-screen) folder and follow the Instructions below.

  - This method does not update the extension automatically.
  You have to check manually from the repo if the extension is updated or not and proceed from there.
## Instructions

Download the [zip](https://github.com/daksh2k/Spicetify-stuff/archive/refs/heads/master.zip) of the repo or clone it if you have git installed on your system.

Extract the files and follow the procedure below to install the Full Screen extension.

Copy `fullScreenWrapper.js` from `Extensions/Wrappers` folder or `fullScreen.js` from `Extensions/full-screen/dist` if you don't want automatic updates, into your [Spicetify](https://github.com/spicetify/spicetify-cli) extensions directory:
| **Platform** | **Path**                                                                               |
|------------|------------------------------------------------------------------------------------------|
| **Linux**      | `~/.config/spicetify/Extensions` or `$XDG_CONFIG_HOME/.config/spicetify/Extensions/` |
| **MacOS**      | `~/.config/spicetify/Extensions` or `$SPICETIFY_CONFIG/Extensions`                   |
| **Windows**    | `%appdata%/spicetify/Extensions/`                                               |

After putting the extension file into the correct folder, run the following command to install the extension:
```
spicetify config extensions fullScreenWrapper.js
spicetify apply
```
