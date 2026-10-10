// Format each clock with the visitor's browser and a specific IANA time zone.
const clocks = [
  { id: "new-york", timeZone: "America/New_York" },
  { id: "india", timeZone: "Asia/Kolkata" },
  { id: "germany", timeZone: "Europe/Berlin" },
  // en-AU is used for the abbreviation because en-US returns "GMT+11" instead of AEDT/AEST.
  { id: "australia", timeZone: "Australia/Sydney", zoneLocale: "en-AU" }
];

const formatters = clocks.map(({ timeZone, zoneLocale = "en-US" }) => ({
  time: new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }),
  date: new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }),
  zone: new Intl.DateTimeFormat(zoneLocale, {
    timeZone,
    timeZoneName: "short"
  })
}));

function updateClocks() {
  const now = new Date();

  clocks.forEach(({ id }, index) => {
    const formatter = formatters[index];
    const time = document.querySelector(`[data-clock="${id}"]`);
    const date = document.querySelector(`[data-date="${id}"]`);
    const abbreviation = document.querySelector(`[data-zone-abbreviation="${id}"]`);

    time.textContent = formatter.time.format(now);
    date.textContent = formatter.date.format(now);
    abbreviation.textContent = id === "india"
      ? "IST"
      : formatter.zone
        .formatToParts(now)
        .find((part) => part.type === "timeZoneName").value;
  });

  document.querySelector("#current-year").textContent = now.getFullYear();
}

// Align updates to the start of each second instead of drifting over time.
function scheduleNextUpdate() {
  updateClocks();
  const delay = 1000 - (Date.now() % 1000);
  window.setTimeout(scheduleNextUpdate, delay);
}

scheduleNextUpdate();