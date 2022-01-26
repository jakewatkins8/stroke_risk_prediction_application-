from re import escape
from flask import Flask, json, render_template, request, jsonify, send_from_directory
from flask_jwt_extended.utils import create_refresh_token, get_jwt_identity, get_unverified_jwt_headers, set_access_cookies
from flask_restful import Api, Resource, reqparse
from sqlalchemy.sql.schema import Table
from werkzeug.security import generate_password_hash, check_password_hash, safe_str_cmp
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS, cross_origin
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt
import re

from sqlalchemy import text

import time

from datetime import datetime, timezone, timedelta

# to unpickle and store the pickled classifier model
import pickle

# was just to gen secret keys
import os

import sqlite3

# app.py's absolute filepath: __file__ (it is the calling module's filepath)
# print("file path of calling module determined at runtime:", __file__)
# print("abs. file path to calling module:", os.path.abspath(__file__))
PARENT_MODULE_DIRECTORY = os.path.abspath(os.path.dirname(__file__))
# print('parent module directory:', PARENT_MODULE_DIRECTORY)
# print("directory of calling module's path:", PARENT_MODULE_DIRECTORY)
# print(os.path.join(PARENT_MODULE_DIRECTORY, 'some_other_module?'))

# for the old file setup:
# STATIC_FOLDER_PATH = os.path.abspath(os.path.join(PARENT_MODULE_DIRECTORY, os.pardir)) + "/build"
# print("static folder path:", STATIC_FOLDER_PATH)


# print("working directory:", os.getcwd())
STATIC_FOLDER_PATH = os.path.abspath('./build')
# print('another static path:', STATIC_FOLDER_PATH)

app = Flask(__name__, static_folder=STATIC_FOLDER_PATH, static_url_path="")




@app.route("/", defaults={'path': ''})
def serve(path):
    return send_from_directory(app.static_folder, 'index.html')

# @app.route('/', defaults={'path': ''})
# @app.route('/<path:path>')
# def index(path):
#     print("app routing to '/' received.")
#     return app.send_static_file("index.html")


@app.errorhandler(404)
def not_found(e):
    print('404 error thrown. error handler running.')

    # maybe just always send index.html if a 404 occurs...?
    # return send_from_directory(app.static_folder, 'index.html')
    
    # FIXME: work on this. It does show.
    # maybe serve a React 404 page.

    return jsonify({'errormsg': 'uh, 404. \n The server couldn\'t process your request.'}), 404


# secret key after generated using:
# print("key1:", os.urandom(16))
# print("key2:", os.urandom(16))


try:
    app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
except KeyError:
    print("the environment variable SECRET_KEY could not be found.")

try:
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['SQLALCHEMY_DATABASE_URI']
except KeyError:
    print("the environment variable SQLALCHEMY_DATABASE_URI could not be found.")

try:
    app.config['JWT_SECRET_KEY'] = os.environ['JWT_SECRET_KEY']
except:
    print("the environment variable JWT_SECRET_KEY could not be found.")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['PROPAGATE_EXCEPTIONS'] = True

# does this need to be in an env. variable?
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(minutes=120)
# app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(seconds=20)



# and this one, too?
# I am actually currently doing this in a more roundabout way.
# The roundabout-ness may be necessary in order to expose the expiration_time in the jwt body,
# so that my front-end can obtain it to use in knowing when to refresh.
# ...I am not sure though.
# app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=10)


# using flask_RESTful
api = Api(app)

# using flask_JWT_Extended
jwt_mgr = JWTManager(app)


# use flask CORS during development while React is on port :3000 and Flask is on :5000
# comment out for live build
CORS(app, supports_credentials=True)

db = SQLAlchemy(app)

@jwt_mgr.unauthorized_loader
def missing_token_callback(error):

    print(error)

    return jsonify({'errormsg': 'Since there was no JWT present on the request, the server couldn\'t process it.'}), 401



class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(18), nullable=False, unique=True)
    password = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f'{self.id}, {self.username}'




# add the 380 Patients from the stroke_df_even_split

# I can't figure out how to just add another table on sqlalchemy. instead of having to always create_all() and remake the DB every time.
# so, create_all() it is.

# Patient class in DB to hold patient sample datapoints:

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gender = db.Column(db.String, nullable=False)
    # age is binary vals - 0 or 1
    age = db.Column(db.Integer, nullable=False)
    # also binary vals - 0 or 1
    hyper = db.Column(db.Integer, nullable=False)
    # also binary vals - 0 or 1
    heart_d = db.Column(db.Integer, nullable=False)
    ever_married = db.Column(db.String, nullable=False)
    work_type = db.Column(db.String, nullable=False)
    res_type = db.Column(db.String, nullable=False)
    avg_glucose = db.Column(db.Float, nullable=False)
    bmi = db.Column(db.Float, nullable=False)
    smoking = db.Column(db.String, nullable=False)
    # also binary vals - 0 or 1
    stroke = db.Column(db.Integer, nullable=False)

    def __init__(self, gender, age, hyper, heart_d, ever_married, 
    work_type, res_type, avg_glucose, bmi, smoking, stroke):
        self.gender = gender 
        self.age = age 
        self.hyper = hyper 
        self.heart_d = heart_d
        self.ever_married = ever_married
        self.work_type = work_type
        self.res_type = res_type
        self.avg_glucose = avg_glucose
        self.bmi = bmi
        self.smoking = smoking
        self.stroke = stroke

    """ method to serialize the contents of a Patient object to be sent in a JSON response"""
    def toJSON(self):
        return {
        'id'          : self.id, 
        'gender'      : self.gender,
        'age'         : self.age,
        'hyper'       : self.hyper,
        'heart_d'     : self.heart_d,
        'ever_married': self.ever_married,
        'work_type'   : self.work_type,
        'res_type'    : self.res_type,
        'avg_glucose' : self.avg_glucose,
        'bmi'         : self.bmi, 
        'smoking'     : self.smoking,
        'stroke'      : self.stroke
        }



    def __repr(self):
        return f'''{self.gender, self.age, self.hyper, self.heart_d,
        self.ever_married, self.work_type, self.res_type, self.avg_glucose,
        self.bmi, self.smoking, self.stroke}'''

class Login(Resource):


    def post(self):

        parser = reqparse.RequestParser()
        parser.add_argument('username', type=str)
        parser.add_argument('password', type=str)
        
        args = parser.parse_args()

        # print("ARGS:", args)
        username = args['username']
        # print(type(username))
        # print(username)
        password = args['password']

        # get user by username
        user = db.session.query(User).filter_by(username=username).first()
        # print(user)
        if user is None:
            return {'error': 'Incorrect username and/or password.'}
        else:
            # print('congratulations, that user exists.', user)
            # check if password correct and return result
            # does the below need to be a str_safe_comp?
            if check_password_hash(user.password, password):
                # print("authentication successful.")
                
                # number of seconds to expiration;
                # the official JWT 'exp' claim format is a 'NumericDate' -
                # a time given as the no. of *seconds*(not ms) elapsed since the Unix epoch (01-01-1970 00:00)
                seconds_to_expire = 300
                # prepare an exp. time as a unix time in seconds:
                expiration = time.time() + seconds_to_expire
                print(expiration, type(expiration))
                # convert the exp. time to an int:
                expiration = int(expiration)
                additional_claims = {'exp': expiration}
                # ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                # There is a chance I now don't need to set 'exp' in the add'tl claims, if I add the 'expires_delta' kwarg. ('expires_delta=expiration')
                access_token = create_access_token(identity=username, fresh=True, additional_claims=additional_claims)
                refresh_token = create_refresh_token(identity=username)
                response = {
                    "active_user": user.username,
                    "access_token": access_token,
                    "expiration_time": int(seconds_to_expire),
                    "refresh_token": refresh_token
                    } 
                # expiration_time in seconds
                print(jsonify(response))
                return jsonify(response)
            else:
                print("incorrect password.")
                return {'error': 'Incorrect username and/or password.'}




# # maybe use this method in Login and TokenRefresh? No...
# def get_expiration_time():
#     pass
        

class TokenRefresh(Resource):
    @jwt_required(refresh=True)
    def post(self):



        # trivially, unnecessarily different from the login method above's seconds_to_expire;
        # a source of trouble if not changed:
        seconds_to_expire = 300

        current_user = get_jwt_identity()
        new_token = create_access_token(identity=current_user, fresh=False)
        return {"access_token": new_token,
        "expiration_time": int(seconds_to_expire)}


class PatientData(Resource):


    @jwt_required(locations='headers')
    def get(self):


        # claims = get_jwt()
        # print(claims['exp'], time.localtime(claims['exp']))

        # the 'exp' property is a Unix date containing the time the token expires:
        # a Unix epoch time in seconds, not milliseconds(like JS.)

 
        patientData = db.session.query(Patient).all()
        # print(patientData)
        # print(type(patientData))
        jsonList = [patient.toJSON() for patient in patientData]
        # print("jsonList", jsonList)
        return jsonify(jsonList)


# use of regexes to verify input custom query data in some cases for age, bmi, and glucose queries:

int_regex = '^[1-9]\d{0,2}$'
whole_regex = '^[1-9]\d{0,4}$'
decimal_regex = '^[1-9]\d{0,2}\.\d{1,3}$'


class CustomQuery(Resource):

    @jwt_required(locations='headers')
    def post(self):

        # query_object = request.json

        # print (dict.keys(query_object))

        # print ("request", request.json)

        # If 0, 1, 2, and 3 are in the keys,
        # parse their contents into a query and run the query.
        
        parser = reqparse.RequestParser()

        statement_keys = {0: '0', 1: '1', 2: '2', 3: '3'}

        for key in statement_keys:
                parser.add_argument(statement_keys[key], type=dict)

        
        # keys with no query object are 'None'

        args = parser.parse_args()

        print("arguments. ", args)

        query_data = {}
        
        for arg in args:
            if (args[arg] is not None):
                query_data[arg] = args[arg]

        print("query data:", query_data)


        # base query patientData = db.session.query(Patient).all()

        # 12 attributes:
        # of which, 7 can throw an InvalidTextFormat exception from psycopg2 - now that the server is using a PostgreSQL database.
        # the error occurs whenever a number-format attribute's value is anything that can't act as a number.
        # i.e. "WHERE id='' OR 'a' or 's3la'"
        
        # the 7 affected fields are:
            # 5 integer (int) fields:
                # id integer
                # age integer
                # hyper integer
                # heart_d integer
                # stroke integer
            # 2 double precision (float) fields:
                # avg_glucose double precision
                # bmi double precision
            

        # id integer
        # gender character varying
        # age integer
        # hyper integer
        # heart_d integer
        # ever_married character varying
        # work_type character varying
        # res_type character varying
        # avg_glucose double precision
        # bmi double precision
        # smoking character varying
        # stroke integer



        types = {
            'base': 'base',
            'andor': 'andor'
        }
        chain_ops = {
            'and': ' AND ',
            'or': ' OR '
        }
        attrs = {
            'id': 'id',
            'sex': 'gender',
            'age': 'age',
            'hyper': 'hyper',
            'heart_d': 'heart_d',
            'ever_married': 'ever_married',
            'worktype': 'work_type',
            'restype': 'res_type',
            'avg_glucose': 'avg_glucose',
            'bmi': 'bmi',
            'smoking': 'smoking',
            'stroke': 'stroke'
        }
        operators = {
            'equals': '=',
            'notequals': '!=', 
            'greaterthan': '>',
            'lessthan': '<',
            'greaterthanequal': '>=',
            'lessthanequal': '<=',
            'contains': ' LIKE ',
            'notcontains': ' NOT LIKE '
        }
        

        sql_string_base = 'SELECT * FROM patient WHERE '

        attr_vals = [0, 1, 2, 3]

        for statement in query_data:
            st_type = query_data[statement]['type']
            chain_op = query_data[statement]['chaining_op']
            attr = query_data[statement]['attribute']
            operator = query_data[statement]['operator']


            # take each of the above values, and reassign them their appropriate values by looking each up in the dicts defined above:
            st_type = types[st_type]
            if chain_op is not None:
                chain_op = chain_ops[chain_op]
            else:
                chain_op = ''

            attr = attrs[attr]
            print('attribute selected:', attr)
        
            # the operator is the one that is really impactful here:
            operator = operators[operator]

            # escape the user input value after obtaining it here (attrvals)
            attr_val = query_data[statement]['attributeval']


            #################   
            
            # apply the regex tests to the values:

            # bmi & glucose each have a pair of regexes to test with;
            # because the values can each be either a whole or a decimal number.
            # if both regexes are None for a given value, the value is invalid.

            # glucose_test_1 = re.fullmatch(whole_regex, args['glucose'])
            # glucose_test_2 = re.fullmatch(decimal_regex, args['glucose'])


            ##########

            # if attribute needs to be casted to text in order to query, do so here:
            # if attr in ['id', 'age', 'hyper', 'heart_d', 'avg_glucose', 'bmi', 'stroke']:

            if operator in ['>', '<', '>=', '<=']:
                if attr in ['id', 'age']:
                    # make sure the entered attr_val is an integer:
                    if not re.fullmatch(int_regex, attr_val):
                        # dismiss the query as trivial:
                        # set the queried id or age to 0; will return 0 results, because there are no patients with ID or age of 0.
                        # and set the operator to 'equals', to ensure no results can be returned:
                        print(attr_val, '<- bad input; setting attr_val to 0, and operator to \'equals\'.')
                        attr_val = 0
                        operator = '='
                    attr = attr + "::integer"                    
                elif attr in ['avg_glucose', 'bmi']:
                    # make sure the entered attr_val is a whole or decimal number:
                    if not re.fullmatch(whole_regex, attr_val) and not re.fullmatch(decimal_regex, attr_val):
                        # dismiss the query as trivial:
                        # set the queried bmi or glucose to 0; will return 0 results, because there are no patients with ID or age of 0.
                        # and set the operator to 'equals', to ensure no results can be returned:
                        print(attr_val, '<- bad input; setting attr_val to 0, and operator to \'equals\'.')
                        attr_val = 0
                        operator = '='
                    attr = attr + "::float"
            else:
                # attr = attr + '::text'
                #testing
                attr = attr + "::varchar(255)"
            

            print('checking this attribute:', attr)
            
            # if attr in ['avg_glucose', 'bmi']:
            #     print('this ATTRIBUTE is in the list.')
            #     # attr_val = 'CAST(' + attr_val + ' as character varying)'
            #     # attr_val = attr_val + "::float"
            #     # print(attr)
            #     attr = attr + "::varchar(255)"
            #     pass

            # only accept special case of "Self-employed" without escape:
            if attr_val == "Self-employed":
                pass
            else:

                # testing
                # attr_val = escape(attr_val)
                pass

            print('statement contents ->', st_type, chain_op, attr, operator, attr_val)

            print('attr val:', attr_val)
            print(type(attr_val))
            # attr_val = '\'' + attr_val + '\''

            # attr_val = float(attr_val)

            # attr_val = str(attr_val)

            # regardless of whether the input attribute value is a string or number,
            # if the operator is LIKE or NOT LIKE (contains or not contains),
            # set the attr_val as a string with wildcard characters on both ends:
            if operator == ' LIKE ' or operator == ' NOT LIKE ':
                print("op.", operator)
                
                attr_val = '%' + attr_val + '%'



            # elif (str(attr_val).isnumeric()):
            #     # else, if the value is numeric, no quotes around the attribute value.
            #     print(attr_val, 'is a numeric val')
            #     # convert back to a float or int after escaping the string earlier:
            #     # convert to float first and then if attr_val.is_integer(), convert to int.
            #     if(float(attr_val).is_integer()):
            #         attr_val = int(attr_val)
            #         print('is an integer:', int(attr_val))

            #         # test:
            #         attr_val = str(attr_val)
            #     else:
            #         attr_val = float(attr_val)
            #         print('not integer, it\'s a float:', float(attr_val))

            # if the attr_val is a string and didn't meet either of the above conditions, nothing has to be done to it. It will be used as the escaped string it is.

            
            attr_vals[int(statement)] = attr_val

            sql_string = '{chain_op}{attr}{operator}{attr_val}'.format(chain_op=chain_op,attr=attr, operator=operator, attr_val=(':attr_val_' + str(statement))) 

            # print(">>>>>", statement) # statement number

            # print(sql_string)

            sql_string_base += sql_string

        sql_string_base = sql_string_base + ';'
        sql_text = text(sql_string_base)

        print (sql_string_base)
        print(attr_vals)




        result = db.session.execute(sql_text, params={
            'attr_val_0': attr_vals[0],
            'attr_val_1': attr_vals[1],
            'attr_val_2': attr_vals[2],
            'attr_val_3': attr_vals[3]
            }).all()
        # print(type(result), "->", result)
        # print(type(result[0]), result[0])

        # jsonList = [patient.toJSON() for patient in result]

        rowDictList = [row._asdict() for row in result]
        # print(rowDictList)

        return jsonify(rowDictList)

        # print("jsonList", len(jsonList))
        # return jsonify(jsonList)




# # just ran the below line once when creating the SQLite db.
# and then once AGAIN, when creating and populating the PostgreSQL development db.
# db.drop_all()
# db.create_all()

# # read in the Patient data from the .csv file:

# import csv

# c_reader = csv.reader(open("./api/balanced_stroke_data_edited.csv"))
# next(c_reader) # skip first row
# for row in c_reader:
#     gender = row[0]
#     age = row[1]
#     hyper = row[2]
#     heart_d = row[3]
#     ever_married = row[4]
#     work_type = row[5]
#     res_type = row[6]
#     avg_glucose = row[7]
#     bmi = row[8]
#     smoking = row[9]
#     stroke = row[10]
#     print(age, hyper, heart_d, ever_married, work_type, res_type, avg_glucose, bmi, smoking, stroke)
#     print(row)
#     # self, gender, age, hyper, heart_d, ever_married, 
#     # work_type, res_type, avg_glucose, bmi, smoking, stroke):
#     patient = Patient(gender, age, hyper, heart_d, ever_married, work_type, res_type, avg_glucose, bmi, smoking, stroke)
#     print("patient: >")
#     print(patient)
#     db.session.add(patient)

# db.session.commit()


# # manually created 'admin, admin' user and hashed & salted the password.
# # db will auto-gen the id
# pw = 'admin'
# hashed_pw = generate_password_hash(pw, "pbkdf2:sha256", 8)
# default_user = User(username='admin', password=hashed_pw)
# db.session.add(default_user)
# db.session.commit()


# # going to try and create a new 'user, user' user:
# user_pw = 'user'
# hashed_user_pw = generate_password_hash(user_pw, "pbkdf2:sha256", 8)
# other_user = User(username='user', password=hashed_user_pw)
# db.session.add(other_user)
# db.session.commit()


model_path = PARENT_MODULE_DIRECTORY + "/api/stroke_classifier.pkl"
# and load it here:
ml_model = pickle.load(open(model_path, 'rb'))

# print(model_path)
# print (ml_model)

# all good on the paths, apparently.

# moved import to try and resolve circularity
# from api.assessment import Assessment
from api.assessment import Assessment

from api.clientlogger import ClientLogger

from api.retrievelogs import RetrieveLogs, DownloadLogs

api.add_resource(Login, '/login')

api.add_resource(Assessment, '/assessment')

api.add_resource(PatientData, '/api/patients')

api.add_resource(CustomQuery, '/api/customquery')

api.add_resource(TokenRefresh, '/api/refresh')

api.add_resource(ClientLogger, '/api/clientlogger')

api.add_resource(RetrieveLogs, '/api/retrievelogs')

api.add_resource(DownloadLogs, '/api/retrievelogs/download')


# Comment out for live deployment:
if (__name__ == '__main__'):
    app.run(debug=True)


