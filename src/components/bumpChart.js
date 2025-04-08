import * as d3 from "d3";

export function bumpChart(
	data,
	{
		width = 900,
		height = 600,
		margin = { left: 180, right: 180, top: 40, bottom: 80 },
		padding = 25,
		bumpRadius = 6,
		trackCount = 10,
		drawingStyle = "default",
		labelStyle = "right",
		valueFormat = d3.format(",d"),
	} = {}
) {
	// Adjust margins based on labelStyle
	const adjustedMargin = { ...margin };
	if (labelStyle === "right") {
		adjustedMargin.left = 0; // Reduced left margin when no left labels
	} else if (labelStyle === "left") {
		adjustedMargin.right = 50; // Reduced right margin when no right labels
	}

	// Process the data to track rankings over time
	const weeks = [...new Set(data.map((d) => d.week))].sort();

	// Get top tracks based on average rank or frequency in top positions
	const topTracks = getTopTracks(data, trackCount);

	// Format data for chart
	const chartData = formatDataForChart(data, weeks, topTracks);

	// Set up scales and layout parameters
	const seq = (start, length) => Array.from({ length }, (_, i) => i + start);

	const ranking = getChartRanking(weeks, chartData, topTracks);
	const left = ranking.sort((a, b) => a.first - b.first).map((d) => d.track);
	const right = ranking.sort((a, b) => a.last - b.last).map((d) => d.track);

	// Create scales
	const bx = d3
		.scalePoint()
		.domain(seq(0, weeks.length))
		.range([
			0,
			width - adjustedMargin.left - adjustedMargin.right - padding * 2,
		]);

	const by = d3
		.scalePoint()
		.domain(seq(0, trackCount))
		.range([adjustedMargin.top, height - adjustedMargin.bottom - padding]);

	const ax = d3
		.scalePoint()
		.domain(weeks.map(formatWeekDate))
		.range([
			adjustedMargin.left + padding,
			width - adjustedMargin.right - padding,
		]);

	const y = d3
		.scalePoint()
		.range([adjustedMargin.top, height - adjustedMargin.bottom - padding]);

	const colorScale = d3
		.scaleOrdinal(d3.schemeTableau10)
		.domain(seq(0, topTracks.length));

	const strokeWidth = d3
		.scaleOrdinal()
		.domain(["default", "transit", "compact"])
		.range([3, bumpRadius * 2, 2]);

	// Create SVG
	const svg = d3
		.create("svg")
		.attr("viewBox", [0, 0, width, height])
		.attr("width", width)
		.attr("height", height)
		.attr("style", "max-width: 100%; height: auto; color: #fff;")
		.attr("font-family", "system-ui, sans-serif");

	// Draw vertical week lines
	svg.append("g")
		.attr("transform", `translate(${adjustedMargin.left + padding},0)`)
		.selectAll("path")
		.data(seq(0, weeks.length))
		.join("path")
		.attr("stroke", "#ddd")
		.attr("stroke-width", 1)
		.attr("stroke-dasharray", "3,3")
		.attr("d", (d) =>
			d3.line()([
				[bx(d), adjustedMargin.top - 10],
				[bx(d), height - adjustedMargin.bottom],
			])
		);

	// Create variables to store axis refs for highlight/restore
	let leftY, rightY;

	// Draw bump lines
	const series = svg
		.selectAll(".series")
		.data(chartData)
		.join("g")
		.attr("class", "series")
		.attr("opacity", 1)
		.attr("fill", (d, i) => colorScale(i))
		.attr("stroke", (d, i) => colorScale(i))
		.attr("transform", `translate(${adjustedMargin.left + padding},0)`)
		.on("mouseover", function (event, d) {
			// Highlight functionality
			const element = d3.select(this);
			element.raise();

			series
				.filter((s) => s !== d)
				.transition()
				.duration(500)
				.attr("opacity", 0.2);

			// Mark ticks
			markTick(leftY, 0);
			markTick(rightY, weeks.length - 1);

			function markTick(axis, pos) {
				axis.selectAll(".tick text")
					.filter((s, i) => i === d[pos].rank)
					.transition()
					.duration(500)
					.attr("font-weight", "bold")
					.attr("fill", element.attr("fill"));
			}
		})
		.on("mouseout", function () {
			// Restore functionality
			series.transition().duration(500).attr("opacity", 1);

			// Restore ticks
			restoreTicks(leftY);
			restoreTicks(rightY);

			function restoreTicks(axis) {
				axis.selectAll(".tick text")
					.transition()
					.duration(500)
					.attr("font-weight", "normal")
					.attr("fill", "white");
			}
		});

	// Draw lines connecting points
	series
		.selectAll("path")
		.data((d) => d)
		.join("path")
		.attr("stroke-width", strokeWidth(drawingStyle))
		.attr("d", (d, i) => {
			if (d.next)
				return d3.line()([
					[bx(i), by(d.rank)],
					[bx(i + 1), by(d.next.rank)],
				]);
		});

	// Draw circles at each point
	const bumps = series
		.selectAll("g")
		.data((d, i) =>
			d.map((v) => ({
				track: topTracks[i],
				artist: v.artist,
				streams: v.streams,
				value: v,
				first: d[0].rank,
			}))
		)
		.join("g")
		.attr("transform", (d, i) => `translate(${bx(i)},${by(d.value.rank)})`)
		.call((g) =>
			g
				.append("title")
				.text(
					(d) =>
						`${d.track} - ${d.artist}\nRank: ${
							d.value.rank + 1
						}\nStreams: ${valueFormat(d.streams)}`
				)
		);

	const compact = drawingStyle === "compact";
	bumps.append("circle").attr("r", compact ? 4 : bumpRadius);

	// Add rank number in circles
	if (!compact) {
		bumps
			.append("text")
			.attr("dy", "0.35em")
			.attr("fill", "white")
			.attr("stroke", "none")
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", "10px")
			.text((d) => d.value.rank + 1);
	}

	// Draw axes
	const drawAxis = (g, x, y, axis, domain) => {
		g.attr("transform", `translate(${x},${y})`)
			.call(axis)
			.call((g) => g.select(".domain").remove())
			.selectAll(".tick text")
			.attr("font-size", "10px");
	};

	// Bottom axis (weeks)
	svg.append("g")
		.call((g) =>
			drawAxis(
				g,
				0,
				height - adjustedMargin.top - adjustedMargin.bottom + padding,
				d3.axisBottom(ax).tickSizeOuter(0),
				true
			)
		)
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.8em")
		.attr("dy", ".15em")
		.attr("transform", "rotate(-45)");

	// Left axis (initial ranks))
	if (labelStyle === "left" || labelStyle === "both") {
		leftY = svg.append("g").call((g) =>
			drawAxis(
				g,
				adjustedMargin.left,
				0,
				d3
					.axisLeft(y.domain(left))
					.tickFormat((d) => `${d} - ${getArtistForTrack(data, d)}`),
				false
			)
		);
	}

	// Right axis (final ranks)
	if (labelStyle === "right" || labelStyle === "both") {
		rightY = svg.append("g").call((g) =>
			drawAxis(
				g,
				width - adjustedMargin.right,
				0,
				d3
					.axisRight(y.domain(right))
					.tickFormat((d) => `${d} - ${getArtistForTrack(data, d)}`),
				false
			)
		);
	}

	// Add title
	svg.append("text")
		.attr("x", width / 2)
		.attr("y", adjustedMargin.top / 2)
		.attr("text-anchor", "middle")
		.style("font-size", "16px")
		.style("font-weight", "bold")
		.style("fill", "white")
		.text("Spotify Top Tracks Ranking Changes");

	return svg.node();
}

// Format date for display
function formatWeekDate(dateStr) {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Get artist name for a track
function getArtistForTrack(data, trackName) {
	const trackData = data.find((d) => d.track_name === trackName);
	if (!trackData) return "";

	// Shorten artist name if too long
	const artist = trackData.artist_names;
	return artist.length > 20 ? artist.substring(0, 18) + "..." : artist;
}

// Extract top N tracks by overall performance
function getTopTracks(data, n = 10) {
	// Group by track name and calculate a score based on ranks
	// (lower rank = higher score since ranks are 1-200)
	const trackScores = d3.rollup(
		data,
		(v) => d3.sum(v, (d) => 201 - d.rank),
		(d) => d.track_name
	);

	// Sort by score and take top N tracks
	return Array.from(trackScores.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, n)
		.map((d) => d[0]);
}

// Format data for the bump chart
function formatDataForChart(data, weeks, tracks) {
	// Create a nested structure of track -> week -> rank
	const trackData = tracks.map((track) => {
		const trackPoints = weeks
			.map((week, i) => {
				// Find data for this track in the current week
				const point = data.find(
					(d) => d.track_name === track && d.week === week
				);

				if (!point) return null;

				return {
					rank: point ? point.rank - 1 : null, // Make ranks 0-indexed
					week: week,
					artist: point ? point.artist_names : "",
					streams: point ? +point.streams : 0,
					next: null, // Will connect points in next step
				};
			})
			.filter((p) => p !== null);

		// Connect points with next references
		for (let i = 0; i < trackPoints.length - 1; i++) {
			trackPoints[i].next = trackPoints[i + 1];
		}

		return trackPoints;
	});

	return trackData.filter((track) => track.length > 0);
}

// Calculate rankings for chart axis labels
function getChartRanking(weeks, chartData, tracks) {
	return chartData.map((d, i) => ({
		track: tracks[i],
		first: d[0]?.rank || 0,
		last: d[d.length - 1]?.rank || 0,
	}));
}
