function ImageViewAssistant() {}

ImageViewAssistant.prototype.setup = function () {
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
    this.controller.stageController.setWindowOrientation('free');

    // TODO implement show spinner while retrieving image JSON
    this.controller.setupWidget("spinnerId",
        this.attributes = { spinnerSize: "large" },
        this.model = { spinning: false }
    );

    this.imageViewChanged = this.imageViewChanged.bindAsEventListener(this);
    Mojo.Event.listen(this.controller.get('imgurView'), Mojo.Event.imageViewChanged, this.imageViewChanged);
}

ImageViewAssistant.prototype.getImageUrls = function () {
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

ImageViewAssistant.prototype.parseResult = function (transport) {
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
ImageViewAssistant.prototype.imageViewChanged = function (event) {
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

// A flick to the right triggers a scroll to the left
ImageViewAssistant.prototype.wentLeft = function (event) {
    if (this.image_model.current_index >= 1) {
        this.image_model.current_index -= 1;
        this.controller.modelChanged(this.image_model, this);
    }
}

// A flick to the left triggers a scroll to the right
ImageViewAssistant.prototype.wentRight = function (event) {
    if (this.image_model.current_index < this.image_model.images.length - 1) {
        this.image_model.current_index += 1;
        this.controller.modelChanged(this.image_model, this);
    }
}

// You can show an image on startup from here if you want
ImageViewAssistant.prototype.activate = function () {}

// Cleanup anything we did in the activate function
ImageViewAssistant.prototype.deactivate = function () {}

// Cleanup anything we did in setup function
ImageViewAssistant.prototype.cleanup = function () {
    Mojo.Event.stopListening(this.controller.get('imgurView'), Mojo.Event.imageViewChanged, this.imageViewChanged);
}

// This function will popup a dialog, displaying the message passed in.
ImageViewAssistant.prototype.showDialogBox = function (title, message) {
    this.controller.showAlertDialog({
        onChoose: function (value) {},
        title: title,
        message: message,
        choices: [ {label:'OK', value:'OK', type:'color'} ]
    });
}
