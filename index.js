addEventListener('scheduled', event => {
  event.waitUntil(handleScheduled(event));
});

async function handleRequest(event) {
  await handleScheduled(event);
  return new Response("Hello");
}
/**
 * Respond with hello worker text
 * @param {Event} event
 */
async function handleScheduled(event) {
  const tomorrow = await fetchTomorrow();
  const sensibo = await fetchSensibo();
  console.log("Temps");
  console.log(JSON.stringify(tomorrow, null, 2));
  console.log("Sensibo");
  console.log(JSON.stringify(sensibo, null, 2));
  await handleAcState(event, tomorrow, sensibo);
}

async function fetchTomorrow() {
  const url = `https://api.tomorrow.io/v4/timelines?location=${TOMORROW_LOCATION_ID}&fields=temperature,temperatureApparent&units=imperial&timesteps=current`;
  const headers = new Headers({
    apiKey: TOMORROW_API_KEY
  });
  const init = {
    headers,
  };
  const response = await fetch(url, init);
  const json = await response.json();
  return json.data.timelines[0].intervals[0].values;
}

async function fetchSensibo() {
  const url = `https://home.sensibo.com/api/v2/pods/${SENSIBO_DEVICE_ID}?apiKey=${SENSIBO_API_KEY}&fields=acState,measurements`;
  const response = await fetch(url);
  const json = await response.json();
  return json.result;
}

async function handleAcState(event, tomorrow, sensibo) {
  const dateOptions = {timeZone: "America/New_York"};
  const date = new Date().toLocaleString("en-US", dateOptions);
  const runTime = new Date(date).getHours();
  const outdoorTemp = Math.floor(tomorrow.temperature);
  const roomTemp = Math.floor((sensibo.measurements.temperature * 1.8) + 32);

  if (sensibo.acState.on === true) {
    if (sensibo.acState.mode === "cool" || sensibo.acState.mode === "dry") {
      if (outdoorTemp < 60 && roomTemp < 75) {
        await turnAcOff(sensibo);
        await sendToDiscord(true, `Outdoor Temp ${outdoorTemp}°F < 60°F`, true, "Fan", 70);
      } else if (runTime < 8) {
        await turnAcOff(sensibo);
        await sendToDiscord(true, "Time is after 12:00AM", true, "Fan", 70);
      } else {
        await sendToDiscord(false, `Outdoor Temp ${outdoorTemp}°F and/or Room Temp. ${roomTemp}°F are still warm`, true, "Fan", 70);
      }
    }
    if (sensibo.acState.mode === "fan") {
      if (outdoorTemp >= 75 && outdoorTemp < 122) {
        if (runTime >= 8) {
          await turnAcOn("cool", 70);
          await sendToDiscord(true, `Outdoor Temp ${outdoorTemp}°F >= 75°F`, true, "Cool", 70);
        } else {
          await sendToDiscord(false, `Outdoor Temp ${outdoorTemp}°F, but deferring Cool Mode until 8:00AM`, true, "Cool", 70);
        }
      } else if (roomTemp >= 75) {
        if (runTime >= 8) {
          await turnAcOn("cool", 70);
          await sendToDiscord(true, `Room Temp ${outdoorTemp}°F >= 75°F`, true, "Cool", 70);
        } else {
          await sendToDiscord(false, `Room Temp ${outdoorTemp}°F, but deferring Cool Mode until 8:00AM`, true, "Cool", 70);
        }
      }
    }
    if (sensibo.acState.mode === "heat") {
      if (outdoorTemp < -22) {
        await turnAcOff(sensibo);
        await sendToDiscord(true, `Outdoor Temp ${outdoorTemp}°F < -22°F`, false, "Heat", 65);
      } else if (runTime >= 22 || runTime < 8) {
        await sendToDiscord(false, "Heat Mode will stay on between 10:00PM-8:00AM", true, "Heat", 65);
      } else if (roomTemp >= 75) {
        await turnAcOff(sensibo);
        await sendToDiscord(true, `Room Temp ${roomTemp}°F >= 75°F`, false, "Heat", 65);
      } else if (outdoorTemp >= 50) {
        await turnAcOff(sensibo);
        await sendToDiscord(true, `Outdoor Temp ${outdoorTemp}°F >= 50°F`, false, "Heat", 65);
      } else {
        await sendToDiscord(false, `Outdoor Temp ${outdoorTemp}°F and/or Room Temp. ${roomTemp}°F are still cold`, true, "Heat", 65);
      }
    }
  } else if (sensibo.acState.on === false && sensibo.acState.mode === "heat") {
    if ((runTime >= 22 || runTime < 8) && outdoorTemp > -22 && outdoorTemp < 35) {
      await turnAcOn("heat", 65);
      await sendToDiscord(true, `Outdoor Temp ${outdoorTemp}°F < 35°F tonight`, true, "Heat", 65);
    } else if (roomTemp < 70 && outdoorTemp > -22 && outdoorTemp < 35) {
      await turnAcOn("heat", 65);
      await sendToDiscord(true, `Outdoor Temp ${outdoorTemp}°F <= 35°F`, true, "Heat", 65);
    } else if (roomTemp < 65 && outdoorTemp > -22 && outdoorTemp < 86) {
      await turnAcOn("heat", 65);
      await sendToDiscord(true, `Room Temp ${roomTemp}°F <= 65°F`, true, "Heat", 65);
    } else {
      await sendToDiscord(false, `Outdoor Temp ${outdoorTemp}°F and/or Room Temp. ${roomTemp}°F are still warm`, true, "Heat", 65);
    }
  } else {
    await sendToDiscord(false, "A/C is off, no action taken", false, "Cool", 70);
  }
}

async function turnAcOn(mode, temp) {
  const url = `https://home.sensibo.com/api/v2/pods/${SENSIBO_DEVICE_ID}/acStates?apiKey=${SENSIBO_API_KEY}`;
  const headers = new Headers({"Content-Type": "application/json"});
  const body = JSON.stringify({
    acState: {
      on: true,
      mode,
      fanLevel: "auto",
      targetTemperature: temp,
      temperatureUnit: "F"
    }
  });
  const init = {
    method: "POST",
    headers,
    body
  }

  await fetch(url, init);
}

async function turnAcOff(sensibo) {
  let body;
  if (sensibo.acState.mode === "cool" || sensibo.acState.mode === "dry") {
    body = JSON.stringify({
      acState: {
        on: true,
        mode: "fan",
        fanLevel: "auto"
      }
    });
  } else if (sensibo.acState.mode === "heat") {
    body = JSON.stringify({
      acState: {
        on: false,
        mode: "heat",
        fanLevel: "auto",
      }
    });
  }
  const url = `https://home.sensibo.com/api/v2/pods/${SENSIBO_DEVICE_ID}/acStates?apiKey=${SENSIBO_API_KEY}`;
  const headers = new Headers({"Content-Type": "application/json"});
  const init = {
    method: "POST",
    headers,
    body
  }

  await fetch(url, init);
}

async function sendToDiscord(updated, reason, power, mode, temp) {
  const url = `https://discord.com/api/v9/channels/${DISCORD_CHANNEL_ID}/messages`;
  const headers = new Headers({
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json"
  });
  const payload = {
    embeds: [{
      title: updated ? "A/C State Updated" : "A/C State Not Updated",
      description: updated ? "The state of the A/C was changed to the following settings:" : "The A/C State was not updated for the following reason:",
      color: 3195298,
      fields: [],
    }]
  };
  if (updated === false) {
    payload.embeds[0].fields.push({
      name: "Reason",
      value: reason,
      inline: true
    });
  } else {
    payload.embeds[0].fields.push({
      name: "Power",
      value: power ? "On" : "Off",
      inline: true
    });
    if (power === true) {
      payload.embeds[0].fields.push({
        name: "Mode",
        value: mode,
        inline: true
      });
      if (mode !== "Fan") {
        payload.embeds[0].fields.push({
          name: "Temp",
          value: `${temp}°F`,
          inline: true
        });
      }
    }
    payload.embeds[0].fields.push({
      name: "Reason",
      value: reason,
      inline: true
    });
  }

  const init = {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  }
  console.log("Posting to Discord...");
  console.log(payload);
  const response = await fetch(url, init);
  const text = await response.text();
  console.log(text);
}
