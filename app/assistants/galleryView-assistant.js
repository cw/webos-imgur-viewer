function GalleryViewAssistant() {}

GalleryViewAssistant.prototype.setup = function () {
    var attributes = {
        noExtractFS: true //optional, turn off using extractfs to speed up renders.
    };
    this.image_model = {
        onLeftFunction : this.wentLeft.bind(this),
        onRightFunction : this.wentRight.bind(this),
        images: [],
        current_index: 0
    }
    this.getImageUrls();
    this.controller.setupWidget('imgurView', attributes, this.image_model);
    this.imgurViewElement = $('imgurView');

    // TODO reset width/height of image view on orientation change
    // see https://github.com/cw/webos-imgur-viewer/issues#issue/1
    this.controller.stageController.setWindowOrientation('free');

    // TODO implement show spinner while retrieving image JSON
    this.controller.setupWidget("spinnerId",
        this.attributes = { spinnerSize: "large" },
        this.model = { spinning: false }
    );

    this.categoryMenuModel = { label: $L('Category'), items: [{label: $L('All'), command:'cat-all', shortcut:'l'},
        {label: $L('Business'), command:'cat-business' },
        {label: $L('Personal'), command:'cat-personal', shortcut:'p'},
        {label: $L('Unfiled'), command:'cat-unfiled', shortcut:'u'}
    ]};
    this.controller.setupWidget('category-menu', undefined, this.categoryMenuModel);

    this.imageViewChangedHandler = this.imageViewChanged.bindAsEventListener(this);
    this.orientationChangeHandler = this.orientationChanged.bindAsEventListener(this);
    Mojo.Event.listen(this.controller.get('imgurView'), Mojo.Event.imageViewChanged, this.imageViewChangedHandler);
}

GalleryViewAssistant.prototype.getImageUrls = function () {
    // TODO allow various sorting/filtering options, cache results
    var sort = "latest", // latest, popular
        view = "all", // week, month, all
        count = 50, // integer between 0 and 50
        page = 1, // integer above 0
        url = "http://api.imgur.com/2/gallery.json?sort=" + sort + 
              "&view=" + view + "&page=" + page + "&count=" + count,
        // TODO implement OAuth
        request = new Ajax.Request(url, {
            method: 'get',
            asynchronous: true,
            evalJSON: "false",
            onSuccess: this.parseResult.bind(this),
            on0: function (ajaxResponse) { Mojo.Log.error("Connection failed"); },
            onFailure: function (response) { Mojo.Log.error("Request failed"); },
            onException: function (request, ex) { Mojo.Log.error("Exception"); },
        });
}

GalleryViewAssistant.prototype.parseResult = function (transport) {
    var image_list = [],
        json,
        data = transport.responseText;
    try {
        json = data.evalJSON();
    } catch (e) {
        Mojo.Log.error(e);
    }
    if (json.images) {
        for (var img in json.images) { image_list.push(json.images[img]); }
        this.image_model.images = image_list;
        this.controller.modelChanged(this.image_model, this);
        this.imgurViewElement.mojo.centerUrlProvided(this.image_model.images[0].large_thumbnail);
    } else {
        Mojo.Log.info("json object has no images");
    }
}

// Do something when the image view changes
GalleryViewAssistant.prototype.imageViewChanged = function (event) {
    Mojo.Log.info("Current image index: " + this.image_model.current_index);
    var idx = this.image_model.current_index;
    if (idx === 0) {
        this.imgurViewElement.mojo.leftUrlProvided("");
        this.imgurViewElement.mojo.centerUrlProvided(this.image_model.images[idx].large_thumbnail);
        this.imgurViewElement.mojo.rightUrlProvided(this.image_model.images[idx + 1].large_thumbnail);
    } else if (idx > 0 && idx < this.image_model.images.length) {
        this.imgurViewElement.mojo.leftUrlProvided(this.image_model.images[idx - 1].large_thumbnail);
        this.imgurViewElement.mojo.centerUrlProvided(this.image_model.images[idx].large_thumbnail);
        this.imgurViewElement.mojo.rightUrlProvided(this.image_model.images[idx + 1].large_thumbnail);
    } else if (idx === this.image_model.images.length - 1) {
        this.imgurViewElement.mojo.leftUrlProvided(this.image_model.images[idx - 1].large_thumbnail);
        this.imgurViewElement.mojo.centerUrlProvided(this.image_model.images[idx].large_thumbnail);
        this.imgurViewElement.mojo.rightUrlProvided("");
    }
    $("main-hdr").innerHTML = this.image_model.images[idx].message;
}

// Handle orientation changes
GalleryViewAssistant.prototype.orientationChanged = function (event) {
    //Mojo.Log.info("Resize imgurView width/height to match screen dimensions");
    var width = Mojo.Environment.DeviceInfo.screenWidth,
        height = Mojo.Environment.DeviceInfo.screenHeight,
        orientation = this.controller.stageController.getWindowOrientation();
    Mojo.Log.info("screen dims: " + width + ", " + height);
    Mojo.Log.info("orientation: " + orientation);
    Mojo.Log.info("style width before: " + $("imgurView").style.width);
    switch (orientation) {
        case "left": case "right":
            $("imgurView").setStyle("width: 480px; height: 320px;"); break;
        case "up": case "down":
            $("imgurView").setStyle("width: 320px; height: 480px;"); break;
    }
    Mojo.Log.info("style width after: " + $("imgurView").style.width);
    //$("#imgurView").
}

// A flick to the right triggers a scroll to the left
GalleryViewAssistant.prototype.wentLeft = function (event) {
    if (this.image_model.current_index >= 1) {
        this.image_model.current_index -= 1;
        this.controller.modelChanged(this.image_model, this);
    }
}

// A flick to the left triggers a scroll to the right
GalleryViewAssistant.prototype.wentRight = function (event) {
    if (this.image_model.current_index < this.image_model.images.length - 1) {
        this.image_model.current_index += 1;
        this.controller.modelChanged(this.image_model, this);
    }
}

// Start listening to orientation changes
GalleryViewAssistant.prototype.activate = function () {
    this.controller.listen(this.controller.stageController.document, Mojo.Event.orientationChange, this.orientationChangeHandler);
}

// Stop listening to orientation changes
GalleryViewAssistant.prototype.deactivate = function () {
    this.controller.stopListening(this.controller.stageController.document, Mojo.Event.orientationChange, this.orientationChangeHandler);
}

// Cleanup anything we did in setup function
GalleryViewAssistant.prototype.cleanup = function () {
    Mojo.Event.stopListening(this.controller.get('imgurView'), Mojo.Event.imageViewChanged, this.imageViewChangedHandler);
}

// This function will popup a dialog, displaying the message passed in.
GalleryViewAssistant.prototype.showDialogBox = function (title, message) {
    this.controller.showAlertDialog({
        onChoose: function (value) {},
        title: title,
        message: message,
        choices: [ {label:'OK', value:'OK', type:'color'} ]
    });
}
