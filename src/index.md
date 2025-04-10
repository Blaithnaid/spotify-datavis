---
toc: false
sidebar: false
author: "Iarla Sparrow Burke"
---

```js
// imports
import * as d3 from "d3";
import { bumpChart } from "./components/bumpChart.js";
import { createSpotifyBumpChart } from "./components/spotifyDataLoader.js";

// our sample dataset. gottq switch it out
const data = FileAttachment("./data/spotify_top50.csv").csv({ typed: true });
console.log(data);
```

<div class="hero">
  <h1>Spotify Rankings</h1>
  <h2>This visualization shows how the top songs on Spotify change over the course of 2024. Each line represents a track, and the position shows its ranking in that specific week. The data was taken from <a style="color: #18B44F;" href="https://www.kaggle.com/datasets/federicocester97/spotify-global-chart-2024">this dataset.</a></h2>
</div>

# The Chart

For the sake of visual clarity, only 1 quarter of the year can be viewed at a time.

*You can set the number of tracks and quarter shown with the controls below.

*To open a song on Spotify, simply click on one of its nodes.*

```js
const selectedQuarter = view(
	Inputs.radio([1, 2, 3, 4], {
		label: "Select which quarter to view:",
		value: 1,
	})
);
const numOfTracks = view(Inputs.select([5, 10, 15, 20, 25, 30, 35, 40, 45, 50], {value: 15, label: "Number of tracks to show: "}));
```

```js
display(
	(() => {
		// Reference the selectedQuarter to establish dependency
		const quarter = selectedQuarter;
    const trackCount = numOfTracks;

		return bumpChart(data, {
			width: window.innerWidth - 20,
			height: 800,
			margin: { left: 0, right: 0, top: 40, bottom: 80 },
			trackCount: trackCount,
			quarter: quarter, // Use the local variable
			drawingStyle: "transit",
			labelStyle: "left",
		});
	})()
);

// Generate tables for top X songs at the end of each quarter
const quarters = [1, 2, 3, 4];
quarters.forEach((quarter) => {
  const quarterData = data.filter(d => d.quarter === quarter)
                          .sort((a, b) => a.rank - b.rank)
                          .slice(0, numOfTracks);

  const table = d3.select('body').append('table')
    .attr("class", `quarter-table quarter-${quarter}`)
    .style("border-collapse", "collapse")
    .style("border", "2px black solid")
    .style("margin", "20px 0");

  // Table header
  table.append("thead").append("tr")
    .selectAll("th")
    .data(["Rank", "Track", "Artist"])
    .enter().append("th")
    .text(d => d)
    .style("border", "1px lightgray solid")
    .style("padding", "5px")
    .style("background-color", "dimgray")
    .style("font-weight", "bold")
    .style("text-transform", "uppercase");

  // Table rows
  const tbody = table.append("tbody");
  quarterData.forEach(row => {
    const tr = tbody.append("tr");
    tr.append("td").text(row.rank).style("border", "1px lightgray solid").style("padding", "5px");
    tr.append("td").text(row.track).style("border", "1px lightgray solid").style("padding", "5px");
    tr.append("td").text(row.artist).style("border", "1px lightgray solid").style("padding", "5px");
  });
});
```

---

<style>

* {
  --accent: #2D856B;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 0 0 2rem;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 14vw;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(30deg, #1ED760, currentColor);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero h2 {
  margin: 0;
  max-width: 34em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: #999;
}

a {
  color: #1ED760;
}

@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}

</style>
