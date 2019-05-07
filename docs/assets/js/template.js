$(function () {
  var url = location.search.replace(/\?v=\d+&/, '').replace(/\?v=VERSION&/, '')
  $.ajax({
    type: 'GET',
    url: url + '?v=VERSION', // todo: add version to solve cache problem
    dataType: 'html',
    global: false,
    cache: true, // (warning: setting it to false will cause a timestamp and will call the request twice)
    success: function (data) {
      $('#example').html(data)
      $('#source').text(_beautifySource(data))
      window.hljs.initHighlightingOnLoad()
    }
  })

  if (/js\.html$/.test(url)) {
    $('[data-nav="javascript"]').addClass('active')
  } else {
    $('[data-nav="attributes"]').addClass('active')
  }
  $('[data-nav]').click(function () {
    if ($(this).hasClass('active')) {
      return false
    }
    if (/js\.html$/.test(location.href)) {
      location.href = location.href.replace(/\.js\.html$/, '.html')
    } else {
      location.href = location.href.replace(/\.html$/, '.js.html')
    }
  })

  $('.nav-tabs').toggle(['events.html', 'methods.html'].indexOf(url) === -1)
})

window._config = {
  isDebug: location.hash.slice(1) === 'is-debug' ||
  ['localhost'].indexOf(location.hostname) > -1,
  cdnUrl: 'https://unpkg.com/bootstrap-show-password/',
  localUrl: 'http://localhost:8080/github/bootstrap-show-password/dist/'
}

function _getLink(file) {
  var url = file
  if (!/^http/.test(file)) {
    url = window._config.cdnUrl + file

    if (window._config.isDebug) {
      url = window._config.localUrl + file.replace(/\.min/, '') + '?t=' + (+new Date())
    }
  }
  return '<link href="' + url + '" rel="stylesheet">'
}

function _getScript(file, isScriptTag) {
  var url = file
  if (!/^http/.test(file)) {
    url = window._config.cdnUrl + file

    if (window._config.isDebug) {
      url = window._config.localUrl + file.replace(/\.min/, '') + '?t=' + (+new Date())
    }
  }
  if (isScriptTag) {
    return '<script src="' + url + '"></script>'
  }
  return url
}

function _link(file) {
  $('head').append(_getLink(file))
}

function _script(file, callback) {
  var head = document.getElementsByTagName('head')[0]
  var script = document.createElement('script')

  script.src = _getScript(file)

  var done = false
  // Attach handlers for all browsers
  script.onload = script.onreadystatechange = function() {
    if (!done && (!this.readyState ||
      this.readyState === 'loaded' || this.readyState === 'complete')) {
      done = true
      if (callback)
        callback()

      // Handle memory leak in IE
      script.onload = script.onreadystatechange = null
    }
  }

  head.appendChild(script)
}

function _scripts(scripts, callback) {
  var eachSeries = function (arr, iterator, callback_) {
    var callback = callback_ || function () {}
    if (!arr.length) {
      return callback()
    }
    var completed = 0
    var iterate = function () {
      iterator(arr[completed], function (err) {
        if (err) {
          callback(err)
          callback = function () {}
        } else {
          completed += 1
          if (completed >= arr.length) {
            callback(null)
          } else {
            iterate()
          }
        }
      })
    }
    iterate()
  }

  eachSeries(scripts, _script, function () {
    callback()
  })
}

function _beautifySource(data) {
  var lines = data.split('\n')
  var scriptStart = lines.indexOf('<script>')
  var scriptEnd = lines.indexOf('</script>', scriptStart)
  var strings = lines.slice(scriptStart + 1, scriptEnd)
  strings = $.map(strings, function (s) {
    return $.trim(s)
  })
  /* eslint-disable no-control-regex */
  var obj = eval('(' + strings.join('').replace(/[^\u0000-\u007E]/g, '')
    .replace(/^init\((.*)\)$/, '$1') + ')')

  var result = []
  result = result.concat($.map(obj.links, _getLink))
  result.push('')
  result = result.concat($.map(obj.scripts, function (script) {
    return _getScript(script, true)
  }))
  lines = result.concat(lines.slice(scriptEnd + 1))

  var mountedStart = lines.indexOf('  function mounted() {')
  var mountedEnd = lines.indexOf('  }', mountedStart)
  lines[mountedStart] = '  $(function() {'
  lines[mountedEnd] = '  })'

  if (lines[0] === '') {
    lines = lines.slice(1)
  }

  return lines.join('\n')
}

window.init = function (options_) {
  var options = $.extend({
    title: '',
    desc: '',
    links: [],
    scripts: [],
    bootstrapVersion: 3,
    callback: function () {
      if (typeof window.mounted === 'function') {
        window.mounted()
      }
    }
  }, options_)

  $('#header h1 span').html(options.title)
  $('#header div').html(options.desc)
  $.each(options.links, function (i, file) {
    _link(file)
  })
  _scripts(options.scripts, options.callback)
}
