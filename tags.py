import re

# This is for generating tags for contra dances
# (parsing them out of the plaintext format).

# Tag values:
# 0, 1, 2+
# enum

# Tag sources:
# manual, line-sum, whole


class Tag(object):
  """Tag classifier and combiner, turning text into a value for a tag.

  Subclasses should define DefaultMatch and DefaultReduce implementations.
  """
  def __init__(self, fragment, name=None, matcher=None, reducer=None):
    self.fragment = fragment
    self.name = name if name else fragment
    if matcher:
      self.matcher = matcher
    if reducer:
      self.reducer = reducer

  def Match(self, text):
    if hasattr(self, 'matcher'):
      return self.matcher(text)
    return self.DefaultMatch(text)

  def Reduce(self, a, b):
    if hasattr(self, 'reducer'):
      return self.reducer(a, b)
    return self.DefaultReduce(a, b)


class CountTag(Tag):
  def DefaultMatch(self, text):
    return text.count(self.fragment)

  def DefaultReduce(self, a, b):
    return a + b


class ZeroOneTag(Tag):
  def DefaultMatch(self, text):
    # Whole word matching
    match_pos = text.find(self.fragment)
    if match_pos == -1:
      return False
    if match_pos > 0 and text[match_pos - 1].isalnum():
      return False
    if match_pos + len(self.fragment) < len(text) and text[match_pos + len(self.fragment)].isalnum():
      return False
    return True

  def DefaultReduce(self, a, b):
    return a | b


class MultipleProgressionTag(ZeroOneTag):
  def __init__(self):
    self.name = 'multiple progression'

  def DefaultMatch(self, text):
    # triple, quadruple, quintuple, septuple, etc.
    return int('double progression' in text or
               'ple progression' in text)


class BalanceCountTag(CountTag):
  def __init__(self, name):
    self.name = name
    self.rory = re.compile(r"16.*rory o'more")

  def DefaultMatch(self, text):
    # The logic here is a bit complex, due to data inconsistency.
    if 'balanced square thru 4' in text:
      return 2
    elif 'balanced square thru 2' in text:
      return 1
    elif self.rory.search(text):
      return 2
    else:
      return text.count('balance')


_HEADER_TAGS = [
  ZeroOneTag('becket'),
  MultipleProgressionTag(),
  ZeroOneTag('spacious'),  # these should actually be enums
  ZeroOneTag('compact'),
  ZeroOneTag('short wave'),  # these can appear in starting formations
  ZeroOneTag('long wave'),
  ZeroOneTag('proper', matcher=lambda x: x.startswith('proper')),
  ZeroOneTag('proper', name='asymmetric'),
  ZeroOneTag('mixer'),
  ZeroOneTag('English'),
]


_BODY_TAGS = [
  BalanceCountTag('balance'),
  CountTag('allemande'),
  CountTag('circle left'),
  CountTag('hey'),
  CountTag('long lines'),
  CountTag('roll', name='rollaway'),
  CountTag('shoulder round'),
  CountTag('mad robin'),
  CountTag('ladies chain'),
  # TODO(yoz): account for 4-face-4s (e.g. Richfield Stomp, Hey for John)
  ZeroOneTag('N swing', name='N swing',
             matcher=lambda x: 'N' in x and 'swing' in x),
  ZeroOneTag('1s', name='asymmetric'),
  ZeroOneTag('2s', name='asymmetric'),
  ZeroOneTag('gent 1', name='asymmetric'),
  ZeroOneTag('gent 2', name='asymmetric'),
  ZeroOneTag('lady 1', name='asymmetric'),
  ZeroOneTag('lady 2', name='asymmetric'),
  ZeroOneTag('figure 8', name='asymmetric'),
  ZeroOneTag('circle right'),
  ZeroOneTag('short wave'),
  ZeroOneTag('long wave'),
  ZeroOneTag('pass thru to wave', name='short wave'),
  ZeroOneTag('pass the ocean', name='short wave'),
  ZeroOneTag('down the hall'),
  ZeroOneTag('gents allemande left'),
  ZeroOneTag('ladies allemande right'),
  ZeroOneTag('petronella'),
  # TODO(yoz): implement rory logic
  ZeroOneTag('right and left thru'),
  ZeroOneTag('shadow'),
  ZeroOneTag('star promenade'),
  ZeroOneTag('square thru'),
  # TODO(yoz): A1 N bal/gypsy/dosido, swing
  # TODO(yoz): progression types?
]


_A_PART_TAGS = [
  BalanceCountTag('A balance'),
]


_B_PART_TAGS = [
  BalanceCountTag('B balance'),  
]


def ClassifyTags(lines, tags):
  found = {}
  for tag in tags:
    total = 0
    for line in lines:
      value = tag.Match(line)
      if value > 0:
        total = tag.Reduce(total, value)
    if total > 0:
      found[tag.name] = total
  return found


def ClassifyHeaderTags(headers):
  return ClassifyTags(headers, _HEADER_TAGS)


def ClassifyBodyTags(body):
  return ClassifyTags(body, _BODY_TAGS)


def ClassifyABPartTags(body):
  # Split body into A and B.
  found_b = False
  a_lines = []
  b_lines = []
  for line in body:
    if line.startswith('B'):
      found_b = True
    if not found_b:
      a_lines.append(line)
    else:
      b_lines.append(line)
  tags = ClassifyTags(a_lines, _A_PART_TAGS)
  tags.update(ClassifyTags(b_lines, _B_PART_TAGS))
  return tags
