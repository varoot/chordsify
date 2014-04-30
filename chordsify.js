// Generated by CoffeeScript 1.7.1
(function($) {
  var Chords, chordMargin, chordsRegEx, flatKeys, key, keyMap, keyNumber, makeChordElement, makeElement, relativeKey, replaceFlatSharp, restoreFlatSharp, sharpKeys, validKey;
  sharpKeys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  flatKeys = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  keyMap = {
    "C#": 1,
    "C": 0,
    "Db": 1,
    "D#": 3,
    "D": 2,
    "Eb": 3,
    "E": 4,
    "F#": 6,
    "F": 5,
    "Gb": 6,
    "G#": 8,
    "G": 7,
    "Ab": 8,
    "A#": 10,
    "A": 9,
    "Bb": 10,
    "B": 11
  };
  chordsRegEx = new RegExp(((function() {
    var _results;
    _results = [];
    for (key in keyMap) {
      _results.push(key);
    }
    return _results;
  })()).join('|'), 'g');
  chordMargin = 2;
  validKey = function(key) {
    return keyNumber(key) != null;
  };
  keyNumber = function(key) {
    if (key == null) {
      return null;
    }
    if (typeof key === "number" || !isNaN(parseInt(key))) {
      return +key % 12;
    }
    key = key.trim();
    key = key.slice(0, 1).toUpperCase() + key.slice(1);
    return keyMap[key];
  };
  relativeKey = function(key, originalKey) {
    originalKey = keyNumber(originalKey);
    key = keyNumber(key);
    if (!((originalKey != null) && (key != null))) {
      return null;
    }
    return (keyNumber(key) - keyNumber(originalKey) + 12) % 12;
  };
  replaceFlatSharp = function(text, chars) {
    if (text == null) {
      return null;
    }
    return text.replace("b", chars.flat).replace("#", chars.sharp);
  };
  restoreFlatSharp = function(text, chars) {
    if (text == null) {
      return null;
    }
    return text.replace(chars.flat, "b").replace(chars.sharp, "#");
  };
  makeElement = function(type, opts) {
    return $(opts.elements[type]).addClass(opts.classes[type]);
  };
  makeChordElement = function(chordText, key, opts) {
    var $chordTag, $result, rootChord;
    $result = $("<div>");
    rootChord = null;
    chordText = chordText.replace(chordsRegEx, function(chord) {
      var $chordInner, $wrapper, relativeChord;
      $wrapper = $("<div>");
      $chordInner = $(opts.elements.chordInner).addClass(opts.classes.chordInner).text(replaceFlatSharp(chord, opts.chars)).appendTo($wrapper);
      if (rootChord == null) {
        rootChord = keyNumber(chord);
      }
      relativeChord = relativeKey(chord, key);
      if (relativeChord != null) {
        $chordInner.attr(opts.dataAttr.chordRel, relativeChord);
      }
      return $wrapper.html();
    });
    $chordTag = $(opts.elements.chord).addClass(opts.classes.chord).html(chordText).attr(opts.dataAttr.chord, rootChord).appendTo($result);
    return $result.html();
  };
  Chords = function(element, opts) {
    var $element, transposeKey;
    this.element = element;
    this.options = opts;
    $element = $(element);
    this.init($element.attr(opts.dataAttr.originalKey), $element.text());
    transposeKey = $element.attr(opts.dataAttr.transposeKey);
    if (validKey(transposeKey)) {
      this.transpose(transposeKey);
    }
  };
  Chords.prototype.option = function(opts) {
    this.options = $.extend(this.options, opts);
    return this;
  };
  Chords.prototype.text = function() {
    var element, opts, result;
    element = $(this.element);
    opts = this.options;
    result = "";
    element.find("." + opts.classes.block).each(function(i, block) {
      var $block, blockNum, blockType;
      $block = $(block);
      blockType = $block.attr(opts.dataAttr.blockType);
      blockNum = $block.attr(opts.dataAttr.blockNum);
      if ((blockType != null) !== "") {
        result += "[" + blockType + ((blockNum != null) > 0 ? " " + blockNum : "") + "]\n";
      }
      return $block.children("." + opts.classes.paragraph).each(function(j, p) {
        $(p).children("." + opts.classes.line).each(function(k, line) {
          $(line).find("." + opts.classes.lyrics + ", ." + opts.classes.chord).each(function(l, phrase) {
            var $phrase, chordText;
            $phrase = $(phrase);
            if ($phrase.hasClass(opts.classes.chord)) {
              chordText = restoreFlatSharp($phrase.text(), opts.chars);
              if ((chordText != null) !== "") {
                return result += "[" + chordText + "]";
              }
            } else {
              return result += $phrase.text();
            }
          });
          return result += "\n";
        });
        return result += "\n";
      });
    });
    return result;
  };
  Chords.prototype.destroy = function() {
    var $element, opts;
    $element = $(this.element);
    opts = this.options;
    $element.html(this.text()).addClass(opts.classes.raw).removeData("chordsify").removeAttr(opts.dataAttr.transposeKey).attr(opts.dataAttr.originalKey, this.key);
    return this;
  };
  Chords.prototype.replace = function(text) {
    var $element, opts;
    $element = $(this.element);
    opts = this.options;
    return this.init($element.attr(opts.dataAttr.originalKey), text);
  };
  Chords.prototype.position = function() {
    var $element, $lastGapPos, lastChordRight, lastChordTop, lastGapDash, opts;
    $element = $(this.element);
    opts = this.options;
    lastChordRight = 0;
    lastChordTop = 0;
    $lastGapPos = null;
    lastGapDash = false;
    $element.find('.' + opts.classes.gap).remove();
    $element.find('.' + opts.classes.lyrics + ', .' + opts.classes.chord).each(function(i, phrase) {
      var $gap, $phrase, lyrics, nextLyrics, offs;
      $phrase = $(phrase);
      if ($phrase.hasClass(opts.classes.chord)) {
        offs = $phrase.offset();
        if (offs.top === lastChordTop && offs.left < lastChordRight) {
          $gap = makeElement('gap', opts);
          if (lastGapDash) {
            nextLyrics = $phrase.parent().next();
            if (nextLyrics.hasClass(opts.classes.lyrics) && nextLyrics.text().slice(0, 1) !== ' ') {
              $gap.addClass(opts.classes.gapDash);
            }
          }
          if ($lastGapPos == null) {
            $lastGapPos = $phrase.parent().prev();
          }
          $lastGapPos.after($gap);
          $gap.width(lastChordRight - offs.left);
          offs = $phrase.offset();
        }
        lastChordTop = offs.top;
        lastChordRight = offs.left + $phrase.outerWidth() + chordMargin;
        return $lastGapPos = null;
      } else {
        lyrics = $phrase.text();
        if (($lastGapPos == null) || lyrics.slice(-1) === " ") {
          lastGapDash = lyrics.slice(-1) !== " ";
          return $lastGapPos = $phrase;
        }
      }
    });
    return this;
  };
  Chords.prototype.init = function(key, text) {
    var $block, $element, $paragraph, opts;
    $element = $(this.element);
    opts = this.options;
    key = keyNumber(key);
    this.key = key;
    this.originalKey = key;
    $element.html("").removeClass(opts.classes.raw);
    $block = makeElement('block', opts).appendTo($element);
    $paragraph = makeElement('paragraph', opts).appendTo($block);
    $.each(text.trim().split("\n"), function(i, lineText) {
      var $line, matches;
      lineText = lineText.trim();
      matches = lineText.match(opts.blockRegEx);
      if (matches) {
        if ($block.text() !== "") {
          $block = makeElement('block', opts).appendTo($element);
        }
        if ($paragraph.text() !== "") {
          $paragraph = makeElement('paragraph', opts);
        }
        $paragraph.appendTo($block);
        $block.attr(opts.dataAttr.blockType, matches[1]);
        if (matches[2] !== "") {
          $block.attr(opts.dataAttr.blockNum, matches[2]);
        } else {
          $block.removeAttr(opts.dataAttr.blockNum);
        }
        return;
      }
      if (lineText === "") {
        $paragraph = makeElement('paragraph', opts).appendTo($block);
        return;
      }
      $line = makeElement('line', opts).appendTo($paragraph);
      return $.each(lineText.match(/\s*([^\[\]\s]+|\[[^\]]*\])+\s*/g), function(j, wordText) {
        var $textNodes, $word;
        $word = $(opts.elements.word).addClass(opts.classes.word).appendTo($line);
        wordText = wordText.replace(/\[([^\]]*)\]/g, function(match, chordText) {
          var $chordAnchor, $result;
          $result = $("<div>");
          $chordAnchor = $(opts.elements.chordAnchor).addClass(opts.classes.chordAnchor).html(makeChordElement(chordText, key, opts)).appendTo($result);
          return $result.html();
        });
        $textNodes = $word.html(wordText).contents().filter(function() {
          return this.nodeType === 3;
        });
        if ($textNodes.length > 0) {
          return $textNodes.wrap($(opts.elements.lyrics).addClass(opts.classes.lyrics));
        } else {
          return $word.append(' ');
        }
      });
    });
    $element.find('.' + opts.classes.paragraph).each(function(i, p) {
      var $chords, $p;
      $p = $(p);
      $chords = $p.find('.' + opts.classes.chord);
      if ($chords.length === 0) {
        return $p.addClass(opts.classes.noChords);
      }
    });
    return this.position();
  };
  Chords.prototype.transpose = function(key) {
    var $element, chordKeys, k, opts;
    $element = $(this.element);
    opts = this.options;
    key = keyNumber(key);
    this.key = key;
    chordKeys = key === 0 || key === 5 || key === 10 || key === 3 || key === 8 || key === 1 ? flatKeys : sharpKeys;
    chordKeys = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = chordKeys.length; _i < _len; _i++) {
        k = chordKeys[_i];
        _results.push(replaceFlatSharp(k, opts.chars));
      }
      return _results;
    })();
    $element.find("[" + opts.dataAttr.chord + "]").removeAttr(opts.dataAttr.chord);
    $element.find("[" + opts.dataAttr.chordRel + "]").each(function(i, chordTag) {
      var $chordInner, $chordTag, chord, chordRel;
      $chordTag = $(chordTag);
      chordRel = +$chordTag.attr(opts.dataAttr.chordRel);
      chord = (chordRel + key) % 12;
      $chordTag.text(chordKeys[chord]);
      $chordInner = $chordTag.parent();
      if ($chordInner.attr(opts.dataAttr.chord) == null) {
        return $chordInner.attr(opts.dataAttr.chord, chord);
      }
    });
    return this;
  };
  $.fn.chordsify = function(options, param) {
    var opts, result;
    if (typeof options === "string") {
      if (options === "text") {
        result = "";
        this.each(function(i, e) {
          result += $(e).data("chordsify").text();
        });
        return result;
      }
      return this.each(function(i, e) {
        var chords;
        chords = $(e).data("chordsify");
        switch (options) {
          case "option":
            return chords.option(param);
          case "position":
            return chords.position();
          case "replace":
            return chords.replace(param);
          case "destroy":
            return chords.destroy();
          case "transpose":
            return chords.transpose(param);
        }
      });
    }
    if (this.data("chordsify")) {
      return this;
    }
    opts = $.extend(true, {}, $.fn.chordsify.defaults, options);
    return this.each(function(i, e) {
      return $(e).data("chordsify", new Chords(e, opts));
    });
  };
  $.fn.chordsify.defaults = {
    blockRegEx: /^\[\s*(verse|prechorus|chorus|bridge|tag)\s*(\d*)\s*\]$/i,
    chars: {
      flat: "♭",
      sharp: "♯"
    },
    classes: {
      block: "chordsify-block",
      chord: "chordsify-chord",
      chordAnchor: "chordsify-chord-anchor",
      chordInner: "chordsify-chord-inner",
      gap: "chordsify-gap",
      gapDash: "chordsify-gap-dash",
      line: "chordsify-line",
      lyrics: "chordsify-lyrics",
      noChords: "chordsify-no-chords",
      paragraph: "chordsify-paragraph",
      word: "chordsify-word",
      raw: "chordsify-raw"
    },
    dataAttr: {
      blockType: "data-block-type",
      blockNum: "data-block-num",
      chord: "data-chord",
      chordRel: "data-chord-rel",
      originalKey: "data-original-key",
      transposeKey: "data-transpose-to"
    },
    elements: {
      block: "<div>",
      chord: "<sup>",
      chordAnchor: "<span>",
      chordInner: "<span>",
      gap: "<span>",
      line: "<div>",
      lyrics: "<span>",
      paragraph: "<div>",
      word: "<span>"
    }
  };
})(jQuery);
