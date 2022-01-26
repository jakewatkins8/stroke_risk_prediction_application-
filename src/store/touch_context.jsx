// imports...?
import React, { useState } from "react";


const TouchContext = React.createContext({
    userTouch: false,
    setUserTouch: () => {}
});

// and here -->  <--
// methods as needed
// maybe the method just to check the touch variable status, if it's even needed


// how to store the state across...time?
let hasTouched = false;

export const TouchContextProvider = (props) => {
    
    // 
    // IDK if it's a good idea to use the userTouch value from above, to init. the provider's state.
    // 
    // to elucidate - it doesn't recognize it here, from above. it's undefined here.
    // so, false it is, i guess.

    // console.log('the let hasTouched:', hasTouched);
    // this value DOES seem to persist across pages, iterations, whatever.


    const [userHasTouched, setUserHasTouched] = useState(hasTouched);

    const userTouchHandler = () => {

        // console.log('current let -> hasTouched:', hasTouched);

        // console.log('touch ctx:');
        // console.log('current userHasTouched:', userHasTouched);

        if (!userHasTouched) {
            setUserHasTouched(true);
            hasTouched = true;
        }


        // console.log('new user has touched (unless the state didn\'t update yet):', userHasTouched);
    };

    const userHasTouchedInSession = !!userHasTouched;

    const contextValue = {
        userTouch: userHasTouchedInSession,
        setUserTouch: userTouchHandler
    };

    return (
        <TouchContext.Provider value={contextValue}>
            {props.children}
        </TouchContext.Provider>
    );
};

export default TouchContext;





