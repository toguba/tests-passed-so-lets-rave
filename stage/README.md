# stage/

The visuals for the rave. Open `index.html` in a browser (it also works straight from `file://`, and it doesn't need a network connection).

- **Click** or press **F** to toggle fullscreen
- The cursor hides itself when the mouse isn't moving

The visuals run on their own clock and don't react to the music.

## Options

Edit `config.js`, or override any value with URL parameters. URL parameters win over the file.

| param     | example       | notes                                         |
|-----------|---------------|-----------------------------------------------|
| `palette` | `palette=green` | `rainbow` (default) or `green`              |
| `strobe`  | `strobe=0`    | turns off the soft white flashes              |
| `speed`   | `speed=1.5`   | animation speed multiplier                    |
| `density` | `density=0.5` | particle count multiplier (for slow machines) |

## Launching it from the test toolchain

```sh
URL="file://$PWD/stage/index.html?palette=rainbow"
chromium --kiosk --app="$URL"      # or: open -a "Google Chrome" --args --kiosk "$URL"
```
