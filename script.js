// Function to generate random data
function generateRandomData(numProcesses, numEvents) {
    const comp = ["Alice", "Bob", "Charlie", "David", "Eve",
        "Frank", "Grace", "Heidi", "Ivan", "Judy", "Kevin", "Linda",
        "Michael", "Nancy", "Oscar", "Peggy", "Quincy", "Rita", "Steve",
        "Tina", "Ursula", "Victor", "Wendy", "Xander", "Yvonne", "Zach"];

    const comm = ["MPI_Send", "MPI_Recv", "MPI_Barrier", "MPI_Bcast", "MPI_Gather"];

    const processes = [];
    for (let i = 0; i < numProcesses; i++) {
        processes.push(i);
    }

    const data = [];
    for (let i = 0; i < numEvents; i++) {
        const processIndex = Math.floor(Math.random() * numProcesses);
        const compIndex = Math.floor(Math.random() * comp.length);
        const commIndex = Math.floor(Math.random() * comm.length);
        const eventType = Math.random() < 0.5 ? "enter" : "instant";
        const time = Math.floor(Math.random() * 1000); // Adjust the range as needed
        const matchingTime = eventType === "instant" ? null : time + Math.floor(Math.random() * 100); // Adjust the range as needed

        data.push({
            process: processes[processIndex],
            name: eventType === "instant" ? comm[commIndex] : comp[compIndex],
            time: time,
            eventType: eventType,
            matchingTime: matchingTime
        });
    }

    return data;
}

// Sample data (replace this with your actual data)
const data = generateRandomData(5, 20); // Example with 5 processes and 20 events

// const processes = data.map(d => d.process).sort().filter((value, index, self) => self.indexOf(value) === index);
// Get the unique processes
const processes = data.map(d => d.process).sort().filter((value, index, self) => self.indexOf(value) === index).sort();
console.log(processes);

// Set up SVG container with margins
const margin = { top: 20, right: 50, bottom: 50, left: 60 }; // Adjust margins as needed
const svgWidth = window.innerWidth - margin.left - margin.right;
const svgHeight = 40 * data.map(d => d.process).filter((value, index, self) => self.indexOf(value) === index).length;
const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", svgWidth + margin.left + margin.right)
    .attr("height", svgHeight + margin.top + margin.bottom);

// Define scales
const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.time > d.matchingTime ? d.time : d.matchingTime)])
    .range([margin.left, svgWidth - margin.right]);

const yScale = d3.scaleBand()
    .domain(data.map(d => d.process).sort())
    .range([margin.top, svgHeight - margin.bottom]);

// Color by event name
const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(data.map(d => d.name));

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

// Draw rectangles for enter events
svg.selectAll(".enter-event")
    .data(data.filter(d => d.eventType === "enter"))
    .enter()
    .append("rect")
    .attr("class", "enter-event")
    .attr("x", d => xScale(d.time))
    .attr("y", d => yScale(d.process))
    .attr("width", d => Math.abs(xScale(d.matchingTime) - xScale(d.time)))
    .attr("height", yScale.bandwidth())
    .attr("fill", d => colorScale(d.name));

// Draw circles for instant events
svg.selectAll(".instant-event")
    .data(data.filter(d => d.eventType === "instant"))
    .enter()
    .append("circle")
    .attr("class", "instant-event")
    .attr("cx", d => xScale(d.time))
    .attr("cy", d => yScale(d.process) + yScale.bandwidth() / 2)
    .attr("r", 5)
    .attr("fill", d => colorScale(d.name));

// Add x axis
svg.append("g")
    .attr("transform", "translate(0," + (svgHeight - margin.bottom) + ")")
    .call(d3.axisBottom(xScale));

// Add y axis
svg.append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(yScale).tickFormat(function (d) { return "Process " + d; }));

// Define zoom function
const zoom = d3.zoom()
    .scaleExtent([1, 10]) // This controls the minimum and maximum zoom scale
    .on("zoom", function () {
        svg.attr("transform", d3.event.transform);
    });

// Apply zoom to the SVG
svg.call(zoom);

// Add mouseover and mouseout events to the rectangles for enter events
svg.selectAll(".enter-event")
    .on("mouseover", function () {
        d3.select(this).attr("fill", "green"); // Change color to green on mouseover
        console.log(d3.select(this).data());
    })
    .on("mouseout", function (d) {
        d3.select(this).attr("fill", d => colorScale(d.eventType)); // Change color back to original on mouseout
    });

// Add mouseover and mouseout events to the circles for instant events
svg.selectAll(".instant-event")
    .on("mouseover", function () {
        d3.select(this).attr("fill", "green"); // Change color to green on mouseover
        console.log(d3.select(this).data());
    })
    .on("mouseout", function (d) {
        d3.select(this).attr("fill", d => colorScale(d.eventType)); // Change color back to original on mouseout
    });