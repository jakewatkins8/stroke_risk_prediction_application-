import { BASE_URL } from "./store/environment";

/* Function to log browser errors to the Flask server, both caught and uncaught.
(Uncaught errors are logged using a window.onerror listener in index.js.)
*/

// Place errors in a queue and bypass/count duplicates?

// errorQueue array to hold ref's to all errors before they are sent to the server:
const errorQueue = [];

// --> add a caveat for if the queue gets too big...to avoid an infinite logging loop where the queue is never sent?

// timer variable to hold a setTimeout that submits the errorQueue to server.
// resets to 3 sec anytime logToErrorQueue is called.
// once time elapsed, the errorQueue is submitted to the server.
let queueSubmitTimer;

// timer variable to hold a timeout that...hm. what?
// 
//          *           *               *
let queueOverflowTimer;


// if a queue overflow occurs, this variable will be set to the start time of a queueOverflowTimer
let blockSetTime;

// testing
let totalThrown = 0;

export const logToErrorQueue = (error) => {

    // if queueOverflowTimer contains a timeOut,
    // block the error from being logged in the queue.
    // Errors will be blocked until the queueOverflowTimer is up. 
    if (queueOverflowTimer) {
        // console.log(`blocking errors for now, as of ${blockSetTime}.`);
        return;
    }


    // debug, maybe:
    // console.log('#:', totalThrown);

    if (totalThrown >= 10) {

        if (queueSubmitTimer) clearTimeout(queueSubmitTimer);

        // set a 3-minute queue block to prevent any errors logging for the next 3 minutes:
        if (!queueOverflowTimer) {
            blockSetTime = new Date().toISOString();
            // the below line seems redundant, but:
            clearTimeout(queueOverflowTimer);
            queueOverflowTimer = setTimeout(() => {
                // console.log('logging and clearing overflown queue.');

                // In the below logToServe call, log the queue with "overflown = true"
                // This is to indicate that the queue was overloaded.
                logToServer(true);
            }, 10000);
        }

        // test block time: 10 sec (10000 ms)
        // block time: 3 minutes (180000 ms)
        // console.log(`blocking errors from queue for 10 seconds, starting at ${blockSetTime}`);
        
        
        
        return;
    }

    console.log('error received in queue');

    // for every error received in the queue, reset the queue submit timeout.
    // once the timeout is able to expire (no other errors have been received in the queue for the last 5 seconds),
    // the errorQueue contents can be logged to the server.
    clearTimeout(queueSubmitTimer);
    queueSubmitTimer = setTimeout(logToServer, 5000);
    
    // grabbing the Date.now() might be the only way to maintain the time of occurence for the server to log - using a queue might remove the previous server logging time that basically served as the time the error was thrown.


    // IF the received error is an error OBJECT:
    

    if (typeof error === 'string') {

        // console.log('this should not be happening any more.'); 
        
        let tempErrString = error;
        error = null;
        error = new Error();
        error.msg = tempErrString;
        error.cause = 'whatever';
    }


    // TODO -> hm...untested:
    if (typeof error !== 'object') {
        console.log('what in the WORLD do we have here?');
        console.log('check it out:');
        console.log(error);
    }

    // date obj representing queue time:
    let queueTimeObj = new Date();
    // queue time as unix time in ms
    error.queueTime = queueTimeObj.getTime();
    // queue time as ISO string
    error.queueTimeISO = queueTimeObj.toISOString(); 
    
    // console.log('here:', error);

    // console.log(Object.keys(error), Object.values(error));

    // console.log('this, too->', error.cause);

    console.log('name, message, cause, queueTime:',
    '\n', error.name,
    '\n', error.message,
    '\n', error.cause,
    '\n', error.queueTime);

    // add the received error to the current errorQueue:

    errorQueue.push(error);
    totalThrown++;

};



const logToServer = (overflown = false) => {
// don't know if I want to pass errqueue as a param since there's just one queue

    // for testing:

    console.log(`${errorQueue.length} error(s) in queue.`);
    if (overflown) console.log('Note: errors thrown by the browser after the first 10 were blocked for the past 3 minutes.');

    errorQueue.forEach((error) => {

        let errString = `(time: ${error.queueTimeISO} // cause: ${error.cause})
         name: ${error.name}; msg: ${error.message};`

        error.log_string = errString;
    
    });
    
    // and if the queue was overflown, tack a message on to the queue to send to the log:
    if (overflown) {
        let now = new Date().toISOString();
        let errorMessageObj = {};
        errorMessageObj.log_string = `*NOTE: The last 10 log records came from an overflown queue. For the time between ${blockSetTime} and ${now}, any additional front end errors thrown after these 10 were not logged (the overflown queue was blocked to keep from making too many server calls.)`;
        errorQueue.push(errorMessageObj);
    }

    // and send to the server:


    // console.log(errorQueue);
    // console.log(errorQueue[2], '/', errorQueue[0]);
    
    // gives 10 for a full queue, correct:
    // console.log(errorQueue.length); 
    // console.log(errorQueue[0].msg);
    // console.log(Object.keys(errorQueue[0]));
    
    // fetch(BASE_URL + "api/clientlogger", {
    //     method: 'POST',
    //     body: JSON.stringify(errorQueue),
    //     headers: {'Content-Type': 'application/json'}
    // }).then(res => {
    //     console.log(res);
    //     return res;
    // }).catch(error => {
    //     console.log('an error on an error:');
    //     console.log(error);
    // });


    // TODO wowee look at this fetch haha
    fetch(BASE_URL + "api/clientlogger", {
        method: "POST",
        body: JSON.stringify(errorQueue),
        headers: {"Content-Type": "application/json"}
    }).then(res => {
        return res.ok ? 'response after logging ok' : 'reponse after logging NOT ok';
    }).then(data => data).catch(error => {
        console.log('something went wrong while logging the error queue to the server -> \'\n', error);
    });

    // and then clear the queue using splice:
    errorQueue.splice(0, errorQueue.length);

    // testing:
    totalThrown = 0;
    
    // and clear the timeOut that (could have) called this function:
    // clearTimeout(queueOverflowTimer);
    // or...set it to null, again?
    // set to null instead of clearing timeOut
    queueOverflowTimer = null;

};