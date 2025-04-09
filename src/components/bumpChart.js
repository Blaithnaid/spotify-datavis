import * as d3 from "d3";

export function bumpChart(
  data,
  {
    width = 900,
    height = 600,
    margin = { left: 280, right: 20, top: 40, bottom: 80 }, // Increased left and right margins
    padding = 25,
    bumpRadius = 6,
    trackCount = 10,
    quarter = 1,
    valueFormat = d3.format(",d"),
  } = {}
) {
  // Filter data by quarter
  const filteredData = data.filter((d) => d.quarter === quarter);

  // Get unique weeks and sort them
  const weeks = [...new Set(filteredData.map((d) => d.week))].sort(
    (a, b) => a - b
  );
  console.log("Weeks:", weeks);
  const weekDates = weeks.map((w) => formatWeekDate(w));
  console.log("Week dates:", weekDates);

  // Find top tracks based on best rank (simplest approach)
  // For each week, get the top tracks that were in the chart that week
  const tracksByWeek = new Map();
  const allTopTracks = new Set();
  const color = d3.scaleOrdinal(d3.schemeTableau10).domain(d3.range(trackCount));

  weeks.forEach(week => {
    // Get data for this week and sort by rank
    const weekData = filteredData.filter(d => d.week === week)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, trackCount);

    // Store the top tracks for this week
    tracksByWeek.set(week, weekData);

    // Add all tracks to our master set
    weekData.forEach(d => allTopTracks.add(d.track_name));
  });

  console.log(`Found ${allTopTracks.size} unique tracks across all weeks`);

  // Create track data for all tracks that appeared in any week's top positions
  const trackData = Array.from(allTopTracks).map(track => {
    return {
      track: track,
      artist: getArtistForTrack(filteredData, track),
      weeklyRanks: weeks.map(week => {
        // Find this track's position in this week (if it was in the top tracks)
        const weekTopTracks = tracksByWeek.get(week);
        const match = weekTopTracks.find(d => d.track_name === track);

        return match
          ? {
            rank: match.rank - 1, // 0-indexed for display
            streams: +match.streams,
          }
          : null; // Track wasn't in the top N this week
      }),
    };
  });

  // Create line generator directly from the data
  const bx = d3
    .scalePoint()
    .domain(weeks.map((_, i) => i))
    .range([padding, width - margin.right - margin.left - padding]); // Adjusted range

  const by = d3
    .scalePoint()
    .domain(d3.range(trackCount))
    .range([margin.top, height - margin.bottom - padding]);

  const line = d3
    .line()
    .x((d, i) => bx(i))
    .y((d) => (d ? by(d.rank) : null))
    .defined((d) => d !== null);

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto; color: #fff;")
    .attr("font-family", "system-ui, sans-serif");

  // Create tooltip div
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0, 0, 0, 0.85)")
    .style("color", "white")
    .style("border-radius", "4px")
    .style("padding", "10px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "100");

  // Add a group for the chart content, offset by margins
  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`);

  // Draw vertical week lines inside the chart group
  chartGroup
    .append("g")
    .selectAll("path")
    .data(weeks)
    .join("path")
    .attr("stroke", "#ddd")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3")
    .attr("d", (d, i) =>
      d3.line()([
        [bx(i), margin.top - 10],
        [bx(i), height - margin.bottom],
      ])
    );

  // Draw bump lines inside the chart group
  const series = chartGroup
    .selectAll(".series")
    .data(trackData)
    .join("g")
    .attr("class", "series")
    .attr("opacity", 1)
    .attr("fill", (d, i) => d3.schemeTableau10[i % 10])
    .attr("stroke", (d, i) => d3.schemeTableau10[i % 10])
    .on("mouseover", highlight)
    .on("mouseout", restore);

  series
    .append("path")
    .attr("fill", "none")
    .attr("stroke-width", bumpRadius)
    .attr("d", (d) => line(d.weeklyRanks));

  // Draw circles at each point
  const bumps = series
    .selectAll("g")
    .data((d) =>
      d.weeklyRanks
        .map((v, i) => ({
          track: d.track,
          artist: d.artist,
          streams: v ? v.streams : 0,
          value: v,
          weekIndex: i,
          url: getTrackUrl(filteredData, d.track) // Get Spotify URL
        }))
        .filter((d) => d.value !== null) // ⬅️ Only keep valid values
    )
    .join("g")
    .attr(
      "transform",
      (d) => `translate(${bx(d.weekIndex)},${by(d.value.rank)})`
    )
    .style("cursor", "pointer") // Change cursor to pointer on hover
    .on("mouseover", function (event, d) {
      // Show detailed tooltip
      tooltip
        .style("visibility", "visible")
        .html(`
          <div>
            <strong>${d.track}</strong><br>
            <span>${d.artist}</span><br>
            Rank: ${d.value ? d.value.rank + 1 : "N/A"}<br>
            Streams: ${valueFormat(d.streams)}
          </div>
        `);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
    })
    .on("click", function (event, d) {
      // Open Spotify URL in a new tab
      if (d.url && d.url !== "#") {
        window.open(d.url, "_blank");
      }
    });

  bumps.append("circle").attr("r", bumpRadius);

  // Add rank number in circles
  bumps
    .filter((d) => d.value)
    .append("text")
    .attr("dy", "0.35em")
    .attr("fill", "white")
    .attr("stroke", "none")
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .style("font-size", "10px")
    .text((d) => d.value.rank + 1);

  // Draw axes
  const drawAxis = (g, x, y, axis) => {
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
        margin.left, // Start from left margin
        height - margin.bottom + padding,
        d3.axisBottom(bx.domain(weekDates)).tickSizeOuter(0)
      )
    )
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)");

  function highlight(_, d) {
    // Move current element to front for better visibility
    this.parentNode.appendChild(this);

    // Grey out all other tracks
    series.filter(s => s !== d)
      .transition().duration(500)
      .attr("opacity", 0.3);

    // Keep the hovered track at full opacity with original color
    d3.select(this)
      .transition().duration(500)
      .attr("opacity", 1);
  }

  function restore() {
    // Restore all tracks to their original appearance
    series.transition().duration(500)
      .attr("opacity", 1);
  }

  return Object.assign(svg.node(), {
    remove() {
      svg.remove();
      tooltip.remove();
    }
  });
}



// Format date for display
function formatWeekDate(dateStr) {
  const [day, month, year] = dateStr.split("/").map(Number);
  const date = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript
  if (isNaN(date)) {
    console.error(`Invalid date format: ${dateStr}`);
    return "Invalid Date";
  }
  return date.toLocaleDateString("en-US");
}

// Get Spotify URL for a track
function getTrackUrl(data, trackName) {
  const trackData = data.find((d) => d.track_name === trackName);
  return trackData?.url || "#";
}

// Get artist name for a track
function getArtistForTrack(data, trackName) {
  const trackData = data.find((d) => d.track_name === trackName);
  if (!trackData) return "";

  // Shorten artist name if too long
  const artist = trackData.artist_names;
  return artist.length > 20 ? artist.substring(0, 18) + "..." : artist;
}
