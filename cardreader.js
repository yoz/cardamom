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

var barearms = 'barearms';
var barearm = 'barearm';
var armbands = 'bands';
var armband = 'band';

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
var selectedDance;
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

function redisplayMain() {
  var elMain = document.getElementById('main');
  var context = {lings: dances[selectedDance]};
  var main = templateMain(context);
  // TODO(yoz): can this be more efficient than making copies?
  if (!gendered) {
    for (var fromWord in genderFreeMap) {
      if (genderFreeMap.hasOwnProperty(fromWord)) {
        main = replaceWord(main, fromWord, genderFreeMap[fromWord]);
      }
    }
  }
  elMain.innerHTML = main;
};

function getSelectDance(name) {
  return function() {
    selectedDance = name;
    redisplayMain();
  };
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
        // Populate index.
        dances = JSON.parse(danceBlob);
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
      });
    });
  });
};
