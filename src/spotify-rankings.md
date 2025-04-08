---
title: "Spotify Track Rankings Visualization"
author: "Your Name"
date: "April 8, 2025"
---

```js
// imports
import * as d3 from "d3";
import { bumpChart } from "./components/bumpChart.js";

// our sample dataset. gottq switch it out
const data = FileAttachment("./data/spotify_rankings_sample.json").json();
```

# Spotify Top Tracks Visualization

This visualization shows how the top songs on Spotify change over the course of 2024. Each line represents a track, and the position shows its ranking in that specific week. The data was taken from [this dataset.](https://www.kaggle.com/datasets/federicocester97/spotify-global-chart-2024)

```js
display(
	bumpChart(data, {
		width: 900,
		height: 500,
		margin: { left: -200, right: 200, top: 40, bottom: 80 },
		trackCount: 10,
		drawingStyle: "transit",
		labelStyle: "right",
	})
);
```
