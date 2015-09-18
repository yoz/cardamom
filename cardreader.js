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
  // Input: dances, a map of dance name -> object
  // object.tags is a dictionary of "name": n (n is an integer)

  // Output: tags, a map of tag name -> max count

  // Infer that a tag is binary if its max value is 1.
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

// TODO(yoz): not in global context
var gendered = true;
var dances;
var templateMain;
// TODO(yoz): show multiple cards, rearrange them, index search, etc.
var selectedDances = [];
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
  var context = {lings: selectedDances.map(function(dance) { return dances[dance].lines; }) };
  var mains = templateMain(context);
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

function getSelectDance(name) {
  return function() {
    selectedDances.push(name);
    redisplayMain();
  };
}

function getUpDance(name, card) {
  return function() {
    var i = selectedDances.indexOf(name);
    var j = (selectedDances.length + i-1) % selectedDances.length;
    console.log([i, j]);
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
  document.getElementById('gender').addEventListener('click', toggleGender);
  document.getElementById('namefilter').addEventListener('input', filterIndex);

  requestURL('template_main.html', function(mainBlob) {
    requestURL('template_index.html', function(indexBlob) {
      var templateIndex = Handlebars.compile(indexBlob);
      templateMain = Handlebars.compile(mainBlob);
      requestURL('data/dances.json', function(danceBlob) {
        dances = JSON.parse(danceBlob);

        // Populate index.
        var indexContext = {names: []};
        for (var name in dances) {
          if (dances.hasOwnProperty(name)) {
            indexContext.names.push(name);
          }
        }
        indexContext.names.sort();
        var elIndex = document.getElementById('index');
        elIndex.innerHTML = templateIndex(indexContext);
        // Add click handlers to index.
        // Set global indexLinks.
        indexLinks = elIndex.getElementsByClassName('indexlink');
        for (var i = 0; i < indexLinks.length; ++i) {
          indexNames[i] = indexLinks[i].firstElementChild.text.toLowerCase();
          var alink = indexLinks[i].firstElementChild;
          alink.addEventListener('click',
                                 getSelectDance(alink.text));
        }

        // Populate tags.
        tags = summarizeTags(dances);
      });
    });
  });
};
