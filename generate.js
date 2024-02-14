// Function to generate MPI event data
function randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomData(numProcesses, numEvents) {
    const names = ["Alice", "Bob", "Charlie", "David", "Eve",
        "Frank", "Grace", "Heidi", "Ivan", "Judy", "Kevin", "Linda",
        "Michael", "Nancy", "Oscar", "Peggy", "Quincy", "Rita", "Steve",
        "Tina", "Ursula", "Victor", "Wendy", "Xander", "Yvonne", "Zach"];

    const data = [];

    while (data.length < numEvents) {
        // event type is either "enter" or "instant"
        const eventType = randomFromArray(["enter", "instant"]);
        const process = Math.floor(Math.random() * numProcesses);
        const time = Math.floor(Math.random() * 1000); // Adjust the range as needed

        if (eventType == "enter") {
            const matchingTime = time + Math.floor(Math.random() * 100); // Ensure the receive time is after the send time
            data.push({
                process: process,
                name: randomFromArray(names),
                time: time,
                eventType: "enter",
                matchingTime: matchingTime
            });
        } else if (eventType == "instant") {
            const name = randomFromArray(["MpiSend", "MpiBarrier"]);

            if (name == "MpiSend") {
                const recvTime = time + Math.floor(Math.random() * 100); // Ensure the receive time is after the send time
                const recvProcess = (process + 1) % numProcesses; // Ensure the receiver is a different process

                // Instant events
                data.push({
                    process: process,
                    name: name,
                    time: time,
                    eventType: eventType,
                    matchingTime: recvTime,
                    recvProcess: recvProcess
                });
                data.push({
                    process: recvProcess,
                    name: "MpiRecv",
                    time: recvTime,
                    eventType: eventType,
                    matchingTime: time,
                    sendProcess: process
                });

                // MPI_Send and MPI_Recv function calls
                data.push({
                    process: process,
                    name: "MPI_Send",
                    time: time - Math.floor(Math.random() * 50), 
                    eventType: "enter",
                    matchingTime: time + Math.floor(Math.random() * 50),
                });
                data.push({
                    process: recvProcess,
                    name: "MPI_Recv",
                    time: recvTime - Math.floor(Math.random() * 50), 
                    eventType: "enter",
                    matchingTime: recvTime + Math.floor(Math.random() * 50),
                });
            } else {
                // MPI_Barrier
                for (let j = 0; j < numProcesses; j++) {
                    data.push({
                        process: j,
                        name: name,
                        time: time,
                        eventType: eventType,
                        matchingTime: null
                    });
                }
            }
        }

    }
    return data;
}