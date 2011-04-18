class GalleryViewAssistant

  setup: ->
    Mojo.Log.info("starting setup")
    attributes =
        noExtractFS: true
    @image_model =
        onLeftFunction: @wentLeft
        onRightFunction: @wentRight
        images: []
        current_index: 0
    Mojo.Log.info("calling getImageUrls")
    @getImageUrls()
    Mojo.Log.info("setting up imgurView widget")
    @controller.setupWidget('imgurView', attributes, @image_model)
    Mojo.Log.info("set up imgurView widget")
    @imgurViewElement = $('imgurView')
    width = Mojo.Environment.DeviceInfo.screenWidth
    height = Mojo.Environment.DeviceInfo.screenHeight
    $("imgurView").setStyle("width: #{width}px; height: #{height}px;")

    # TODO reset width/height of image view on orientation change
    # see https://github.com/cw/webos-imgur-viewer/issues#issue/1
    @controller.stageController.setWindowOrientation('free')

    # TODO implement show spinner while retrieving image JSON
    spinner_attributes =
      spinnerSize: "large"
    spinner_model =
      spinning: false
    @controller.setupWidget("spinnerId", spinner_attributes, spinner_model)

    @imageViewChangedHandler = @imageViewChanged.bindAsEventListener(this)
    @orientationChangeHandler = @orientationChanged.bindAsEventListener(this)
    Mojo.Event.listen(@controller.get('imgurView'), Mojo.Event.imageViewChanged, @imageViewChangedHandler)
    @showImageMenuHandler = @showImageMenu.bindAsEventListener(this)
    Mojo.Event.listen(@controller.get('imgurView'), Mojo.Event.tap, @showImageMenuHandler)

  getImageUrls: ->
    # TODO allow various sorting/filtering options, cache results
    sort = "latest" # latest, popular
    view = "all" # week, month, all
    count = 50 # integer between 0 and 50
    page = 1 # integer above 0
    url = "http://api.imgur.com/2/gallery.json?sort=" + sort + 
          "&view=" + view + "&page=" + page + "&count=" + count
    # TODO implement OAuth
    Mojo.Log.info("calling get image gallery request")
    request = new Ajax.Request(url, {
        method: 'get'
        asynchronous: true
        evalJSON: "false"
        onSuccess: @parseResult.bind(this)
        on0: (ajaxResponse) ->
          Mojo.Log.error("Connection failed")
        onFailure: (response) ->
          Mojo.Log.error("Request failed")
        onException: (request, ex) ->
          Mojo.Log.error("Exception")
    })

  parseResult: (transport) ->
    image_list = []
    data = transport.responseText
    try
        json = data.evalJSON()
    catch error
        Mojo.Log.error(error)
    if json.images
        image_list.push(img) for img in json.images
        @image_model.images = image_list
        @controller.modelChanged(@image_model, this)
        @imgurViewElement.mojo.centerUrlProvided(@image_model.images[0].original_image)
    else
        Mojo.Log.info("json object has no images")

  # Do something when the image view changes
  imageViewChanged: (event) ->
      Mojo.Log.info("Current image index: " + @image_model.current_index)
      idx = @image_model.current_index
      # Now looking at the first image
      if idx is 0
          @imgurViewElement.mojo.leftUrlProvided("")
          @imgurViewElement.mojo.centerUrlProvided(@image_model.images[idx].original_image)
          @imgurViewElement.mojo.rightUrlProvided(@image_model.images[idx + 1].original_image)
      # Now looking at image between first and last
      else if idx > 0 and idx < @image_model.images.length
          @imgurViewElement.mojo.leftUrlProvided(@image_model.images[idx - 1].original_image)
          @imgurViewElement.mojo.centerUrlProvided(@image_model.images[idx].original_image)
          @imgurViewElement.mojo.rightUrlProvided(@image_model.images[idx + 1].original_image)
      # Now looking at the last image
      else if idx is @image_model.images.length - 1
          @imgurViewElement.mojo.leftUrlProvided(@image_model.images[idx - 1].original_image)
          @imgurViewElement.mojo.centerUrlProvided(@image_model.images[idx].original_image)
          @imgurViewElement.mojo.rightUrlProvided("")
      $("main-hdr").innerHTML = @image_model.images[idx].message

  # Handle orientation changes
  orientationChanged: (event) ->
    width = Mojo.Environment.DeviceInfo.screenWidth
    height = Mojo.Environment.DeviceInfo.screenHeight
    orientation = @controller.stageController.getWindowOrientation()
    Mojo.Log.info("screen dims: #{width}, #{height}")
    Mojo.Log.info("orientation: #{orientation}")
    Mojo.Log.info("style width before: #{$('imgurView').style.width}")
    switch orientation
        when "left", "right"
            $("imgurView").setStyle("width: #{width}px; height: #{height}px;")
        when "up", "down"
            $("imgurView").setStyle("width: #{height}px; height: #{width}px;")
    Mojo.Log.info("style width after: " + $("imgurView").style.width)

  # Handle image taps
  showImageMenu: (event) ->
    @popupIndex = event.index
    @controller.popupSubmenu(
      onChoose: @popupHandler
      items: [
        {label: 'View on Imgur', command: 'view-site'}
        {label: 'View comments', command: 'view-comments'}
        {label: 'Share', command: 'share-image'}
      ]
    )

  # TODO Do something with the incoming command 
  popupHandler: (command) ->

  # A flick to the right triggers a scroll to the left
  wentLeft: (event) =>
    if @image_model.current_index >= 1
        @image_model.current_index -= 1
        @controller.modelChanged(@image_model, this)

  # A flick to the left triggers a scroll to the right
  wentRight: (event) =>
    if @image_model.current_index < @image_model.images.length - 1
        @image_model.current_index += 1
        @controller.modelChanged(@image_model, this)

  # Start listening to orientation changes
  activate: ->
    @controller.listen(@controller.stageController.document, Mojo.Event.orientationChange, @orientationChangeHandler)

  # Stop listening to orientation changes
  deactivate: ->
    @controller.stopListening(@controller.stageController.document, Mojo.Event.orientationChange, @orientationChangeHandler)

  # Cleanup anything we did in setup function
  cleanup: ->
    Mojo.Event.stopListening(@controller.get('imgurView'), Mojo.Event.imageViewChanged, @imageViewChangedHandler)
    Mojo.Event.stopListening(@controller.get('imgurView'), Mojo.Event.tap, @showImageMenuHandler)

  # This function will popup a dialog, displaying the message passed in
  showDialogBox: (title, message) ->
    @controller.showAlertDialog(
        onChoose: (value) ->
        title: title
        message: message
        choices: [ {label:'OK', value:'OK', type:'color'} ]
    )
