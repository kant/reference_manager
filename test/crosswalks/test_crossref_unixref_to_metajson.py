#!/usr/bin/python
# -*- coding: utf-8 -*-
# coding=utf-8

import os
import json
from referencemanager.crosswalks import crossref_unixref_to_metajson
from referencemanager.services import export_service


def test():
    base_dir = os.path.join(os.getcwd(), "data")
    print "base_dir: " + base_dir

    input_dir = os.path.join(base_dir, "unixref")
    metajson_list = []
    for file_name in os.listdir(input_dir):
        if file_name.endswith(".xml"):
            print file_name
            metajson_list.extend(crossref_unixref_to_metajson.convert_crossref_unixref_file_to_metajson_document_list(os.path.join(input_dir, file_name), file_name, False))

    if metajson_list:
        output_path = os.path.join(base_dir, "result", "result_unixref_metajon.json")
        export_service.export_metajson(metajson_list, output_path)
        print json.dumps(metajson_list, indent=4, ensure_ascii=False, encoding="utf-8", sort_keys=True)
    else:
        assert False
