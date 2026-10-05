# stage/

The visuals for the rave. Open `index.html` in a browser (it also works straight from `file://`, and it doesn't need a network connection).

- **Click** or press **F** to toggle fullscreen
- **H** shows/hides the text overlay
- The cursor hides itself when the mouse isn't moving

The visuals run on their own clock and don't react to the music.

## Changing the text and options

Edit `config.js`, or override any value with URL parameters. URL parameters win over the file.

| param      | example                              | notes                                   |
|------------|--------------------------------------|-----------------------------------------|
| `title`    | `title=SHIP%20IT`                    | the big headline                        |
| `subtitle` | `subtitle=main%20is%20green`         | empty hides it                          |
| `stats`    | `stats=412%20passed\|0%20failed\|3.2s` | chips, separated with `\|`             |
| `ticker`   | `ticker=auth\|billing\|search`         | scrolling test names, separated with `\|` |
| `palette`  | `palette=green`                      | `rainbow` (default) or `green`          |
| `strobe`   | `strobe=0`                           | turns off the soft white flashes        |
| `speed`    | `speed=1.5`                          | animation speed multiplier              |
| `density`  | `density=0.5`                        | particle count multiplier (for slow machines) |
| `duration` | `duration=30`                        | seconds until the outro; `0` = forever  |
| `outro`    | `outro=go%20home`                    | text on the outro screen                |
| `hud`      | `hud=0`                              | visuals only, no text                   |

## Launching it from the test toolchain

```sh
URL="file://$PWD/stage/index.html?stats=$PASSED%20passed|0%20failed&duration=30"
chromium --kiosk --app="$URL"      # or: open -a "Google Chrome" --args --kiosk "$URL"
```
