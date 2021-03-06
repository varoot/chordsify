#
# Chordsify 0.2
# Last update: 2014-04-28
# Author: Varoot Phasuthadol
#
(($) ->
	sharpKeys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
	flatKeys = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

	# Flat and sharp chords need to come before natural chords for RegEx to work
	keyMap =
		"C#": 1,  "C" : 0,
		"Db": 1,  "D#": 3,  "D" : 2
		"Eb": 3,  "E" : 4
		"F#": 6,  "F" : 5
		"Gb": 6,  "G#": 8,  "G" : 7
		"Ab": 8,  "A#": 10, "A" : 9
		"Bb": 10, "B" : 11

	chordsRegEx = new RegExp((key for key of keyMap).join('|'), 'g');
	chordMargin = 2

	#
	# Helper functions
	#

	# Check if a key is valid
	# Key can be a number (0-12) or a string (A-G)
	validKey = (key) ->
		keyNumber(key)?

	# Returns a numeric key (0-12)
	keyNumber = (key) ->
		return null  unless key?
		return +key % 12  if typeof key is "number" or not isNaN(parseInt(key))
		
		# Else, assume a string
		key = key.trim()
		
		# Apply uppercase to the first letter
		key = key.slice(0, 1).toUpperCase() + key.slice(1)
		keyMap[key]

	# Calculate key number relative to the original key
	relativeKey = (key, originalKey) ->
		originalKey = keyNumber(originalKey)
		key = keyNumber(key)
		return null  unless originalKey? and key?
		return (keyNumber(key) - keyNumber(originalKey) + 12) % 12

	replaceFlatSharp = (text, chars) ->
		return null  unless text?
		text.replace("b", chars.flat).replace("#", chars.sharp)

	restoreFlatSharp = (text, chars) ->
		return null  unless text?
		text.replace(chars.flat, "b").replace(chars.sharp, "#")

	makeElement = (type, opts) ->
		$(opts.elements[type])
			.addClass opts.classes[type]

	makeChordElement = (chordText, key, opts) ->
		$result = $("<div>")
		rootChord = null

		chordText = chordText.replace chordsRegEx, (chord) ->
			$wrapper = $("<div>")
			$chordRoot = $(opts.elements.chordRoot)
				.addClass opts.classes.chordRoot
				.text replaceFlatSharp(chord, opts.chars)
				.appendTo $wrapper
			rootChord = keyNumber(chord)  unless rootChord?
			relativeChord = relativeKey(chord, key)
			$chordRoot.attr(opts.dataAttr.chordRel, relativeChord)  if relativeChord?
			$wrapper.html()

		$chordTag = $(opts.elements.chord)
			.addClass opts.classes.chord
			.html chordText
			.attr opts.dataAttr.chord, rootChord
			.appendTo $result
		$result.html()
	
	#
	#	Main class
	#	
	Chords = (element, opts) ->
		@element = element
		@options = opts
		$element = $(element)
		@init $element.attr(opts.dataAttr.originalKey), $element.text()
		transposeKey = $element.attr(opts.dataAttr.transposeKey)
		@transpose transposeKey  if validKey(transposeKey)
		return

	Chords::option = (opts) ->
		@options = $.extend(@options, opts)
		return this

	Chords::text = ->
		element = $(@element)
		opts = @options
		result = ""
		element.find("." + opts.classes.section).each (i, section) ->
			$section = $(section)
			sectionType = $section.attr(opts.dataAttr.sectionType)
			sectionNum = $section.attr(opts.dataAttr.sectionNum)
			result += "[" + sectionType + (if sectionNum? > 0 then " " + sectionNum else "") + "]\n"  if sectionType? isnt ""
			$section.children("." + opts.classes.paragraph).each (j, p) ->
				$(p).children("." + opts.classes.line).each (k, line) ->
					$(line).find("." + opts.classes.lyrics + ", ." + opts.classes.chord).each (l, phrase) ->
						$phrase = $(phrase)
						if $phrase.hasClass(opts.classes.chord)
							chordText = restoreFlatSharp($phrase.text(), opts.chars)
							result += "[" + chordText + "]"  if chordText? isnt ""
						else
							result += $phrase.text()
					result += "\n"
				result += "\n"
		return result

	Chords::destroy = ->
		$element = $(@element)
		opts = @options
		$element.html @text()
			.addClass opts.classes.raw
			.removeData "chordsify"
			.removeAttr opts.dataAttr.transposeKey
			.attr opts.dataAttr.originalKey, @key
		return this

	Chords::replace = (text) ->
		$element = $(@element)
		opts = @options
		@init $element.attr(opts.dataAttr.originalKey), text

	Chords::position = () ->
		$element = $(@element)
		opts = @options
		
		lastChordRight = 0
		lastChordTop = 0
		
		# Prepare gap
		$lastGapPos = null
		lastGapDash = false

		$element.find '.' + opts.classes.gap
			.remove()

		$element.find '.' + opts.classes.lyrics + ', .' + opts.classes.chord
			.each (i, phrase) ->
				$phrase = $(phrase)
				if ($phrase.hasClass(opts.classes.chord))
					offs = $phrase.offset()
					if offs.top is lastChordTop and offs.left < lastChordRight
						# expand gap
						$gap = makeElement('gap', opts)
						if lastGapDash
							# check next lyrics
							nextLyrics = $phrase.parent().next()
							if nextLyrics.hasClass(opts.classes.lyrics) and nextLyrics.text().slice(0, 1) isnt ' '
								$gap.addClass(opts.classes.gapDash)
						$lastGapPos = $phrase.parent().prev()  unless $lastGapPos?
						$lastGapPos.after($gap)
						$gap.width(lastChordRight - offs.left)
						offs = $phrase.offset()

					lastChordTop = offs.top
					lastChordRight = offs.left + $phrase.outerWidth() + chordMargin
					$lastGapPos = null
				else
					lyrics = $phrase.text()
					if not $lastGapPos? or lyrics.slice(-1) is " "
						lastGapDash = (lyrics.slice(-1) isnt " ")
						$lastGapPos = $phrase

		return this

	Chords::init = (key, text) ->
		$element = $(@element)
		opts = @options
		
		key = keyNumber(key)
		@key = key
		@originalKey = key
		
		$element.html("").removeClass opts.classes.raw

		$section = makeElement('section', opts)
			.appendTo $element

		$paragraph = makeElement('paragraph', opts)
			.appendTo $section

		$.each text.trim().split("\n"), (i, lineText) ->
			lineText = lineText.trim()

			matches = lineText.match(opts.sectionRegEx)
			if matches				
				# Make a new section (unless the current section is empty)
				$section = makeElement('section', opts)
					.appendTo($element)  unless $section.text() is ""
				$paragraph = makeElement('paragraph', opts) unless $paragraph.text() is ""
				$paragraph.appendTo($section)
				$section.attr opts.dataAttr.sectionType, matches[1]
				unless matches[2] is ""
					$section.attr opts.dataAttr.sectionNum, matches[2]
				else
					$section.removeAttr opts.dataAttr.sectionNum
				return # Done. section header

			# Add a new line to the section
			if lineText is ""
				$paragraph = makeElement('paragraph', opts)
					.appendTo($section)
				return # Done. Empty line

			$line = makeElement('line', opts)
				.appendTo $paragraph

			# Split each word by space
			# but not the spaces within [chord brackets] <- that's why the RegEx is so ugly
			$.each lineText.match(/\s*([^\[\]\s]+|\[[^\]]*\])+\s*/g), (j, wordText) ->
				$word = $(opts.elements.word)
					.addClass opts.classes.word
					.appendTo $line

				# Replace chord texts with chord elements
				wordText = wordText.replace /\[([^\]]*)\]/g, (match, chordText) ->
					$result = $("<div>")
					$chordAnchor = $(opts.elements.chordAnchor)
						.addClass opts.classes.chordAnchor
						.html makeChordElement(chordText, key, opts)
						.appendTo $result
					$result.html()

				$textNodes = $word.html(wordText)
					.contents()
					.filter () -> @nodeType is 3

				if $textNodes.length > 0
					$textNodes.wrap $(opts.elements.lyrics).addClass(opts.classes.lyrics)
				else
					# add space to force the layout
					$word.append ' '

		$element.find '.' + opts.classes.paragraph
			.each (i, p) ->
				$p = $(p)
				$chords = $p.find '.' + opts.classes.chord
				$p.addClass(opts.classes.noChords)  if $chords.length is 0
		
		@position()

	Chords::transpose = (key) ->
		$element = $(@element)
		opts = @options
		key = keyNumber(key)
		@key = key

		chordKeys = if key in [0, 5, 10, 3, 8, 1] then flatKeys else sharpKeys
		chordKeys = (replaceFlatSharp(k, opts.chars) for k in chordKeys)

		$element.find("[" + opts.dataAttr.chord + "]").removeAttr opts.dataAttr.chord
		$element.find("[" + opts.dataAttr.chordRel + "]").each (i, chordTag) ->
			$chordTag = $(chordTag)
			chordRel = +$chordTag.attr(opts.dataAttr.chordRel)
			chord = (chordRel + key) % 12
			$chordTag.text chordKeys[chord]
			$chordRoot = $chordTag.parent()
			$chordRoot.attr opts.dataAttr.chord, chord  unless $chordRoot.attr(opts.dataAttr.chord)?

		return this

	$.fn.chordsify = (options, param) ->
		if typeof (options) is "string"
			if options is "text"
				result = ""
				@each (i, e) ->
					result += $(e).data("chordsify").text()
					return
				return result

			return @each((i, e) ->
				chords = $(e).data("chordsify")
				switch options
					when "option"
						chords.option param
					when "position"
						chords.position()
					when "replace"
						chords.replace param
					when "destroy"
						chords.destroy()
					when "transpose"
						chords.transpose param
			)

		return this  if @data("chordsify")

		opts = $.extend(true, {}, $.fn.chordsify.defaults, options)
		@each (i, e) ->
			$(e).data "chordsify", new Chords(e, opts)

	$.fn.chordsify.defaults =
		# section only supports "intro", "verse", "prechorus", "chorus", "bridge", "tag", "outro"
		sectionRegEx: /^\[\s*(intro|verse|prechorus|chorus|bridge|tag|outro)\s*(\d*)\s*\]$/i

		chars:
			flat:  "♭"
			sharp: "♯"

		classes:
			section:      "chordsify-section"
			chord:        "chordsify-chord"
			chordAnchor:  "chordsify-chord-anchor"
			chordRoot:    "chordsify-chord-root"
			gap:          "chordsify-gap"
			gapDash:      "chordsify-gap-dash"
			line:         "chordsify-line"
			lyrics:       "chordsify-lyrics"
			noChords:     "chordsify-no-chords"
			paragraph:    "chordsify-paragraph"
			word:         "chordsify-word"
			raw:          "chordsify-raw"

		dataAttr:
			sectionType:  "data-section-type"
			sectionNum:   "data-section-num"
			chord:        "data-chord"
			chordRel:     "data-chord-rel"
			originalKey:  "data-original-key"
			transposeKey: "data-transpose-to"

		elements:
			section:      "<div>"
			chord:        "<sup>"
			chordAnchor:  "<span>"
			chordRoot:    "<span>"
			gap:          "<span>"
			line:         "<div>"
			lyrics:       "<span>"
			paragraph:    "<div>"
			word:         "<span>"

	return
) jQuery