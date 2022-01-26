import { useState } from "react";
import { logToErrorQueue } from "./Logger";
import "./styles/Settings.css";
import { BASE_URL } from "./store/environment"

const Settings = () => {

    const [logData, setLogData] = useState([]);

    const [filter, setFilter] = useState("none");

    const [errorMsg, setErrorMsg] = useState("");

    const getLogs = (event) => {
        setErrorMsg("");




        fetch((BASE_URL + 'api/retrievelogs'), {
            headers: {'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => {
            // console.log(res);
            // console.log(res.status);
            if (res.status === 403) {
                setErrorMsg("Your account does not have the privileges required to access logs.");
                
                return;
            }
            return res.json();
        }
        ).then(data => {
            if (!!data.events) {

                // sort the data in descending order, in place, using sort():
                data.events.sort((record1, record2) => {
                    let time1 = new Date(record1.generated_at).getTime();
                    let time2 = new Date(record2.generated_at).getTime();
                    return time2 - time1;
                });

                setLogData(data.events);

            }
            else {
                setErrorMsg(`${data['errormsg']} Please try again.`)
                let err = new Error(`${data['errormsg']} (fetch logs button on Settings page)`);
                throw err;
            }
        }).catch(error => {
            error.cause = "app. logs fetch request";
            logToErrorQueue(error);
        });
    };



    return (
    <div className="settingsWrapper">
        <div>
        <div className="settingsSpacingTop"></div>
        <h2>App Monitoring</h2>
        </div>
        <hr />
        <span className="error">{errorMsg}</span>
        {logData.length === 0 && (<div className="settingsSpacingTop"></div>)}
        <button onClick={getLogs}>Load Application Logs</button>
        {logData.length === 0 && <div className="settingsSpacingBottom"></div>}
        {logData.length > 0 && (<><br/><br/>
            <span>Showing last {logData.length} logged events, from most recent to oldest</span>
        <hr />

        <div className="tableOuterWrapper">
            <div className="tableInnerWrapper">
                <table>
                    <thead>
                    <tr>
                        <th>Row no.</th>
                        <th>ID no.</th>
                        <th>time created, EST</th>
                        <th>program</th>
                        <th>message</th>
                    </tr>
                    </thead>
                    <tbody>
                        { logData.map((dataRow, index) => {
                            {/* Note: this key may need changed */}
                            return (
                            <tr key={dataRow.id}>
                                <td>{index + 1}</td>
                                <td>{dataRow.id}</td>
                                <td>{dataRow.generated_at}</td>
                                <td>{dataRow.program}</td>
                                <td>{dataRow.message}</td>
                            </tr>
                            );
                        })
                        }
                    </tbody>
                </table>
            </div>
        </div>

    </>
    ) }
    </div>
    );
};

export default Settings;