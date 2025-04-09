// spotify-csv-transformer.js
// Node.js script to transform Spotify ranking CSV data

import fs from "fs";
import path from "path";
import { parse, stringify } from "csv";

// Check command line arguments
if (process.argv.length < 4) {
	console.log(
		"Usage: node spotify-csv-transformer.js <input-csv-file> <output-json-file>"
	);
	process.exit(1);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3];

// Transform function that converts the CSV data into the format needed for the chart
function transformSpotifyData(csvData) {
	// Group by track URI to identify unique songs
	const tracksByUri = {};
	csvData.forEach((row) => {
		if (!tracksByUri[row.uri]) {
			tracksByUri[row.uri] = [];
		}
		tracksByUri[row.uri].push(row);
	});

	// Get all weeks in the dataset
	const allWeeks = [...new Set(csvData.map((d) => d.week))].sort((a, b) => {
		// Parse dates in MM/DD/YYYY format
		const [monthA, dayA, yearA] = a.split("/");
		const [monthB, dayB, yearB] = b.split("/");
		return (
			new Date(yearA, monthA - 1, dayA) -
			new Date(yearB, monthB - 1, dayB)
		);
	});

	// Get top tracks for visualization (limit to tracks that appear in the top ranks)
	// For production use, you might want to set a threshold like top 20
	const RANK_THRESHOLD = 20;
	const topTrackUris = Object.keys(tracksByUri).filter((uri) => {
		return tracksByUri[uri].some((d) => parseInt(d.rank) <= RANK_THRESHOLD);
	});

	// Format data for visualization
	const formattedData = topTrackUris.map((uri) => {
		const trackData = tracksByUri[uri];
		// Get the first instance to get track name and artist
		const firstEntry = trackData[0];

		// Create the rankings array with nulls for weeks the track wasn't on the chart
		const rankings = allWeeks.map((week) => {
			const weekData = trackData.find((d) => d.week === week);
			return weekData ? parseInt(weekData.rank) : null;
		});

		return {
			song: firstEntry.track_name,
			artist: firstEntry.artist_names,
			uri: uri,
			rankings: rankings,
			// Additional data that might be useful
			peakRank: Math.min(...trackData.map((d) => parseInt(d.rank))),
			totalWeeks: Math.max(
				...trackData.map((d) => parseInt(d.weeks_on_chart))
			),
			quarters: [
				...new Set(trackData.map((d) => d.quarter).filter((q) => q)),
			], // Filter out empty quarter values
		};
	});

	return {
		tracks: formattedData,
		weeks: allWeeks,
	};
}

// Process the CSV file
fs.readFile(inputFile, "utf8", (err, data) => {
	if (err) {
		console.error(`Error reading file: ${err}`);
		process.exit(1);
	}

	// Parse CSV with relaxed settings to handle the empty 12th column
	parse(
		data,
		{
			columns: [
				"rank",
				"uri",
				"artist_names",
				"track_name",
				"source",
				"peak_rank",
				"previous_rank",
				"weeks_on_chart",
				"streams",
				"week",
				"quarter",
			],
			skip_empty_lines: true,
			from_line: 2, // Skip header row
			relax_column_count: true, // Allow rows with inconsistent column counts
		},
		(err, records) => {
			if (err) {
				console.error(`Error parsing CSV: ${err}`);
				process.exit(1);
			}

			// Transform the data
			const transformedData = transformSpotifyData(records);

			// Write output to JSON file
			fs.writeFile(
				outputFile,
				JSON.stringify(transformedData, null, 2),
				(err) => {
					if (err) {
						console.error(`Error writing output file: ${err}`);
						process.exit(1);
					}
					console.log(
						`Successfully transformed data and wrote to ${outputFile}`
					);
					console.log(
						`Processed ${transformedData.tracks.length} tracks across ${transformedData.weeks.length} weeks`
					);
				}
			);
		}
	);
});
