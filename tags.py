import re

# This is for generating tags for contra dances
# (parsing them out of the plaintext format).

# Tag values:
# 0, 1, 2+
# enum

# Tag sources:
# manual, line-sum, whole


class Tag(object):
  def __init__(self, fragment, name=None):
    self.fragment = fragment
    self.name = name if name else fragment


class CountTag(Tag):
  def Match(self, text):
    return text.count(self.fragment)

  def Reduce(self, a, b):
    return a + b


class ZeroOneTag(Tag):
  def Match(self, text):
    return int(self.fragment in text)

  def Reduce(self, a, b):
    return a | b


class MultipleProgressionTag(ZeroOneTag):
  def __init__(self):
    self.name = 'multiple progression'

  def Match(self, text):
    # triple, quadruple, quintuple, septuple, etc.
    return int('double progression' in text or
               'ple progression' in text)


class BalanceCountTag(CountTag):
  def __init__(self):
    self.name = 'balance'
    self.rory = re.compile(r"16.*rory o'more")

  def Match(self, text):
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
  ZeroOneTag('proper'),
  ZeroOneTag('proper', name='asymmetric'),
]


_BODY_TAGS = [
  BalanceCountTag(),
  CountTag('circle left'),
  CountTag('hey'),
  CountTag('long lines'),
  CountTag('gypsy'),
  CountTag('mad robin'),
  CountTag('ladies chain'),
  # Think about: why aren't these all count tags?
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
  ZeroOneTag('shadow'),
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
