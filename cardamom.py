#!/usr/bin/env python
import json  # requires >2.6
import os

# PLAN:
# Dump dances to dances.json. script src it directly.
# Use templating to render it.
# 

class Dance(object):
    #self.name = None
    #self.author = None
    #self.starting_formation = None
    #self.tags = None
    #self.body = None
    # maybe later
    #self.moves = None
    #self.notes = None

    def __init__(self, plaintext):
        lines = plaintext.split('\n')
        self.lines = lines
        self.name = lines[0]
        self.author = lines[1]
        self.starting_formation = lines[2]
        self.tags = []
        for i in xrange(3, len(lines)):
            # Each line is a tag until a blank line.
            # Then everything is in the body.

            # TODO: Body consists of dance figures, continuations, or blank lines.
            # Figures are [phrase]? [timing] [figure]
            # Continuations are non-blank, follow figures, and are indented

            # After the body comes notes.
            # Notes might contain variations, more instructions, etc.

            # TODO: Can our template system deal with individual lines in notes
            # possibly being figures?
            # Handlebars might be able to deal.

            if lines[i] == '':
                self.body = lines[i:]
                break
            else:
                self.tags.append(lines[i])

    def AsDict(self):
        return {'name': self.name,
                'author': self.author,
                'starting_formation': self.starting_formation,
                'tags': self.tags,
                'body': self.body}

def ImportDir(src):
    dances = []
    for filename in os.listdir(src):
        dances.append(Dance(open(os.path.join(src, filename)).read()))
    return dances

def ImportDirs(srcs):
    dances = []
    for src in srcs:
        dances.extend(ImportDir(src))
    return dances

def DumpDances(dances):
    return json.dumps(dict((x.name, x.lines) for x in dances))

if __name__ == '__main__':
    dances = ImportDirs(['../asymmetric', '../4face4/', '../duplesymmetric', '../triplets', '../incomplete'])
    f = open('aout.json', 'w')
    f.write(DumpDances(dances))
    f.close()
