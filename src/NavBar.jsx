import "./styles/NavBar.css";

import { NavLink } from "react-router-dom";
import { useContext } from "react";

import AuthContext from "./store/auth_context";

// 
import TouchContext from "./store/touch_context";
// 

const NavBar = () => {


    const authCtx = useContext(AuthContext);

    // 
    const touchCtx = useContext(TouchContext);
    // 
    // 
    const userHasTouched = touchCtx.userTouch;
    //
    

    const isLoggedIn = authCtx.isLoggedIn;

    const logoutHandler = () => {

        authCtx.logout(false);

    };

    return (<div className="navBarWrapper" style={ isLoggedIn ? { minHeight: '180px' } : { minHeight: '4em' } }>

            { isLoggedIn ? 
            (<>
                <div className="headerLeftCol">

                    <div className="title">
                        <NavLink className="titleLink" to="/">
                            <h1>Stroke Risk Assessment App</h1>
                        </NavLink>
                    </div>

                    <nav className="navLinksContainer">
                        {/* {isLoggedIn && (<> */}
                        <div className="navContainerSpacingEdge">

                        </div>
                        <NavLink className="link" id="assessmentLink" to="/assessment" activeClassName="activeLink">
                            <span>Patient Assessment</span>
                        </NavLink>
                        <NavLink className="link" id="dataLink" to="/data" activeClassName="activeLink">
                            <span>Data Visualizations</span>
                        </NavLink>
                        <div className="navContainerAccentEdge">
                        </div>
                        {/* </> */}
                        {/* )} */}
                        
                    </nav>


                </div>

                <div className="headerRightCol">

                    {/* {isLoggedIn && 
                    <> */}
                    <div className="linkContainer">
                        <NavLink className="appMonitoring" to="/settings" activeClassName="activeLink">
                            {/* <button>App Monitoring</button> */}
                            <span>App Monitoring</span>
                        </NavLink>
                    </div>
                    <div className="buttonContainer">
                        <button onClick={logoutHandler}>Log Out</button>
                    </div>
                    {/* </>} */}

                </div>
            </>)
            :
                <div className="loneTitle">
                        <h1>Stroke Risk Assessment App</h1>
                </div>
            }
            </div>
    );

}

export default NavBar;