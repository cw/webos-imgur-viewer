
fs              = require 'fs'
path            = require "path"
{spawn, exec}   = require "child_process"
stdout          = process.stdout

# ANSI terminal colors
bold    = "\033[0;1m"
red     = "\033[0;31m"
green   = "\033[0;32m"
reset   = "\033[0m"

# Log a message with a color
log = (message, color, explanation) ->
    console.log color + message + reset + ' ' + (explanation or '')

# Handle error and kill the process
onerror = (err) ->
    if err
        process.stdout.write "#{red}#{err.stack}#{reset}\n"
        process.exit -1


# Tasks

task 'build', "Build coffee files to javascripts", (options) ->
  log "Building coffeescript", green
  exec 'coffee --compile -b app/assistants/galleryView-assistant.coffee', (err, stdout, stderr) ->
    throw err if err

task 'package', "Package app into .ipkg in ~/packages", (options) ->
  log "Packaging app", green
  exec 'palm-package --exclude-from=.packageignore -o ~/packages .', (err, stdout, stderr) ->
    throw err if err
