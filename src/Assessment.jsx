import "./styles/Assessment.css";



import { useCallback, useState, useEffect, useRef, useContext } from "react";

import AuthContext from "./store/auth_context";

import QuestionBlock from "./components/QuestionBlock";

import BinaryQuestionRadio from "./components/BinaryQuestionRadio";
import NumericalQuestionInput from "./components/NumericalQuestionInput";
import TernaryQuestionSelect from "./components/TernaryQuestionSelect";

import { worktypes, smoking } from "./components/optionlists";

import { BASE_URL } from "./store/environment";
import { logToErrorQueue } from "./Logger";

const Assessment = () => {


    // use of authCtx for auto-logout upon failure to reach server w/a token
    const authCtx = useContext(AuthContext);

    // Note: it's possible these two state objects could be reduced to just one.

    // state object to represent whether or not the user has checked the glucose unknown checkbox:
    const [glucoseUnknown, setGlucoseUnknown] = useState(false);
    // state object to represent whether or not the glucose field should be disabled (disable if glucose unknown):
    const [glucoseDisabled, setDisableGlucose] = useState(false);

    // state object to receive and display assessment results from server:
    const [results, setResults] = useState({
        proba: '',
        classify: ''
    })

    // state object to maintain all user input form data for submission:
    const [formData, setFormData] = useState({
        sex: "",
        age: "",
        hyper: "",
        heart: "",
        married: "",
        worktype: "",
        restype: "",
        glucose: "",
        bmi: "",
        smoking: "",
        prevGlucoseVal: ""
    });


    // state object to render errors on UI if blank fields are present on a submit attempt:
    const [formBlanks, setFormBlanks] = useState({
        sex: false,
        age: false,
        hyper: false,
        heart: false,
        married: false,
        worktype: false,
        restype: false,
        glucose: false,
        bmi: false,
        smoking: false
    });

    // state object to render errors on UI if bad inputs are found in any fields on a submit attempt:
    const [formBadInputs, setFormBadInputs] = useState({
        age: false,
        bmi: false,
        glucose: false
    });


    // state object to render error on UI if error occurs fetching results from server:
    const [fetchErrorMsg, setFetchErrorMsg] = useState("");

    // use of state object to render list of all question errors after an attempted submission:
    const [errors, setErrors] = useState([]);

    // helper dictionary object for the above 'errors' useState hook.
    // used for obtaining question number for each type of error. This occurs in an IIFE in the render body.
    const questions = {
        'sex':'1', 
        'age':'2', 
        'hyper':'3', 
        'heart':'4', 
        'married':'5',
        'worktype':'6',
        'restype':'7',
        'glucose':'8',
        'bmi':'9',
        'smoking':'10'
    };

    // ref to results text box, to scroll it into view:
    const resultsRef = useRef();

    const scrollToResultsBox = () => {
        resultsRef.current.scrollIntoView({ behavior: "smooth" });
    };

    const [resultsShown, setResultsShown] = useState(false);

    // useEffect to scroll to resultsBox once it is rendered.
    useEffect(() => {
        if (resultsShown) {
            scrollToResultsBox();
        }
    }, [resultsShown]);




    const handleFormChange = (event) => {
        try {
            const { name, value } = event.target;
            // console.log(event.target);
            // console.log(name, value);

            // console.log("before", formData);

            // adjust glucose to unknown or not unknown, if the unknown box is checked or unchecked:
            if (name === "glucoseunknown") {
                setGlucoseUnknown((prevVal) => !prevVal);
                return;
            }

            setFormData((prevValue) => {
                    const form = {...prevValue};
                    form[name] = value;

                    // also add the glucose value to the temp property, to reapply this
                    // value if the unknown box is unchecked:
                    if (name === "glucose") form["prevGlucoseVal"] = value;

                    return form;
            });


            // &@)&)&)@&)@& --- below is used to throw a runtime error, for testing:
            // BREAKING!!!!!!!!! OMG
            // let nyorm = Float32Array(Event/32);
            // console.log(nyorm);

            // console.log("after", formData);
        }
        catch (error) {
            error.cause = 'assessment form data';
            logToErrorQueue(error);
        }
    };

    
    // a useEffect hook to only update the checkbox's representative boolean if it is changed.
    // this may or may not be set up right.
    useEffect(useCallback(() => {

        if (glucoseUnknown) {
            setDisableGlucose(true);
            setFormData((prevValue) => {
                const form = {...prevValue};
                form["glucose"] = 123.6;

                return form;
            });
        }
        else {
            setDisableGlucose(false);
            setFormData((prevValue) => {
                const form = {...prevValue};
                form["glucose"] = form["prevGlucoseVal"];
            
                return form;
            });
        }
    
        // console.log("this executed." + new Date().toString());
            //console.log("glucose unknown changed:", glucoseUnknown);
        }), [glucoseUnknown]);



    // validate input, and make a call to submit if valid
    const validateInput = (event) => {

        // prevent default 'submit' action page refresh:
        event.preventDefault();

        // dismiss any old server error messages:
        setFetchErrorMsg("");

        // reset all form blank error statuses from any prior submissions:
        setFormBlanks({
            sex: false,
            age: false,
            hyper: false,
            heart: false,
            married: false,
            worktype: false,
            restype: false,
            glucose: false,
            bmi: false,
            smoking: false
        });

        // reset any form bad input errors:
        setFormBadInputs({
            age: false,
            bmi: false,
            glucose: false
        });

        // clear the overall error list at the Submit button.
        setErrors([]);

        // clear any old assessment results:
        setResults({
            proba: '',
            classify: ''
        });


        // start with assuming input is valid until proven otherwise:
        let inputValid = true;

        // status object to be updated in the for loop below if any of the number input fields are blank:
        const specialFieldsBlank = {
            'age': false, 
            'glucose': false, 
            'bmi': false
        };


        // form object to receive all updates from the below loop and then set the state of the formBlanks object
        // const form = {};
        // or, maybe i can just figure out whether React automatically batches these updates together.

        for (const property in formData) {

            // skip the prevGlucoseVal property:
            if (property === 'prevGlucoseVal') continue;


            // if a falsy (i.e. blank, for this purpose) value is found, 
            // locate the corresponding property in the formErrors state object:
            if (!!formData[property] === false) {

                // mark input as invalid to block submit:
                inputValid = false;

                let correspondingProperty = Object.keys(formBlanks).find(el => el === property);

                // Note: ...does React automatically batch these updates together? It's a lot of calls to setState across the loop, in the worst case.

                // add the blank field's status to the state object:
                setFormBlanks(oldVal => {
                    const form = {...oldVal};
                    form[correspondingProperty] = true;
                    return form;
                });

                // add the blank field's status to the overall errors state object:
                setErrors((oldVal) => {
                    const errorList = [...oldVal, correspondingProperty];
                    return errorList;
                })

                // if the erring field is also one of the keys of the specialFieldsBlank object,
                // set the value of the matching specialFieldsBlank key to true - the field is blank.
                // this way, the field's logic won't be tested if it is already known to be blank.
                if (Object.keys(specialFieldsBlank).includes(correspondingProperty)) {
                    specialFieldsBlank[correspondingProperty] = true;
                }
                
            }

        }

        // now that blank inputs have been captured:
        // if the text input fields are not blank - they need their logic checked.

        // formBadInputs - a State object to hold logic error statuses for age, bmi, and glucose fields.
        // run a logic check on the 3 applicable text input fields:
        // age, bmi, and glucose - illogical info can be typed into those 3 fields.

        // use regExes to test the logic of each field.
        
        // first, a regEx for the age field.
        // a regEx requiring that the age number entry:
        //     - start with a digit between 1 and 9
        //     - can be followed by zero to two digits (from 0-9; number can only be 3 digits long)
        //     - ends after the last digit

        // if the age field was not found to be blank:
        if (!specialFieldsBlank['age']) {
            let ageRegex = /^[1-9]\d{0,2}$/;

            // if the age field fails the age regex test:
            if (!ageRegex.test(formData['age'])) {

                // mark input as invalid to block submit:
                inputValid = false;

                setFormBadInputs(oldVal => {
                    const form = {...oldVal};
                    form['age'] = true;
                    return form;
                });
                setErrors((oldVal) => {
                    const errorList = [...oldVal, 'age'];
                    return errorList;
                });
            }
        }

        // for the other 2 text input fields, age and bmi:
        // the avg. glucose and bmi fields can both be either whole or decimal numbers.
        // the fields are both limited to 5 characters.
        // test the avg. glucose & bmi entry with 2 regEx's: 
        // one to test for a whole number, and another to test for a decimal number.
        // if neither regEx tests true for an input in one of these 2 fields - the input is not valid.
        // given that, the glucose and bmi fields each accept only whole or decimal numbers.

        // 1st of 2 regExes - test for whole number of up to 5 total digits:
            // - start w/ 1-9
            // - can be followed by up to 4 digits
        let wholeNumRegex = /^[1-9]\d{0,4}$/;
    
        // 2nd of 2 regExes - test for decimal number of range 0.0 to 999.9, with variant forms depending on whole portion:
            // - start w/ 1-9
            // - can be followed by up to 2 digits, then 1 decimal point,  
            // - then from 1 to 3 tenths-place digits.
        
        let decimalRegex = /^[1-9]\d{0,2}\.\d{1,3}$/;


        // if glucose field is not blank, apply the regExes to test the value:
        if (!specialFieldsBlank['glucose']) {

            console.log(wholeNumRegex.test(formData['glucose']));
            console.log(decimalRegex.test(formData['glucose']));

            // if neither of the regEx's have a passing test for the entry,
            // consider the entry invalid - the input is not in the correct format.
            if (!wholeNumRegex.test(formData['glucose']) && !decimalRegex.test(formData['glucose'])) {

                // mark input as invalid to block submit:
                inputValid = false;

                setFormBadInputs(oldVal => {
                    const form = {...oldVal};
                    form['glucose'] = true;
                    return form;
                });
                setErrors((oldVal) => {
                    const errorList = [...oldVal, 'glucose'];
                    return errorList;
                });
            }

        }


        // if bmi field is not blank, apply the regExes to test the value:
        if (!specialFieldsBlank['bmi']) {


            console.log(wholeNumRegex.test(formData['bmi']));
            console.log(decimalRegex.test(formData['bmi']));

            // if neither of the regEx's have a passing test for the entry,
            // consider the entry invalid - the input is not in the correct format.
            if (!wholeNumRegex.test(formData['bmi']) && !decimalRegex.test(formData['bmi'])) {

                // mark input as invalid to block submit:
                inputValid = false;

                setFormBadInputs(oldVal => {
                    const form = {...oldVal};
                    form['bmi'] = true;
                    return form;
                });
                setErrors((oldVal) => {
                    const errorList = [...oldVal, 'bmi'];
                    return errorList;
                });
            }
        }

        
        console.log('input valid:', inputValid);

        // actually submit the data if all input is found to be valid:
        if (inputValid) sendAssessmentData(event);
    };


    const sendAssessmentData = (event) => {

        // reset the resultsShown state boolean:
        setResultsShown(false);
        
        // to test, copy the form state object using .assign() and change the value of a key:
        // let theBadForm = {};
        // Object.assign(theBadForm, formData);
        // console.log('look I am evil:', theBadForm);
        // theBadForm.age = 'a123';
        // console.log('and now look what I have done to my value, b:', theBadForm);

        // the fetch request is supposed to have 
        // body: JSON.stringify(formData)
        // but for testing...it will send 'theBadForm'

        fetch(BASE_URL + 'assessment', {
            method: "POST",
            body: JSON.stringify(formData),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`
            }
        }).then(res => {
            if (res.ok) {
                return res.json();
            }
            // if the res status is 422, the fetch was likely missing a token.
            // so perform an autologout if that happens.
            else if (res.status === 422 || res.status === 401) {
                authCtx.logout(true);
            }
            else {
                // console.log("the response from the server was NOT ok.");
                // console.log(res.json());
                setFetchErrorMsg("Something went wrong with receiving the assessment results from the server. Please try again.");

                // do not proceed to display the data info if there was an error submitting the data to the server.
                // just return out of the function.
                return;
            }
        }).then(data => {

            // if the response's data has an 'error' property, the server has encountered an error processing the data.
            if (data.error) {

                setFetchErrorMsg("Something went wrong with receiving the assessment results from the server. Please try again.");
                // do not proceed to display the data info if there was an error on the server. exit the function.
                return;
            }

            console.log('content of `data`:', JSON.stringify(data))
            // console.log(data);

            setResults({
                proba: data.proba,
                classify: data.classify
            });
            setResultsShown(true);
        }).catch(error => {
            
            error.cause = 'submit assessment fetch request';
            logToErrorQueue(error);

            setFetchErrorMsg("Something went wrong with sending the assessment to the server. Please try again.");
            
        });

    };




    // let isNotDismissed = "flex";
    // const closeMessage = () => {
    //     isNotDismissed = "none";
    // };

    // className={styles.assessmentWrapper}
    return (
    
    <div className="assessmentWrapper">

        <div className='disclaimerWrapper'>
            <h3>Disclaimer</h3>
            <hr/>
            <p>This website and the below assessment are not intended to diagnose, prevent, or treat any real medical condition. The material presented is part of an educational undertaking. <br/> <br/>Please consult a doctor for any advice regarding diagnosis, prevention, or treatment of strokes and/or related conditions. </p>
        </div>


        <h1 className="assessmentHeader">Patient Assessment</h1>
        
        
    <form>

    {/* Debug element - to view state of formData */}
    
    {/* className={styles.wrapper} */}
    <div >
        {/* <p>{JSON.stringify(formData)}</p> */}
    </div>


    <div id="assessmentSpace"></div>

 

    {formBlanks['sex'] && <div className="message">
    <span>Please select one of the options before submitting.</span>
    </div>}
        <QuestionBlock question="Select the patient's biological sex." questionNumber="1">
            <BinaryQuestionRadio onRadioChange={handleFormChange} radioGroupName="sex" radioVal1="male" radioVal2="female"
                radioVal1Text="Male" radioVal2Text="Female"
            />
        </QuestionBlock>

        {formBlanks['age'] && <div className="message"><span>
                Please enter an age value before submitting.
            </span></div>}
            {formBadInputs['age'] && <div className="message"><span>
                Age must be a number.
            </span></div>}
        <QuestionBlock question="Enter the patient's age." questionNumber="2">
            <NumericalQuestionInput onValueChange={handleFormChange} name="age" placeholder={"27"} maxLength={'3'}/>
        </QuestionBlock>

        {formBlanks['hyper'] && <div className="message"><span>Please select one of the options before submitting.</span></div>}
        <QuestionBlock question="Does the patient have a history of hypertension?" questionNumber="3">
            <BinaryQuestionRadio onRadioChange={handleFormChange} radioGroupName="hyper" radioVal1="hyperYes" radioVal2="hyperNo"
                radioVal1Text="Yes" radioVal2Text="No"
            />
        </QuestionBlock>

        {formBlanks['heart'] && <div className="message"><span>Please select one of the options before submitting.</span></div>}
        <QuestionBlock question="Does the patient have a history of heart disease?" questionNumber="4">
            <BinaryQuestionRadio onRadioChange={handleFormChange} radioGroupName="heart" radioVal1="heartYes" radioVal2="heartNo"
                radioVal1Text="Yes" radioVal2Text="No"
            />
        </QuestionBlock>

        {formBlanks['married'] && <div className="message"><span>Please select one of the options before submitting.</span></div>}
        <QuestionBlock question="Is/was the patient currently or ever married?" questionNumber="5">
            <BinaryQuestionRadio onRadioChange={handleFormChange} radioGroupName="married" radioVal1="marryYes" radioVal2="marryNo"
                radioVal1Text="Yes" radioVal2Text="No"
            />
        </QuestionBlock>

        {formBlanks['worktype'] && <div className="message"><span>Please select one of the options before submitting.</span></div>}
        <QuestionBlock question="Select the option that best describes the patient's occupation type." questionNumber="6">
            <TernaryQuestionSelect name="worktype" options={worktypes}
            onSelectChange={handleFormChange}
            />
        </QuestionBlock>

        {formBlanks['restype'] && <div className="message"><span>Please select one of the options before submitting.</span></div>}
        <QuestionBlock question="Select the option that best describes the patient's area of residence." questionNumber="7">
            <BinaryQuestionRadio onRadioChange={handleFormChange} radioGroupName="restype" radioVal1="rural" radioVal2="urban"
                radioVal1Text="Rural" radioVal2Text="Urban"
            />
        </QuestionBlock>

        
        {/* style={ {backgroundColor: 'black'} }  */}

        {formBlanks['glucose'] && <div className="message"><span>Please enter an average glucose value (or check "Unknown") before submitting.</span></div>}
        {formBadInputs['glucose'] && <div className="message"><span>Average glucose must be a whole or decimal number.</span></div>}
        <QuestionBlock question="Enter the patient's average glucose levels (mg/dL) if known. Select &quot;Unknown&quot; if not known, and an average will be used." questionNumber="8">
            <NumericalQuestionInput className="glucoseInput" isDisabled={glucoseDisabled} name="glucose" placeholder={glucoseDisabled ? "" : "100.0"} onValueChange={handleFormChange} maxLength={'5'} />
            <div className="checkBoxLabelWrapper">
            <label className="pointer" htmlFor="glucoseunknown">Unknown</label><input className="pointer" type="checkbox" id="glucoseunknown" name="glucoseunknown" onChange={handleFormChange}></input>
            </div>
        </QuestionBlock>

{/*         {formErrors['age']['err'] && <div className="message"><span>
                {formErrors['age']['errType'] === 'blank' && ('Please type in an age value before submitting.')} */}
        
        {formBlanks['bmi'] && <div className="message"><span>Please enter a BMI value before submitting.</span></div>}
        {formBadInputs['bmi'] && <div className="message"><span>BMI must be a whole or decimal number.</span></div>}
        <QuestionBlock question="Enter the patient's BMI (Body Mass Index.)" questionNumber="9">
            <NumericalQuestionInput name="bmi" placeholder={"22.5"} onValueChange={handleFormChange} maxLength={'5'}/>
        </QuestionBlock>


        {formBlanks['smoking'] && <div className="message"><span>Please select one of the options before submitting.</span></div>}        
        <QuestionBlock question="Select the option that best describes the patient's smoking status." questionNumber="10">
            <TernaryQuestionSelect name="smoking" options={smoking} onSelectChange={handleFormChange}/>
        </QuestionBlock>


    {/* if any errors are present on any of the inputs, this throws to the UI */}
    {(Object.values(formBlanks).some(el => el === true) || Object.values(formBadInputs).some(el => el === true)) &&
        <div className="submitInfo">
            {/* <span onClick={closeMessage}>X</span> */}
            <p>Please fix the following questions before submitting:</p>
            {/* <p>{errors}, <br/> {errors.length}</p> */}
            {/* use of an IIFE to map each incorrect question type (age, etc.) to its respective question number */}
            <p> {
                (() => {
                let numberList = [];
                errors.forEach((el) => {
                    console.log(questions[el]);
                    numberList.push(questions[el]);
                });
                {/* sort the numberList: */}
                {/* sort the array in ascending numerical value order (not ASCII character order, the weird cardinal sort) */}
                numberList = numberList.sort((a, b) => a - b);
                {/* return the string repr. of the array, and add a space after any commas: */}
                return numberList.toString().replace(/\,/g, ", ");
            })()
            }</p>
        </div>
    }

    <div id="assessmentSpace"></div>

        <button onClick={validateInput} type="submit">Submit Assessment</button>

    </form>

    {fetchErrorMsg !== '' && (
        <div className="submitInfo">
            <p>{fetchErrorMsg}</p>
        </div>)
        }

        
    <div id="assessmentSpace"></div>


        {results.proba !== "" && (<>
        <div className="resultsContainer" onLoad={scrollToResultsBox} ref={resultsRef}>
        <h2>Assessment Results</h2>
        <hr/>
            <span className="resultsLarge">{results.proba}</span>
            <span className="caption">Calculated current likelihood of stroke in lifetime of patient</span>
            
            <p>Based on the patient's data, the patient is <u>{results.proba}</u> likely to have a stroke in their lifetime.</p>
            
            {results.classify === 1 && (<span>Given the assessment results, <br/> <u>the patient is at an increased risk of having a stroke.</u> <br/> <br/> The patient should be given medical advice on how to lower their current stroke risk.</span>)}
            
            {results.classify === 0 && (<span>Given the assessment results,<br/> <u>the patient is not at immediate risk of having a stroke.</u> 
            <br/>
            <br/>
            The patient should simply continue to practice healthy lifestyle habits in order to ensure their risk of stroke remains low.</span>)}
        </div>
        <div className="spacing"></div>
        </>)}


    {/* <Results percentProba={results.proba} classify={results.classify} /> */}

    </div>);
};

    {/* <div className='debug'>
    <p><u>testing</u></p>
    <p><u>blanks</u></p>
    <p>exhibit 1: {'' + Object.values(formBlanks).some(el => el === true)} </p>
    <p>xzibit 2: {'' + Object.values(formBadInputs).some(el => el === true)} </p>
    
    <p>{JSON.stringify(formBlanks)}</p>
    <p><u>bad inputs</u></p>
    <p>{JSON.stringify(formBadInputs)}</p>
    </div> */}

export default Assessment;