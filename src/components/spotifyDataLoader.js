import * as d3 from "d3";
import { bumpChart } from "./bumpChart.js";

// Load and transform the CSV data for the bump chart
export async function loadSpotifyData() {
	// Load the CSV
	const csvData = await d3.csv("./data/spotify_data_2024.csv");

	// Clean up data (handle parsing errors, convert types)
	const cleanedData = csvData
		.filter((d) => d.rank && d.track_name && d.week) // filter out rows with missing key data
		.map((d) => ({
			rank: +d.rank, // Convert to number
			track_name: d.track_name,
			artist_names: d.artist_names,
			streams: +d.streams, // Convert to number
			week: d.week, // Keep as ISO date string format
			uri: d.uri,
		}));

	return cleanedData;
}

// Create and return the bump chart
export async function createSpotifyBumpChart(options = {}) {
	const data = await loadSpotifyData();

	// Set default options and merge with any provided options
	const chartOptions = {
		width: options.width || window.innerWidth - 40,
		height: options.height || 600,
		margin: options.margin || {
			left: 180,
			right: 180,
			top: 40,
			bottom: 80,
		},
		trackCount: options.trackCount || 10,
		drawingStyle: options.drawingStyle || "default",
		labelStyle: options.labelStyle || "right",
	};

	// Create the bump chart
	return bumpChart(data, chartOptions);
}
