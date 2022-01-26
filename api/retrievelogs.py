import os
from flask import request, Response, send_file, make_response
from flask.ctx import after_this_request
from flask_jwt_extended.utils import get_current_user, get_jwt_identity
from flask_restful import Resource, reqparse
import requests
from flask_jwt_extended import jwt_required
import uuid
from csv import DictWriter

class RetrieveLogs(Resource):

    @jwt_required(locations='headers')
    def get(self):

        current_user = get_jwt_identity()
        print("current user:", current_user)
        if current_user != 'admin':
            return Response(status=403)

        limit = {'limit': 100}
        r = requests.get(
            'https://papertrailapp.com/api/v1/events/search.json',
            params=limit,
            headers={'X-Papertrail-Token': os.environ['PAPERTRAIL_KEY']})
        r.raise_for_status()
        print('status code:', r.status_code)
        if r.status_code == requests.codes.ok:
            res = r.json()
            # obtain the list of all 'events' - a list of dict items:
            log_list = res['events']
            csv_header = log_list[0].keys()
            print(csv_header)
            # print(log_list)
            print(res)
            return res
        return r.status_code


# probably just throw out:
class DownloadLogs(Resource):

    @jwt_required(locations='headers')
    def get(self):

        print('request:', request)
        print(request.headers)

        current_user = get_jwt_identity()
        print("current user:", current_user)
        if current_user != 'admin':
            return Response(status=403)

        limit = {'limit': 100}
        r = requests.get(
            'https://papertrailapp.com/api/v1/events/search.json',
            params=limit,
            headers={'X-Papertrail-Token': os.environ['PAPERTRAIL_KEY']})
        r.raise_for_status()
        print('status code:', r.status_code)
        if r.status_code == requests.codes.ok:
            res = r.json()
            # obtain the list of all 'events' - a list of dict items:
            log_list = res['events']
            csv_header = log_list[0].keys()
            print(csv_header)
            # id = str(uuid.uuid4())
            # print(type(id), id)
            # # append the random uuid to the filename
            # filename = 'logs-' + id + '.csv'

            # the single logs.csv file in the root folder is always overwritten, each time the logs are requested.
            # this is to avoid building up files that would require deletion
            filename = 'logs.csv'
            file = open(filename, 'w', newline='')
            dict_writer = DictWriter(file, csv_header)
            dict_writer.writeheader()
            print("LOG LIST TYPE:", type(log_list))
            dict_writer.writerows(log_list)
            file.close()

            opened_file = open(filename, 'rb')

            response = make_response(send_file(opened_file, mimetype='text/csv', as_attachment=True, download_name=filename))
            response.headers['Content-Disposition'] = "attachment; filename='" + filename + "'"
            response.headers['Access-Control-Expose-Headers'] = '*'
            response.headers['Access-Control-Request-Headers'] = 'Content-Disposition'
            #response.headers['X-Content-Type-Options'] = 'nosniff'
            print(response, response.headers)

            return response

        return r.status_code




