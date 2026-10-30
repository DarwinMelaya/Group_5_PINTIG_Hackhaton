import { useEffect, useState } from "react";
import { CloudSun, Wind, Droplets, ExternalLink } from "lucide-react";
import { dateTime } from "./common";
export interface Forecast {
  temperature_2m: number;
  precipitation: number;
  wind_speed_10m: number;
  weather_code: number;
  time: string;
}
export async function fetchWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<Forecast> {
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&timezone=UTC`,
    { signal },
  );
  if (!r.ok) throw new Error("Forecast provider unavailable");
  const j = await r.json();
  if (
    !j.current ||
    !Number.isFinite(j.current.temperature_2m) ||
    !Number.isFinite(j.current.wind_speed_10m) ||
    !Number.isFinite(j.current.precipitation) ||
    !j.current.time
  )
    throw new Error("Invalid forecast response");
  return j.current;
}
export function Weather({
  latitude = 13.4469,
  longitude = 121.8396,
  location = "Boac, Marinduque",
}: {
  latitude?: number;
  longitude?: number;
  location?: string;
}) {
  const [data, setData] = useState<Forecast | null>(null);
  const [retrieved, setRetrieved] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 10000);
    setError("");
    void fetchWeather(latitude, longitude, controller.signal)
      .then((d) => {
        if (active) {
          setData(d);
          setRetrieved(new Date().toISOString());
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Forecast unavailable. Check the official advisory source before travel.",
          );
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [latitude, longitude, retry]);
  return (
    <section className="weather-card">
      <div className="row between">
        <span className="eyebrow">ISLAND WEATHER</span>
        <CloudSun size={26} />
      </div>
      <h3>{location}</h3>
      {error ? (
        <>
          <p role="status">{error}</p>
          <button className="text-link" onClick={() => setRetry((x) => x + 1)}>
            Retry forecast
          </button>
        </>
      ) : !data ? (
        <p>Retrieving forecast…</p>
      ) : null}
      {data && (
        <>
          <div className="temperature">
            {Math.round(data.temperature_2m)}°
            <span>
              {data.weather_code === 0
                ? "Clear"
                : data.weather_code < 4
                  ? "Cloudy"
                  : data.weather_code >= 95
                    ? "Thunderstorm risk"
                    : "Variable conditions"}
            </span>
          </div>
          <div className="row weather-stats">
            <span>
              <Droplets size={14} /> {data.precipitation} mm
            </span>
            <span>
              <Wind size={14} /> {data.wind_speed_10m} km/h
            </span>
          </div>
          <small>
            {error ? "Last available forecast · " : ""}
            {dateTime(data.time + "Z")}
            <br />
            Retrieved {dateTime(retrieved)} · Open-Meteo
          </small>
        </>
      )}
      <a
        className="advisory-link"
        href="https://www.pagasa.dost.gov.ph/"
        target="_blank"
        rel="noreferrer"
      >
        PAGASA official advisories <ExternalLink size={13} />
      </a>
      <small>Forecasts are not official weather warnings.</small>
    </section>
  );
}
