function ImageViewAssistant() {}

ImageViewAssistant.prototype.setup = function () {
    var attributes = {
        noExtractFS: true //optional, turn off using extractfs to speed up renders.
    };
    this.image_model = {
        //backgroundImage : 'images/glacier.png',
        //background: 'black', //You can set an image or a color
        onLeftFunction : this.wentLeft.bind(this),
        onRightFunction : this.wentRight.bind(this),
        images: [],
        current_index: 0
    }
    this.getImageUrls();
    this.controller.setupWidget('myPhotoDiv', attributes, this.image_model);
    this.myPhotoDivElement = $('myPhotoDiv');

    // TODO implement show spinner while retrieving image JSON
    this.controller.setupWidget("spinnerId",
        this.attributes = { spinnerSize: "large" },
        this.model = { spinning: false }
    );

    this.imageViewChanged = this.imageViewChanged.bindAsEventListener(this);
    this.handleButtonPress = this.handleButtonPress.bind(this);
    Mojo.Event.listen(this.controller.get('myPhotoDiv'), Mojo.Event.imageViewChanged, this.imageViewChanged);
    Mojo.Event.listen(this.controller.get('push_button'), Mojo.Event.tap, this.handleButtonPress);
}

ImageViewAssistant.prototype.getImageUrls = function () {
    // currently using Imgur API version 1 - TODO this should use version 2 instead
    var url = "http://imgur.com/api/gallery.json",
        request = new Ajax.Request(url, {
            method: 'get',
            asynchronous: true,
            evalJSON: "false",
            onSuccess: this.parseResult.bind(this),
            on0: function (ajaxResponse) {
                // connection failed, typically because the server is overloaded or has gone down since the page loaded
                Mojo.Log.error("Connection failed");
            },
            onFailure: function (response) {
                // Request failed (404, that sort of thing)
                Mojo.Log.error("Request failed");
            },
            onException: function (request, ex) {
                // An exception was thrown
                Mojo.Log.error("Exception");
            },
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
        for (var img in json.images) {
            image_list.push(json.images[img]);
        }
    } else {
        Mojo.Log.info("json object has no images");
    }
    this.image_model.images = image_list;
    this.controller.modelChanged(this.image_model, this);
    this.myPhotoDivElement.mojo.centerUrlProvided(this.image_model.images[0].small_thumbnail);
}

ImageViewAssistant.prototype.handleButtonPress = function (event) {
    /* 
     * You can manually set the width and height of the image
     * space as below or you can let the widget pick the size
     * itself.
     * Uncomment the below to see what it does.
     */
    //this.myPhotoDivElement.mojo.manualSize('300','100');
}

// Do something when the image view changes
ImageViewAssistant.prototype.imageViewChanged = function (event) {
    Mojo.Log.info("Current image index: " + this.image_model.current_index);
    var idx = this.image_model.current_index;
    if (idx === 0) {
        this.myPhotoDivElement.mojo.leftUrlProvided("");
        this.myPhotoDivElement.mojo.centerUrlProvided(this.image_model.images[idx].small_thumbnail);
        this.myPhotoDivElement.mojo.rightUrlProvided(this.image_model.images[idx + 1].small_thumbnail);
    } else if (idx > 0 && idx < this.image_model.images.length) {
        this.myPhotoDivElement.mojo.leftUrlProvided(this.image_model.images[idx - 1].small_thumbnail);
        this.myPhotoDivElement.mojo.centerUrlProvided(this.image_model.images[idx].small_thumbnail);
        this.myPhotoDivElement.mojo.rightUrlProvided(this.image_model.images[idx + 1].small_thumbnail);
    } else if (idx === this.image_model.images.length - 1) {
        this.myPhotoDivElement.mojo.leftUrlProvided(this.image_model.images[idx - 1].small_thumbnail);
        this.myPhotoDivElement.mojo.centerUrlProvided(this.image_model.images[idx].small_thumbnail);
        this.myPhotoDivElement.mojo.rightUrlProvided("");
    }
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
    Mojo.Event.stopListening(this.controller.get('myPhotoDiv'),Mojo.Event.imageViewChanged,this.imageViewChanged);
    Mojo.Event.stopListening(this.controller.get('push_button'),Mojo.Event.tap, this.handleButtonPress);
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
