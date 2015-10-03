import sys

import tags



def IsPossibleSectionStart(line):
  """Return true if the line begins with something like A1."""
  return len(line) > 3 and 'A' <= line[0] <= 'Z' and (
    line[1] == ' ' or line[2] == ' ' and '0' <= line[1] <= '9')


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

    header_body_break = -1
    body_footer_break = -1
    previous_line_blank = False

    for i in xrange(3, len(lines)):
      # Each line is a tag until a blank line.
      # Then everything is in the body, until a blank line which is
      # not followed by a section header (A2, etc.).

      # TODO: Body consists of dance figures, continuations, or blank lines.
      # Figures are [phrase]? [timing] [figure]
      # Continuations are non-blank, follow figures, and are indented

      # After the body comes notes (footers).
      # Notes might contain variations, more instructions, etc.

      # TODO: Can our template system deal with individual lines in notes
      # possibly being figures?
      # Handlebars might be able to deal.

      if previous_line_blank and header_body_break != i - 1:
        if not IsPossibleSectionStart(lines[i]):
          body_footer_break = i - 1  # break on the blank line
          break
      if lines[i] == '':
        if header_body_break == -1:
          header_body_break = i
        previous_line_blank = True
      else:
        previous_line_blank = False

    if header_body_break == -1:
      # This should never happen.
      raise Exception('No header-body distinction??')

    self.headers.extend(lines[3:header_body_break])
    self.body = lines[header_body_break+1:body_footer_break]
    if body_footer_break != -1:
      self.footers = lines[body_footer_break+1:]

    # Note that this way of doing things means headers can only have
    # binary tags rather than count tags (if they're potentially overwritten).
    self.tags.update(tags.ClassifyHeaderTags(self.headers))
    self.tags.update(tags.ClassifyBodyTags(self.body))
    self.tags.update(tags.ClassifyABPartTags(self.body))

  def AsDict(self):
    return {'name': self.name,
            'author': self.author,
            'starting_formation': self.starting_formation,
            'tags': self.tags,
            'body': self.body,
            'lines': self.lines}


if __name__ == '__main__':
  """Parse and print tags for the specified dance file."""
  text = open(sys.argv[1]).read()
  dance = Dance(text)
  print 'n', dance.name
  print 'a', dance.author
  print 'sf', dance.starting_formation
  print 'h', dance.headers
  print 'b', dance.body
  print 'f', dance.footers
  print 't', dance.tags
