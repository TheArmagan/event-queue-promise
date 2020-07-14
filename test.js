let EventQueue = require("./index");

let queue = new EventQueue();

Array(10).fill("").forEach((_,i)=>{
    queue.push(()=>{
        return new Promise((r,re)=>{
            let ms = i*1000;
            console.log("add",i,ms);
            setTimeout(()=>{
                r(i);
                console.log(queue.eventQueue)
            },ms);
        })
    }).then((i)=>{
        console.log("end",i);
    })
})