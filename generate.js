// Function to generate MPI event data
function randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomName() {
    const names = ["Alice", "Bob", "Charlie", "MPI_Send"];
    return randomFromArray(names);
}

function randomDuration() {
    return Math.floor(Math.random() * 100);
}

function generateRandomData(numProcesses, numEvents) {
    const allEvents = {
        0: [],
        1: []
    };

    const times = {
        0: randomDuration(),
        1: randomDuration(),
    };
    const stacks = {
        0: [],
        1: [],
    };

    function generateForProcess(process) {
        let time = times[process];
        let stack = stacks[process];
        let events = allEvents[process];

        while (time < 1000) {
            let eventType;

            if (stack.length) {
                // make it exponentially harder to generate an enter event based on the number of events in the stack
                const p = Math.pow(0.5, stack.length);
                if (Math.random() > p) {
                    eventType = "leave";
                } else {
                    eventType = "enter";
                }
            } else {
                eventType = "enter";
            }

            if (eventType == "enter") {
                events.push({
                    process: process,
                    name: randomName(),
                    time: time,
                    eventType: "enter",
                    matchingTime: null,
                    matchingEvent: null,
                    depth: stack.length
                });
                stack.push(events.length - 1);
            } else {
                const index = stack.pop();
                events[index].matchingEvent = events.length;
                events[index].matchingTime = time;
                events.push({
                    process: process,
                    name: events[index].name,
                    time: time,
                    eventType: "leave",
                    matchingTime: events[index].time,
                    matchingEvent: index,
                    depth: stack.length
                });

                // MPI send instant event
                // if (data[index].name == "MPI_Send") {
                //     data.push({
                //         process: 0,
                //         name: "MpiSend",
                //         time: time - (randomDuration() / 20),
                //         eventType: "instant",
                //         recvProcess: 1,
                //         depth: stack.length,
                //     });

                //     const recvTime = time + randomDuration();

                //     data.push({
                //         process: 1,
                //         name: "MpiRecv",
                //         time: recvTime,
                //         eventType: "instant",
                //         matchingTime: time,
                //         sendProcess: 0,
                //     });
                // }
            }

            time += randomDuration();
        }

        while (stack.length) {
            const index = stack.pop();
            events[index].matchingEvent = events.length;
            events[index].matchingTime = time;
            events.push({
                process: process,
                name: events[index].name,
                time: time,
                eventType: "leave",
                matchingTime: events[index].time,
                matchingEvent: index,
                depth: stack.length
            });
        }
    }

    generateForProcess(0);


    return allEvents[0];
}

function generateRandomDataOld(numProcesses, numEvents) {
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