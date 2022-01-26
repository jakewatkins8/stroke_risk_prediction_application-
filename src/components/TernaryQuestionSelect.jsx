import { logToErrorQueue } from "../Logger";

// import "../styles/TernaryQuestionSelect.css";

const TernaryQuestionSelect = (props) => {

    const handleChange = (event) => {
        try {
        props.onSelectChange(event);
        }
        catch (error) {
            error.cause = 'TernaryQuestionSelect event';
            logToErrorQueue(error);
        }
    }


    // Need to likely come back and replace the index-keys below in the list with a different type of key, like UUID, maybe.
    
    const options = props.options;

    return(
    <select name={props.name} onChange={handleChange} required>
        <option key={0} value="">Select one option...</option>
        {options.map((option, index) => {
            return <option key={index} value={option}>{option}</option>;
        })}
    </select>
    );

};

export default TernaryQuestionSelect;