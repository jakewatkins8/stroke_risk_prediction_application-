import { Fragment } from "react";
import "../styles/appwindow.css";
import NavBar from "../NavBar";
import Footer from "./Footer";

const AppWindow = (props) => {
    return (
    <div className="appwindow">
    <NavBar />
        {props.children}
    <Footer />
    </div>
    );
}

export default AppWindow;