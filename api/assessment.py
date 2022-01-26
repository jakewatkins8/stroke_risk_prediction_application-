

from flask_restful import Resource, reqparse
from flask import app, request, jsonify

from flask_jwt_extended import jwt_required

import numpy as np
import pandas as pd

from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier

# to unpickle and use the pickled classifier model
import pickle


# look into the nature of this import here, of app.py:
import app


# import re for regexes for use in input validation
import re



# print("here:", app.PARENT_MODULE_DIRECTORY)

ml_model = app.ml_model

# unpickle the fitted ColumnTransformer

# use parent module's path to build filepath to transformer:
TRANSFORMER_FILE_PATH = app.PARENT_MODULE_DIRECTORY + "/api/stroke_fitted_transformer.pkl"
# print(TRANSFORMER_FILE_PATH)
transformer = pickle.load(open(TRANSFORMER_FILE_PATH, "rb"))

# print(transformer)
# print("coming to you from assessment.py:", ml_model)


worktypes = {'Private company job (non-government)': 'Private', 
'Self-employed': 'Self-employed', 
'Government job': 'Govt_job', 
'Never worked': 'Never_worked', 
'Stay-at-home parent': 'children'}

smoking = {'Never smoked': 'never smoked',
 'Formerly smoked': 'formerly smoked', 
 'Currently smokes': 'smokes'}


class Assessment(Resource):

    
    @jwt_required(locations='headers')
    def post(self):


                
        parser = reqparse.RequestParser()

        # sex: "",
        # age: 0,
        # hyper: 0,
        # heart: 0,
        # married: "",
        # worktype: "",
        # restype: "",
        # glucose: 0,
        # bmi: 0,
        # smoking: ""
        
        parser.add_argument('sex', type=str)

        # parser.add_argument('age', type=int)
        parser.add_argument('age', type=str)

        # parser.add_argument('', type=int) # hyper and heart prob need to be int -> 0 == no && 1 == yes?
        # parser.add_argument('', type=int)

        parser.add_argument('hyper', type=str)
        parser.add_argument('heart', type=str)
        parser.add_argument('married', type=str)
        parser.add_argument('worktype', type=str)
        parser.add_argument('restype', type=str)
        # TODO -> observe behavior of backend regarding receiving all forms of possible field input from the front end for glucose and bmi.
        # there could be a conflict considering how the regex tests the input.
        # or....it could be fine.
        # why don't I just import them as -->>> strs <<<-- to begin with?
        # parser.add_argument('glucose', type=float)
        parser.add_argument('glucose', type=str)
        # parser.add_argument('bmi', type=float)
        parser.add_argument('bmi', type=str)

        parser.add_argument('smoking', type=str)

        args = parser.parse_args()

        # input val HERE
        
        # escape all...? but, react is supposed to escape for you. hm.
        # Honestly, I think I may be relatively safe from XSS given React's security efforts.
        # I guess I should learn more about it.

        # for now....
        # Maybe I assume the inputs are escaped as received from React, and...
        # -----> just deny any inputs that don't fit the prescribed mold.
        # i.e.  1) binaries can only be option 1 or 2's value
        # 2) number fields must be of the appropriate form (regex?)
        # 3) ternary dropdown fields must only be one of their appropriate options

        # print(args)

        invalid_input = False

        # regexes for age, glucose, and bmi values, in the React frontend (javascript regexes):
        # let ageRegex = /^[1-9]\d{0,2}$/;
        # let wholeNumRegex = /^[1-9]\d{0,4}$/;
        # let decimalRegex = /^[1-9]\d{0,2}\.\d{1,3}$/;

        # return matchObject if True; returns None if False
        # so check for -> is not None

        age_regex = '^[1-9]\d{0,2}$'
        whole_regex = '^[1-9]\d{0,4}$'
        decimal_regex = '^[1-9]\d{0,2}\.\d{1,3}$'

        # wow, after testing, the regexes seem to have been fully portable from js. That's great. GREAT.

        print(args['age'], type(args['age']))
        print(args['glucose'], type(args['glucose']))
        print(args['bmi'], type(args['bmi']))

        # convert the args values for the 3 regex-tested fields to str's,
        # so that the regexes can be applied to test them.

        print('args[age] stripped:', args['age'].strip())

        if (args['age'].strip() is None
        or args['glucose'].strip() is None
        or args['bmi'].strip() is None):
            invalid_input = True
            print('some of it was wrong.')
            return {'error': 'input is invalid'}

        print('sex', args['sex'] not in ['male', 'female']) 
        print('age', re.fullmatch(age_regex, args['age']) is None)
        print('hyper', args['hyper'] not in ['hyperYes', 'hyperNo'])
        print('heart', args['heart'] not in ['heartYes', 'heartNo'])
        print('married', args['married'] not in ['marryYes', 'marryNo'])
        print('worktype', args['worktype'] not in worktypes)
        print('restype', args['restype'] not in ['rural', 'urban'])
        # print('glucose', (re.fullmatch(whole_regex, args['glucose']) or re.fullmatch(decimal_regex, args['glucose'])) is not None)
        # print('bmi', (re.fullmatch(whole_regex, args['bmi']) or re.fullmatch(decimal_regex, args['bmi'])) is not None)

        print('glucose ->', (re.fullmatch(whole_regex, args['glucose']) and re.fullmatch(decimal_regex, args['glucose'])) is None)
        print('bmi ->', (re.fullmatch(whole_regex, args['bmi']) and re.fullmatch(decimal_regex, args['bmi'])) is None)

        print('smoking', args['smoking'] not in smoking)
        print('bmi1', re.fullmatch(whole_regex, args['bmi']) is None)
        print('bmi2', re.fullmatch(decimal_regex, args['bmi']) is None)
        print('glu1', re.fullmatch(whole_regex, args['glucose']) is None)
        print('glu2', re.fullmatch(decimal_regex, args['glucose']) is None)


        # apply the regex tests to the values:

        age_test = re.fullmatch(age_regex, args['age'])

        # bmi & glucose each have a pair of regexes to test with
        # if both regexes are none for a given value, the value is invalid.


        print('bmi', args['bmi'])

        bmi_test_1 = re.fullmatch(whole_regex, args['bmi'])
        bmi_test_2 = re.fullmatch(decimal_regex, args['bmi'])
        print('bmi_t_1 is None -', bmi_test_1 is None)
        print('bmi_t_2 is None -', bmi_test_2 is None)

        print('glu', args['glucose'])

        glucose_test_1 = re.fullmatch(whole_regex, args['glucose'])
        glucose_test_2 = re.fullmatch(decimal_regex, args['glucose'])
        print('glu_t_1 is None -', glucose_test_1 is None)
        print('glu_t_2 is None -', glucose_test_2 is None)
        # TODO -> the program currently rejects an input of integer form "11111".
        # this likely has to do with the typing of 'float' for the argument when it is parsed.

        # this large conditional should validate all input as having been received as required from the front end:
        if (args['sex'] not in ['male', 'female'] 
            or age_test is None
            or args['hyper'] not in ['hyperYes', 'hyperNo']
            or args['heart'] not in ['heartYes', 'heartNo']
            or args['married'] not in ['marryYes', 'marryNo']
            or args['worktype'] not in worktypes
            or args['restype'] not in ['rural', 'urban']
            or (glucose_test_1 is None and glucose_test_2 is None)
            or (bmi_test_1 is None and bmi_test_2 is None)
            # or ((re.fullmatch(whole_regex, args['glucose']) or re.fullmatch(decimal_regex, args['glucose'])) is not None)
            # or ((re.fullmatch(whole_regex, args['bmi']) or re.fullmatch(decimal_regex, args['bmi'])) is not None)
            or args['smoking'] not in smoking
            ): 
        
            invalid_input = True

        else:
            print('it all passed.')


        if invalid_input:
            return {'error': 'input is invalid'}

        # - prepare the received data to go into the model
        print (worktypes, smoking)

        data = {}

        if (args['sex'] == "male"):
            data['sex'] = "Male"
        elif (args['sex'] == "female"):
            data['sex'] = "Female" 

        data['age'] = int(args['age'])
        
        if (args['hyper'] == "hyperYes"):
            data['hyper'] = 1
        elif (args['hyper'] == "hyperNo"):
            data['hyper'] = 0 

        if (args['heart'] == "heartYes"):
            data['heart'] = 1
        elif (args['heart'] == "heartNo"):
            data['heart'] = 0 

        if (args['married'] == "marryYes"):
            data['married'] = "Yes"
        elif (args['married'] == "marryNo"):
            data['married'] = "No"

        data['worktype'] = worktypes[args['worktype']]

        if (args['restype'] == "rural"):
            data['restype'] = "Rural"
        elif (args['restype'] == "urban"):
            data['restype'] = "Urban"

        data['glucose'] = float(args['glucose'])

        data['bmi'] = float(args['bmi'])

        data['smoking'] = smoking[args['smoking']]

        print(data)

        # create a 1x10 (single row) dataframe of the user input data:
        array = np.array([[data['sex'], data['age'], data['hyper'], data['heart'], data['married'], data['worktype'], data['restype'], data['glucose'], data['bmi'], data['smoking']]])

        # print("array: ", array)
            
        df = pd.DataFrame(array, columns=['gender','age','hypertension','heart_disease','ever_married','work_type','Residence_type','avg_glucose_level','bmi','smoking_status'])

        # print(df)

        transformed_x = transformer.transform(df)

        # print(transformed_x)

        predicted_proba = ml_model.predict_proba(transformed_x)
        # print("probabilities", predicted_proba)

        proba_val = str(round((predicted_proba[0][1] * 100), 1)) + "%"
        print("pv:", proba_val)

        classification = ml_model.predict(transformed_x)
        print("classification", classification)
        class_val = int(classification[0])
        # print("cv:", class_val)

        results = {
            "proba": proba_val,
            "classify": class_val
        }

        # x = transform_user_input(array)
        # print(x)

        # - transform the data (one-hot)

        # - predict_proba with model

        # - return result

        response = jsonify(results)
        return response





