const { evaluate } = require("mathjs");

function getWeather(city) {
  return {
    city,
    temperature: "28°C",
    condition: "Sunny",
  };
}

function calculate(expression) {
  try {
    return evaluate(expression).toString();
  } catch {
    return "Invalid expression";
  }
}

function setReminder(task, time) {
  return {
    success: true,
    task,
    time,
  };
}

module.exports = {
  getWeather,
  calculate,
  setReminder,
};