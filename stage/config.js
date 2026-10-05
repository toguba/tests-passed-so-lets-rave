// Stage config — edit freely.
// Every value here can also be overridden with URL parameters, e.g.
//   index.html?title=SHIP%20IT&palette=green&stats=128%20passed|0%20failed
// List values (stats, ticker) use "|" as the separator in URLs.
window.STAGE_CONFIG = {
  // Big headline
  title: "ALL TESTS PASSED",

  // Smaller line under the headline ("" to hide)
  subtitle: "build green · tests green · vibes green",

  // Chips shown near the bottom ([] to hide)
  stats: ["0 failures", "0 flaky", "100% vibes"],

  // Scrolling ticker of passing tests ([] to hide)
  ticker: [
    "compiles without warnings",
    "unit tests",
    "integration tests",
    "it works on my machine",
    "edge cases (most of them)",
    "linter is happy",
    "no snapshot diffs",
    "type checker approves",
  ],

  // "rainbow" or "green"
  palette: "rainbow",

  // Occasional soft white flashes. Set false if anyone is photosensitive.
  strobe: true,

  // Animation speed multiplier (0.5 = chill, 2 = chaos)
  speed: 1,

  // Particle amount multiplier (lower it on weak machines)
  density: 1,

  // Seconds until the outro screen fades in. 0 = run forever, no progress bar.
  duration: 30,

  // Text on the outro screen ("" = just fade to black)
  outro: "back to work ✓",

  // false hides all text and leaves only the visuals
  hud: true,
};
