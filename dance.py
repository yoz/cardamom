import sys

import tags


# Utility functions. TODO: put into a line-helper.
def IsPossibleFooter(line):
  if line.startswith(' '):
    return False
  first_word = line.split(' ', 1)[0]
  # TODO: This is quite lazy. It should just not look like A1.
  if first_word.length > 2 or first_word == '-':
    return True
  return False

class Dance(object):
  """Representation of a single dance."""
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
    # Note that starting formation can be parsed for tags.

    # Headers: Explicit tags.
    # Body: Instructions. Implicit tags.
    # Footers: Notes, teaching notes.
    self.headers = [self.starting_formation]
    self.body = []
    self.footers = []
    self.tags = {}

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
        self.headers.append(lines[i])

    self.tags.update(tags.ClassifyHeaderTags(self.headers))
    self.tags.update(tags.ClassifyBodyTags(self.body))

  def AsDict(self):
    return {'name': self.name,
            'author': self.author,
            'starting_formation': self.starting_formation,
            'tags': self.tags,
            'body': self.body}


if __name__ == '__main__':
  """Parse and print tags for the specified dance file."""
  text = open(sys.argv[1]).read()
  dance = Dance(text)
  print 'h', dance.headers
  print 'b', dance.body
  print 't', dance.tags
