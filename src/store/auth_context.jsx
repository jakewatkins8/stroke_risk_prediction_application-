import React, { useState, useEffect, useCallback } from "react";
import { logToErrorQueue } from "../Logger";

import { BASE_URL } from "./environment";

let logoutTimer;

let refreshTimer;

const AuthContext = React.createContext({
    token: '',
    isLoggedIn: false,
    login: (token) => {},
    logout: (auto) => {},
    autoLoggedOut: false
    // activeUser: ''
});

// calc. remaining time, both for new token (fresh login) and for
// retrieving old token (getStoredToken where token data is still present in localStorage)

const calcRemainingTime = (expireTime) => {
    const currTime = new Date().getTime();
    const adjExpireTime = new Date(expireTime).getTime();

    const remainingTime = adjExpireTime - currTime;

    // time value in ms, as a number
    return remainingTime;
};

const getStoredToken = () => {

    console.log('getting stored token if it exists:');
 
    const storedToken = localStorage.getItem('token');
    const storedExpireTime = localStorage.getItem('expireTime');


    const remainingDuration = calcRemainingTime(storedExpireTime);


    console.log('results\n token:', storedToken, '\n exp time:', storedExpireTime, '\n time left:', remainingDuration, 'ms');


    
    if (remainingDuration <= 0) {

        // // **************possible bad logic here - unless the access token is ALWAYS refreshed before its time is <= 0.

        console.log('access_t:', localStorage.getItem('accessToken'), '\n',
        'expireTime:', localStorage.getItem('expireTime'), '\n',
        'refresh_t', localStorage.getItem('refreshToken'));
        console.log('the local storage access token either does not exist, or is expired. clearing any local storage.');

        localStorage.removeItem('token');
        localStorage.removeItem('expireTime');
        localStorage.removeItem('refreshToken');


        if (refreshTimer) {
            console.log("clearing Refresh timer.");
            clearTimeout(refreshTimer);
        }
        
        return {
            token: null,
            duration: null
        };

    }

    return {
        token: storedToken,
        duration: remainingDuration
    };


    
};

export const AuthContextProvider = (props) => {

    
    const tokenData = getStoredToken();

    let initToken;

    // let user;
    
    // set a token from storage if it was found:
    if (tokenData) {
        initToken = tokenData.token;
        // user = tokenData.active_user;
    }

    const [token, setToken] = useState(initToken);
    const [autoLogOut, setAutoLoggedOut] = useState(false);
    // const [activeUser, setActiveUser] = useState();



    
    
    // shorthand to evaluate boolean value of token - truthy or falsy (i.e. null, "", NaN(?), 0, etc.)
    const userIsLoggedIn = !!token;

    console.log("first, isloggedin:", userIsLoggedIn);






    // don't have to use useEffect since localStorage is synchronous API

    const logoutHandler = useCallback((auto = true) => {

        if (auto) {
            setAutoLoggedOut(true);
        }
        else {
            setAutoLoggedOut(false);
        }
        

        setToken(null);

        // also remove the token from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('expireTime');
        localStorage.removeItem('refreshToken');
        
        // figure out where refresh tokens should go (what, a http-only cookie?)
        
        // Maybe don't ever remove the refresh token...it will be invalidated server-side?
        // but then do you need a blacklist?
        // localStorage.removeItem('refreshToken');

        if (logoutTimer) {
            clearTimeout(logoutTimer);
        }

        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }

    }, []);
    // dependencies: don't have to add clearTimeout bc it's browser function. setToken doesn't have to be added because it's guaranteed by react to not change. logoutTimer doesn't have to be added because it's global and outside the rendering flow.

    
    const loginHandler = (token, expirationTime, refreshToken) => {
        setToken(token);
        // also add the token to localStorage
        localStorage.setItem('token', token); // objects must be JSON'ed to store.
        localStorage.setItem('expireTime', expirationTime);

        console.log(expirationTime);

        // *******
        localStorage.setItem('refreshToken', refreshToken);
 


        // calc remainingTime to log user out, if needed
        const remainingTime = calcRemainingTime(expirationTime);

        console.log("rem. time -------------", remainingTime);

        // halve the rem. time:
        const timeHalved = remainingTime/2;

        // refreshing is occurring at half of the elapsed access token time,
        // just in order to provide more than enough remaining time for the frontend to reobtain a new token.
        // The frontend needs to finish renewing the token before the current access token actually runs completely out of time.

        // obtain 90% of the total access token time:
        // do this to fetch a refresh from the server BEFORE the token expires.
        // const timeNinetyPercent = remainingTime * 0.90;

        console.log('time until refresh', timeHalved);

        // console.log('time until refresh:', timeNinetyPercent);

        if (refreshTimer) {
            console.log('clearing');
            clearTimeout(refreshTimer); 
        }

        refreshTimer = setTimeout(refreshHandler, timeHalved);

    };

    const refreshHandler = () => {

        console.log('refreshing token that expires soon, or refreshing old stored token that was found to be expired on page load.');

        let newToken;
        let newExpTime;

        fetch((BASE_URL + 'api/refresh'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('refreshToken')}`
            }
        }).then(res => {
            // console.log(res.status);
            if (res.ok) {
                return res.json();
            } else {
                console.log(res.status, res.statusText);
                console.log('auto-logging out.');
                logoutHandler();
            }
        }).then(data => {

            newToken = data.access_token;
            newExpTime = new Date(new Date().getTime() + (+data.expiration_time * 1000)).toISOString();

            console.log(newExpTime);

            setToken(newToken);
            // also add the token to localStorage
            localStorage.setItem('token', newToken); // objects must be JSON'ed to store.
            localStorage.setItem('expireTime', newExpTime);
    
            // calc remainingTime to log user out, if needed
            const remainingTime = calcRemainingTime(newExpTime);
    
            // halve the rem. time:
            const timeHalved = remainingTime/2;

            // const timeNinetyPercent = remainingTime * 0.90;

            console.log('time until refresh', timeHalved);
    
            // console.log('time until refresh:', timeNinetyPercent);
    
            
            // console.log('time until refresh', timeHalved);

            if (refreshTimer) {
                console.log('clearing it');
                clearTimeout(refreshTimer);
            }

            refreshTimer = setTimeout(refreshHandler, timeHalved);
    
             
            // const expireTime = new Date(new Date().getTime() + (+result.expiration_time * 1000));
            // authCtx.login(result.access_token, expireTime.toISOString(), result.refresh_token);


        }).catch(error => {
            error.cause = 'auth_context refresh handler';
            logToErrorQueue(error);
        });
    };



    // commented out while I try to figure out refresh tokens:


    // useEffect(() => {
    //     if (tokenData) {
    //         console.log(tokenData.duration);
    //         //logoutTimer = setTimeout(logoutHandler, tokenData.duration);
    //     }
    // }, [tokenData, logoutHandler]); // and logoutHandler is called earlier using useCallback to ensure it is not recreated unnecessarily - avoid accidental feedback loops

    const contextValue = {
        token: token,
        isLoggedIn: userIsLoggedIn,
        login: loginHandler,
        logout: logoutHandler,
        autoLoggedOut: autoLogOut
    };


    return (
    <AuthContext.Provider value={contextValue}>
        {props.children}
    </AuthContext.Provider>
    );

};

export default AuthContext;