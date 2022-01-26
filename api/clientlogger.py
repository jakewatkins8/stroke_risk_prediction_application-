from os import error
from flask import json, request
from flask_restful import Resource, reqparse

class ClientLogger(Resource):
    def post(self):

        # print(request.headers)
        # try:
            error_queue = request.json
            # print('the entire queue! ->', error_queue)
            # print('from React //', error_data['error'])
            # the error_data is received as a list of JSON objects/dicts.

            # print('the queue:', error_queue)
            
            for error in error_queue:
                # print(error['msg'])
                # print(error)
                print('React:', error['log_string'])

            # return 200

        # except Exception:
        #     print("something went wrong receiving the error...")
        #     return "something went wrong receiving the error..."



