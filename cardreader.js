function requestURL(url, callback) {
  var xhr = new XMLHttpRequest();
  try {
    xhr.onreadystatechange = function(state) {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          var text = xhr.responseText;
          callback(text);
        }
      }
    }
    xhr.onerror = function(error) {
      console.log("xhr error: " + JSON.stringify(error));
      console.dir(error);
    }
    xhr.open("GET", url, true);
    xhr.send({});
  } catch(e) {
    console.log("exception: " + e);
  }
}

function summarizeTags(dances) {
  // Input: dances, an array of dances
  // dance.tags is a dictionary of "name": n (n is an integer)

  // Output: tags, a dictionary of "tag": name, "count": count
  var tagMaxCounts = {};

  for (var i = 0; i < dances.length; ++i) {
    _.each(dances[i].tags, function(count, tag, list) {
      if (!_.has(tagMaxCounts, tag))
        tagMaxCounts[tag] = count;
      else
        tagMaxCounts[tag] = Math.max(tagMaxCounts[tag], count);
    });
  }

  return _.map(tagMaxCounts, function(count, tag, list) {
    return {tag: tag, count: count};
  }).sort(function(a, b) {
    if (a.tag < b.tag)
      return -1;
    if (a.tag > b.tag)
      return 1;
    return 0;
  });
}

// TODO(yoz): Make this toggleable.
var barearms = 'ravens';
var barearm = 'raven';
var armbands = 'larks';
var armband = 'lark';

// All of these only match complete words.
// TODO(yoz): Deal with punctuation/apostrophes.
var genderFreeMap = {
  'ladies': barearms,
  'lady': barearm,
  'gents': armbands,
  'gent': armband,
  'women': barearms,
  'woman': barearm,
  'men': armbands,
  'man': armband,
};

// TODO(yoz): globals are gross
var gendered = true;
var dances;
var templateCard;
// TODO(yoz): show multiple cards, rearrange them, index search, etc.
var selectedDances = [];
var tagFilters = {};
var indexLinks;
var indexNames = [];

function replaceWord(text, fromWord, toWord) {
  function capitalize(word) {
    return word[0].toUpperCase() + word.slice(1);
  }
  // TODO(yoz): don't rebuild regexps so much
  var re = new RegExp('\\b' + fromWord + '\\b', 'g');
  var recap = new RegExp('\\b' + capitalize(fromWord) + '\\b', 'g');
  return text.replace(re, toWord).replace(recap, capitalize(toWord));
}

// TODO(yoz): update changed cards only, more efficiently

function redisplayMain() {
  var elMains = document.getElementById('mains');
  var context = {lings: selectedDances.map(function(index) { return dances[index].lines; }) };
  var mains = templateCard(context);
  // TODO(yoz): can this be more efficient than making copies?
  if (!gendered) {
    for (var fromWord in genderFreeMap) {
      if (genderFreeMap.hasOwnProperty(fromWord)) {
        mains = replaceWord(mains, fromWord, genderFreeMap[fromWord]);
      }
    }
  }
  elMains.innerHTML = mains;

  var controls = document.getElementsByClassName('cardcontrols');
  for (var i = 0; i < selectedDances.length; ++i) {
    var x = controls[i];
    var name = selectedDances[i];
    x.getElementsByClassName('up')[0].addEventListener('click', getUpDance(name, x.parentNode));
    x.getElementsByClassName('down')[0].addEventListener('click', getDownDance(name, x.parentNode));
    x.getElementsByClassName('out')[0].addEventListener('click', getCloseDance(name, x.parentNode));
  }
};

function getSelectDance(index) {
  return function() {
    selectedDances.push(index);
    redisplayMain();
  };
}

// TODO(yoz): These aren't really "names" but "indices" now.
function getUpDance(name, card) {
  return function() {
    var i = selectedDances.indexOf(name);
    var j = (selectedDances.length + i-1) % selectedDances.length;
    selectedDances.splice(i, 1);
    selectedDances.splice(j, 0, name);
    redisplayMain();  // TODO(yoz): reorder DOM?
  }
}

function getDownDance(name, card) {
  return function() {
    var i = selectedDances.indexOf(name);
    var j = (i+1) % selectedDances.length;
    selectedDances.splice(i, 1);
    selectedDances.splice(j, 0, name);
    redisplayMain();  // TODO(yoz): reorder DOM?
  }
}

function getCloseDance(name, card) {
  return function() {
    var i = selectedDances.indexOf(name);
    selectedDances.splice(i, 1);
    card.parentNode.removeChild(card);
  }
}

function toggleGender(name) {
  gendered = document.getElementById('gender').checked;
  redisplayMain();
}

// TODO(yoz): What is a sensible return type for this?
function tagboxIndexToValue(index) {
  if (index == 0)  // cross-product split
    return 'x';
  if (index == 1)  // 0
    return 0;
  if (index % 2 == 0)  // 1, 2, ...
    return index / 2;
  if (index % 2 == 1)  // 1+, 2+, ...
    return -Math.floor(index / 2);
}

function getToggleTag(tagName, value) {
  return function(event) {
    function isSelected(tagButton) {
      return tagButton.classList.contains('tag-selected');
    }

    function getSelectedInTagbox(tagButton) {
      var parent = tagButton.parentNode.parentNode;
      var selectedTagButtons = parent.getElementsByClassName('tag-selected');
      if (selectedTagButtons)
        return selectedTagButtons[0];
      return null;
    }

    function deselectTagButton(tagButton) {
      tagButton.classList.remove('tag-selected');
      tagButton.classList.add('tag');
      delete tagFilters[tagName];
    }

    function selectTagButton(tagButton) {
      tagButton.classList.remove('tag');
      tagButton.classList.add('tag-selected');
      tagFilters[tagName] = value;
    }

    tagButton = event.target;
    if (isSelected(tagButton)) {
      deselectTagButton(tagButton);
    } else {
      var activeTag = getSelectedInTagbox(tagButton);
      if (activeTag)
        deselectTagButton(activeTag);
      selectTagButton(tagButton);
    }
  };
}

// TODO(yoz): filter on tags.
function filterIndex() {
  var nameFilter = document.getElementById('namefilter').value.toLowerCase();
  for (var i = 0; i < indexNames.length; ++i) {
    if (indexNames[i].search(nameFilter) > -1) {
      indexLinks[i].classList.remove('hidden');
    } else {
      indexLinks[i].classList.add('hidden');
    }
  }
}

window.onload = function() {
  requestURL('template_card.html', function(cardBlob) {
    requestURL('template_whole.html', function(wholeBlob) {
      templateCard = Handlebars.compile(cardBlob);
      var templateWhole = Handlebars.compile(wholeBlob);
      requestURL('data/dances.json', function(danceBlob) {
        dances = JSON.parse(danceBlob);
        // Sort dances so they have a consistent index, alphabetical order.
        // TODO(yoz): Get a better UID that can survive data changes.
        dances.sort(function(a, b) {
          if (a.name < b.name)
            return -1;
          if (a.name > b.name)
            return 1;
          return 0;
        });

        // Generate tag summary and counts.
        var tags = summarizeTags(dances);
        console.log(tags);
        // We infer that a tag is binary if its max value is 1.
        // Can we clean this up?
        // binaryTags: a list of tag names
        var binaryTags = _.pluck(
          _.filter(tags, function(tcpair) { return tcpair.count == 1; }),
          'tag');
        // countTags: a list of {tag: tagname, counters: [0..n]}
        // (We expand n to the array [0..n] here, but a handlebars helper
        // might be more efficient.)
        var countTags = _.map(
          _.filter(tags, function(tcpair) { return tcpair.count > 1; }),
          function(tcpair, i, list) {
            return {tag: tcpair.tag,
                    counters: _.range(2, tcpair.count + 1)};
          });

        // Populate left-side index.
        var indexContext = {names: [],
                            binary_tags: binaryTags,
                            count_tags: countTags};
        for (var i = 0; i < dances.length; ++i) {
          indexContext.names.push(dances[i].name);
        }

        document.body.innerHTML = templateWhole(indexContext);

        document.getElementById('gender').addEventListener('click', toggleGender);
        document.getElementById('namefilter').addEventListener('input', filterIndex);

        // Add click handlers to tags.
        var tagboxes = document.getElementsByClassName('tagbox');
        for (var i = 0; i < tagboxes.length; ++i) {
          var tagButtons = tagboxes[i].getElementsByTagName('input');
          // First tag is our tag identifier.
          var tagName = '';
          for (var j = 0; j < tagButtons.length; ++j) {
            if (j == 0)
              tagName = tagButtons[j].value;
            tagButtons[j].addEventListener(
              'click',
              getToggleTag(tagName, tagboxIndexToValue(j)));
          }
        }

        // Add click handlers to index.
        // Set global indexLinks.
        var elIndex = document.getElementById('index');
        indexLinks = elIndex.getElementsByClassName('indexlink');
        for (var i = 0; i < indexLinks.length; ++i) {
          indexNames[i] = indexLinks[i].firstElementChild.text.toLowerCase();
          var alink = indexLinks[i].firstElementChild;
          alink.addEventListener('click',
                                 getSelectDance(i));
        }

      });
    });
  });
};
