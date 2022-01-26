const Results = (props) => {

    return (<>
        {props.percentProba !== "" && (<p>Based on the patient's data, the patient is {props.percentProba} likely to have a stroke in their lifetime.</p>)}
        {props.classify === 1 && (<p>Given the assessment results, the patient should be given medical advice on how to lower their current stroke risk.</p>)}
        {props.classify === 0 && (<p>Given the assessment results, the patient is not at immediate risk of having a stroke. The patient should simply continue to practice healthy lifestyle habits in order to ensure their risk of stroke remains low.</p>)}
    </>
    );
}

export default Results;