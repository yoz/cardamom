#!/usr/bin/env python
import json  # requires >2.6
import os

from dance import Dance
import tags


def ImportDir(src):
    dances = []
    for filename in os.listdir(src):
        try:
            dances.append(Dance(open(os.path.join(src, filename)).read()))
        except Exception as e:
            print 'Error in %s: %s' % (filename, e)
    return dances


def ImportDirs(srcs):
    dances = []
    for src in srcs:
        dances.extend(ImportDir(src))
    return dances


def DumpDances(dances):
    return json.dumps(dict((x.name,
                            x.AsDict())
                           for x in dances))


if __name__ == '__main__':
    dances = ImportDirs(['../working', '../incomplete'])
    f = open('aout.json', 'w')
    f.write(DumpDances(dances))
    f.close()
