// Sample data (replace this with your actual data)
// const data = generateRandomData(5, 20); // Example with 5 processes and 20 events

// Fetch data using d3
const data = d3.json('ping-pong-otf2.json').then(data => {
    console.log(data);
    const processes = data
        .map(d => d['Process'])
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
    const depths = data
        .map(d => d['_depth'])
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();

    // Set up SVG container with margins
    const margin = { top: 20, right: 50, bottom: 50, left: 70 }; // Adjust margins as needed
    const svgWidth = window.innerWidth - margin.left - margin.right;
    const svgHeight = 70 + 25 * processes.length;
    const svg = d3
        .select('#visualization')
        .append('svg')
        .attr('width', svgWidth + margin.left + margin.right)
        .attr('height', svgHeight + margin.top + margin.bottom);

    // Define scales
    const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, d => d['Timestamp (ns)'])])
        .range([margin.left, svgWidth - margin.right]);

    const yScale = d3
        .scaleBand()
        .domain(processes)
        .range([margin.top, svgHeight - margin.bottom]);

    // Color by event name
    const colorScale = d3
        .scaleOrdinal(d3.schemeCategory10)
        .domain(data.map(d => d['Name']));

    // Add alternating row background
    svg.selectAll('.background')
        .data(processes.filter((d, i) => i % 2 === 0))
        .enter()
        .append('rect')
        .attr('class', 'background')
        .attr('x', margin.left)
        .attr('y', d => yScale(d))
        .attr('width', svgWidth - margin.left - margin.right)
        .attr('height', yScale.bandwidth())
        .attr('fill', '#f0f0f0');

    // Create a group element and apply a clip-path to it
    const main = svg.append('g')
        .attr('clip-path', 'url(#clip)');

    // Define the clipPath
    svg.append('defs')
        .append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', svgWidth - margin.left - margin.right)
        .attr('height', svgHeight - margin.top - margin.bottom)
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Draw rectangles for enter events
    const rectG = main
        .selectAll('.enter-event')
        .data(data.filter(d => d['Event Type'] === 'Enter'))
        .enter()
        .append('g'); // Use a group to contain both the rectangle and the text

    const rects = rectG.append('rect')
        .attr('class', 'enter-event')
        .attr('x', d => xScale(d['Timestamp (ns)']))
        .attr('y', d => yScale(d['Process']))
        .attr('width', d =>
            Math.abs(
                xScale(d['_matching_timestamp']) - xScale(d['Timestamp (ns)']),
            ),
        )
        .attr('height', yScale.bandwidth() * 0.9)
        .attr('fill', d => colorScale(d['Name']))
        .attr('opacity', 1);

    // Create a clipPath for each rectangle
    const clips = rectG.append('clipPath')
        .attr('id', (d, i) => 'clip' + i)
        .append('rect')
        .attr('x', d => xScale(d['Timestamp (ns)']))
        .attr('y', d => yScale(d['Process']))
        .attr('width', d =>
            Math.abs(
                xScale(d['_matching_timestamp']) - xScale(d['Timestamp (ns)']),
            ),
        )
        .attr('height', yScale.bandwidth() * 0.9);

    // Add text inside the rectangles
    const labels = rectG.append('text')
        .attr('x', d => xScale(d['Timestamp (ns)']) + 5) // Adjust these values as needed
        .attr('y', d => yScale(d['Process']) + yScale.bandwidth() / 2)
        .attr('dy', '.35em') // Vertically center text
        .text(d => d['Name'])
        .attr('class', 'function-label')
        .attr('fill', 'black') // Adjust as needed
        .attr('clip-path', (d, i) => 'url(#clip' + i + ')'); // Apply the clipPath to this label

    // Draw circles for instant events
    const dots = main
        .selectAll('.instant-event')
        .data(data.filter(d => d['Event Type'] === 'Instant'))
        .enter()
        .append('circle')
        .attr('class', 'instant-event')
        .attr('cx', d => xScale(d['Timestamp (ns)']))
        .attr('cy', d => yScale(d['Process']) + yScale.bandwidth() / 2)
        .attr('r', 5)
        .attr('fill', d => colorScale(d['Name']));

    // Add x axis
    const xAxis = d3.axisTop(xScale);

    function formatNanoSeconds(ns) {
        if (ns < 1000) return ns + " ns";
        else if (ns < 1e6) return (ns / 1e3).toFixed(2) + " µs";
        else if (ns < 1e9) return (ns / 1e6).toFixed(2) + " ms";
        else return (ns / 1e9).toFixed(2) + " s";
    }

    xAxis.tickFormat(formatNanoSeconds);

    const gX = svg
        .append('g')
        .attr('transform', `translate(0, ${margin.top})`)
        .attr('class', 'axis x-axis')
        .call(xAxis);

    // Add y axis
    const yAxis = d3.axisLeft(yScale).tickFormat(function (d) {
        return 'Process ' + d;
    });
    svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',0)')
        .attr('class', 'axis y-axis')
        .call(yAxis)
        .selectAll(".tick line").remove() // This removes the tick lines
        .selectAll(".domain").remove(); // This removes the axis line
    svg.selectAll(".y-axis .domain").remove();

    // Define zoom function
    const zoom = d3
        .zoom()
        .scaleExtent([0.5, 1000]) // This controls the minimum and maximum zoom scale
        .on('zoom', updateChartOnZoom);

    // Apply zoom to the SVG
    svg.call(zoom);

    function updateChartOnZoom(e) {
        // Rescale the x-axis
        const newXScale = e.transform.rescaleX(xScale);
        gX.call(xAxis.scale(newXScale));

        // Update the position and width of the rectangles
        rects
            .attr('x', d => newXScale(d['Timestamp (ns)']))
            .attr(
                'width',
                d =>
                    newXScale(d['_matching_timestamp']) -
                    newXScale(d['Timestamp (ns)']),
            );

        // Update the position of the dots
        dots.attr('cx', d => newXScale(d['Timestamp (ns)']));

        // Update the position of the clips
        clips
            .attr('x', d => newXScale(d['Timestamp (ns)']))
            .attr(
                'width',
                d =>
                    newXScale(d['_matching_timestamp']) -
                    newXScale(d['Timestamp (ns)']),
            );
        
        labels.attr('x', d => newXScale(d['Timestamp (ns)']) + 5);

        // Update the text of the labels
        labels.each(function(d) {

            const label = d3.select(this);
            // const labelX = newXScale(d['Timestamp (ns)']) + 5;

            // Use force simulation to avoid label collisions
            // const simulation = d3.forceSimulation(data)
            //     .force('x', d3.forceX(d => newXScale(d['Timestamp (ns)'])).strength(1))
            //     // .force('y', d3.forceY(d => yScale(d['Process'])).strength(1))
            //     .force('collide', d3.forceCollide(5))
            //     .stop();

            // for (let i = 0; i < 5; ++i) simulation.tick();

            // Update the x position of the label based on the simulation
            // d3.select(this).attr('x', d => d.x);
            // d3.select(this).attr('y', d => d.y);

            // // Update the position of the label
            // d3.select(this).attr('x', d => d.x);
            // d3.select(this).attr('y', d => d.y);

            // Calculate the ideal position of the label
            // Label should be centered but avoid collisions with other labels

            // // Get the current label
            // const labelWidth = label.node().getBBox().width;
            const labelX = newXScale(d['Timestamp (ns)']) + 5;
            // const labelY = yScale(d['Process']) + yScale.bandwidth() / 2;

            // // Find the largest gap between nested function calls to place the label
            // const gaps = [];
            // const labels = d3.selectAll('.function-label');
            // labels.each(function(other) {
            //     if (other === d) return;
            //     const otherLabel = d3.select(this);
            //     const otherLabelX = newXScale(other['Timestamp (ns)']) + 5;
            //     const otherLabelY = yScale(other['Process']) + yScale.bandwidth() / 2;
            //     if (otherLabelY === labelY) {
            //         gaps.push(otherLabelX - labelX - labelWidth);
            //     }
            // });
            // const gap = Math.max(...gaps);

            // // Move the label to the right
            // label.attr('x', labelX + gap);


            // Check if the label collides with any other label
            // let collision = false;
            // labels.each(function(other) {
            //     if (other === d) return;
            //     const otherLabel = d3.select(this);
            //     const otherLabelX = newXScale(other['Timestamp (ns)']) + 5;
            //     const otherLabelY = yScale(other['Process']) + yScale.bandwidth() / 2;
            //     if (Math.abs(otherLabelX - labelX) < labelWidth && Math.abs(otherLabelY - labelY) < 10) {
            //         collision = true;
            //     }
            // });

            // // If there is a collision, move the label to the right
            // if (collision) {
            //     label.attr('x', newXScale(d['Timestamp (ns)']) + 5 + labelWidth);
            // }

            // // If the label is out of the screen, move it to the left
            // if (labelX + labelWidth > svgWidth - margin.right) {
            //     label.attr('x', svgWidth - margin.right - labelWidth);
            // }

            // If the label is out of the screen, move it to the left
            if (labelX < margin.left) {
                label.attr('x', margin.left + 5);
            }
        });

        // Update the position of the labels
    }

    // // Add mouseover and mouseout events to the rectangles for enter events
    // svg.selectAll('.enter-event')
    //     .on('mouseover', function () {
    //         d3.select(this).attr('fill', 'green'); // Change color to green on mouseover
    //         console.log(d3.select(this).data()[0]);
    //     })
    //     .on('mouseout', function (d) {
    //         d3.select(this).attr('fill', d => colorScale(d['Name'])); // Change color back to original on mouseout
    //     });

    // // Add mouseover and mouseout events to the circles for instant events
    // svg.selectAll('.instant-event')
    //     .on('mouseover', function () {
    //         d3.select(this).attr('fill', 'green'); // Change color to green on mouseover
    //         console.log(d3.select(this).data()[0]);
    //     })
    //     .on('mouseout', function (d) {
    //         d3.select(this).attr('fill', d => colorScale(d['Name'])); // Change color back to original on mouseout
    //     });

    // Print info about clicked object on click
    svg.selectAll('.enter-event, .instant-event').on('click', function (d) {
        console.log(d3.select(this).data()[0]);
    });
});
