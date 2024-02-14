// Sample data (replace this with your actual data)
// const data = generateRandomData(5, 20); // Example with 5 processes and 20 events

// Fetch data using d3
const data = d3.json("ping-pong-otf2.json")
    .then(data => {
        console.log(data);
        const processes = data.map(d => d["Process"]).filter((value, index, self) => self.indexOf(value) === index).sort();
        const depths = data.map(d => d["_depth"]).filter((value, index, self) => self.indexOf(value) === index).sort();

        // Set up SVG container with margins
        const margin = { top: 20, right: 50, bottom: 50, left: 60 }; // Adjust margins as needed
        const svgWidth = window.innerWidth - margin.left - margin.right;
        const svgHeight = 70 + 20 * processes.length;
        const svg = d3.select("#visualization")
            .append("svg")
            .attr("width", svgWidth + margin.left + margin.right)
            .attr("height", svgHeight + margin.top + margin.bottom);

        // Define scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d["Timestamp (ns)"])])
            .range([margin.left, svgWidth - margin.right]);

        const yScale = d3.scaleBand()
            .domain(processes)
            .range([margin.top, svgHeight - margin.bottom]);

        // Color by event name
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(data.map(d => d["Name"]));

        // Add alternating row background
        svg.selectAll(".background")
            .data(processes.filter((d, i) => i % 2 === 0))
            .enter()
            .append("rect")
            .attr("class", "background")
            .attr("x", margin.left)
            .attr("y", d => yScale(d))
            .attr("width", svgWidth - margin.left - margin.right)
            .attr("height", yScale.bandwidth())
            .attr("fill", "#f0f0f0");

        const plot = svg.append("g");

        // Draw rectangles for enter events
        const rects = plot.selectAll(".enter-event")
            .data(data.filter(d => d["Event Type"] === "Enter"))
            .enter()
            .append("rect")
            .attr("class", "enter-event")
            .attr("x", d => xScale(d["Timestamp (ns)"]))
            .attr("y", d => yScale(d["Process"]))
            .attr("width", d => Math.abs(xScale(d["_matching_timestamp"]) - xScale(d["Timestamp (ns)"])))
            .attr("height", yScale.bandwidth() * 0.9)
            .attr("fill", d => colorScale(d["Name"]))
            .attr("opacity", 0.5)
            // inner box shadow with css
            .attr("class", "enter-event");

        // Draw circles for instant events
        const dots = plot.selectAll(".instant-event")
            .data(data.filter(d => d["Event Type"] === "Instant"))
            .enter()
            .append("circle")
            .attr("class", "instant-event")
            .attr("cx", d => xScale(d["Timestamp (ns)"]))
            .attr("cy", d => yScale(d["Process"]) + yScale.bandwidth() / 2)
            .attr("r", 5)
            .attr("fill", d => colorScale(d["Name"]));

        // Add x axis
        const xAxis = d3.axisBottom(xScale);
        const gX = svg.append("g")
            .attr("transform", "translate(0," + (svgHeight - margin.bottom) + ")")
            .call(xAxis);

        // Add y axis
        const yAxis = d3.axisLeft(yScale).tickFormat(function (d) { return "Process " + d; });
        svg.append("g")
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(yAxis);

        // Define zoom function
        const zoom = d3.zoom()
            .scaleExtent([0.5, 1000]) // This controls the minimum and maximum zoom scale
            .on("zoom", updateChartOnZoom);

        // Apply zoom to the SVG
        svg.call(zoom);

        function updateChartOnZoom(e) {
            // Rescale the x-axis
            const newXScale = e.transform.rescaleX(xScale);
            gX.call(xAxis.scale(newXScale));

            // Update the position and width of the rectangles
            rects.attr("x", d => newXScale(d["Timestamp (ns)"]))
                .attr("width", d => newXScale(d["_matching_timestamp"]) - newXScale(d["Timestamp (ns)"]));

            // Update the position of the dots
            dots.attr("cx", d => newXScale(d["Timestamp (ns)"]));
        }

        // Add mouseover and mouseout events to the rectangles for enter events
        svg.selectAll(".enter-event")
            .on("mouseover", function () {
                d3.select(this).attr("fill", "green"); // Change color to green on mouseover
                console.log(d3.select(this).data()[0]);
            })
            .on("mouseout", function (d) {
                d3.select(this).attr("fill", d => colorScale(d["Name"])); // Change color back to original on mouseout
            });

        // Add mouseover and mouseout events to the circles for instant events
        svg.selectAll(".instant-event")
            .on("mouseover", function () {
                d3.select(this).attr("fill", "green"); // Change color to green on mouseover
                console.log(d3.select(this).data()[0]);
            })
            .on("mouseout", function (d) {
                d3.select(this).attr("fill", d => colorScale(d["Name"])); // Change color back to original on mouseout
            });

    });