import "./App.css";
import { useState } from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

function App() {
  const [Location, setLocation] = useState("BANGKOK");
  const [Isloading, setIsloading] = useState();
  const [DisplayLocation, setDisplayLocation] = useState({});
  const [DisplayWeather, setWeather] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);

  async function getWeather() {
    try {
      // 1) Getting location (geocoding)
      setIsloading(true);
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${Location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      setDisplayLocation(`${name} ${convertToFlag(country_code)}`);

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      console.log(weatherData.daily);
      setWeather(weatherData.daily);
      setIsloading(false);
    } catch (err) {
      console.err(err);
    } finally {
      setIsloading(false);
    }
  }
  function handleDayClick(dayInfo) {
    setSelectedDay(dayInfo);
  }
  return (
    <div className="app">
      <h1>Classic weaher</h1>
      <div>
        <input
          type="text"
          value={Location}
          placeholder="Search from location"
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <button onClick={getWeather}>Get Weather</button>
      {Isloading && <p className="loader">IS LOADING</p>}
      {DisplayWeather.weathercode && (
        <WeatherDetail
          weather={DisplayWeather}
          Location={DisplayLocation}
          onDayClick={handleDayClick}
        />
      )}

      {selectedDay && (
        <div>
          <h3>Details for {selectedDay.date}:</h3>
          <p>Max Temp: {selectedDay.max}°C</p>
          <p>Min Temp: {selectedDay.min}°C</p>
        </div>
      )}
    </div>
  );
}

function WeatherDetail({ weather, Location, onDayClick }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;

  return (
    <div>
      <h3>Weather in {Location}</h3>
      <ul className="weather">
        {dates.map((date, i) => (
          <Days
            max={max[i]}
            min={min[i]}
            codes={codes[i]}
            date={date}
            Istoday={i === 0}
            onDayClick={onDayClick}
            key={date}
          />
        ))}
      </ul>
    </div>
  );
}

function Days({ max, min, date, codes, Istoday, onDayClick }) {
  function handleClick() {
    onDayClick({ date, max, min });
  }

  return (
    <div>
      <li className="day" onClick={handleClick}>
        <span>{getWeatherIcon(codes)}</span>
        <p>{Istoday ? "Today" : formatDay(date)}</p>
        <p>
          {min} - {max}
        </p>
      </li>
    </div>
  );
}
export default App;
