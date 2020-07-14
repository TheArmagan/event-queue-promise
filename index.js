const { EventEmitter } = require("events");
const cryptoRandomString = require("crypto-random-string");

/**
 * Main function is `.push()`
 * 
 * @param {Object} options
 * @param {Number} options.emptyCheckDelay - If the list is empty, the delay to check the list again in milliseconds. (Default: 250)
 * @param {Number} options.checkDelay - Delay in milliseconds to check the list again after an event is finished. (Default: 0)
 */
function EventQueue(options={}) {

    const self = this;

    options.emptyCheckDelay = typeof options.checkDelay == "undefined" ? 250 : options.checkDelay;
    options.checkDelay = typeof options.checkDelay == "undefined" ? 0 : options.checkDelay;

    /** @type {Array<{id:string, event:function}>} */
    const eventQueue = [];
    const queueEvents = new EventEmitter();
    let isEventInProcess = false;

    this.eventQueue = eventQueue;
    this.queueEvents = queueEvents;
    this.isEventInProcess = isEventInProcess;

    async function checkQueue() {
        if (isEventInProcess) return;
        
        if (eventQueue.length != 0) {
            isEventInProcess = true;
            let event = eventQueue.shift();
            try {
                let result = await event.event();
                queueEvents.emit(`resolve:${event.id}`,result);
            } catch (error) {
                queueEvents.emit(`reject:${event.id}`,error);
            }
            isEventInProcess = false;
            setTimeout(()=>{checkQueue();},0);
        } else {
            setTimeout(()=>{checkQueue();},options.emptyCheckDelay);
        }
    }

    /** Manually check the queue. (Not Recommended) */
    this.checkQueue = checkQueue;

    /**
     * @param {function} eventToQueue The queued event, should be async.
     * @param {string} eventId Should be unique. (Not Required)
     */
    this.push = function (eventToQueue=()=>{}, eventId=""){
        eventId = eventId || cryptoRandomString({length: 16});
        let promise = new Promise((resolve, reject)=>{ 
            self.eventQueue.push({id: eventId, event: eventToQueue});
            queueEvents.once(`resolve:${eventId}`,(result)=>{
                queueEvents.removeAllListeners(`resolve:${eventId}`);
                queueEvents.removeAllListeners(`reject:${eventId}`);
                resolve(result);
            });
            queueEvents.once(`reject:${eventId}`,(error)=>{
                queueEvents.removeAllListeners(`resolve:${eventId}`);
                queueEvents.removeAllListeners(`reject:${eventId}`);
                reject(error);
            });
            checkQueue();
        });
        return {...promise, id: eventId};
    };

}

module.exports = EventQueue;