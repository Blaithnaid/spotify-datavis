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

*You can set the number of tracks and quarter shown with the controls below.*

*To open a song on Spotify, simply click on one its nodes*

```js
const selectedQuarter = view(
	Inputs.radio([1, 2, 3, 4], {
		label: "Select which quarter to view:",
		value: 1,
	})
);
const numOfTracks = view(Inputs.select([5, 10, 15, 20, 25, 30], {value: 15, label: "Number of tracks to show: "}));
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

d3.text().then(function(datasetText) {
  var rows  = d3.csvParseRows(datasetText),
      table = d3.select('body').append('table')
                .style("border-collapse", "collapse")
                .style("border", "2px black solid");

  // headers
  table.append("thead").append("tr")
    .selectAll("th")
    .data(rows[0])
    .enter().append("th")
    .text(function(d) { return d; })
    .style("border", "1px black solid")
    .style("padding", "5px")
    .style("background-color", "lightgray")
    .style("font-weight", "bold")
    .style("text-transform", "uppercase");

  // data
  table.append("tbody")
    .selectAll("tr").data(rows.slice(1))
    .enter().append("tr")
    .selectAll("td")
    .data(function(d){return d;})
    .enter().append("td")
    .style("border", "1px black solid")
    .style("padding", "5px")
    .on("mouseover", function(){
    d3.select(this).style("background-color", "powderblue");
  })
    .on("mouseout", function(){
    d3.select(this).style("background-color", "white");
  })
    .text(function(d){return d;})
    .style("font-size", "12px");
});
```

---

## Next steps

Here are some ideas of things you could try…

<div class="grid grid-cols-4">
  <div class="card">
    Chart your own data using <a href="https://observablehq.com/framework/lib/plot"><code>Plot</code></a> and <a href="https://observablehq.com/framework/files"><code>FileAttachment</code></a>. Make it responsive using <a href="https://observablehq.com/framework/javascript#resize(render)"><code>resize</code></a>.
  </div>
  <div class="card">
    Create a <a href="https://observablehq.com/framework/project-structure">new page</a> by adding a Markdown file (<code>whatever.md</code>) to the <code>src</code> folder.
  </div>
  <div class="card">
    Add a drop-down menu using <a href="https://observablehq.com/framework/inputs/select"><code>Inputs.select</code></a> and use it to filter the data shown in a chart.
  </div>
  <div class="card">
    Import a <a href="https://observablehq.com/framework/imports">recommended library</a> from npm, such as <a href="https://observablehq.com/framework/lib/leaflet">Leaflet</a>, <a href="https://observablehq.com/framework/lib/dot">GraphViz</a>, <a href="https://observablehq.com/framework/lib/tex">TeX</a>, or <a href="https://observablehq.com/framework/lib/duckdb">DuckDB</a>.
  </div>
</div>

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
