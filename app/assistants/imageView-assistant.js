function ImageViewAssistant() {}

ImageViewAssistant.prototype.setup = function () {
    var attributes = {
        //noExtractFS : true //optional, turn off using extractfs to speed up renders.
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
    this.handleButtonPress = this.handleButtonPress.bind(this);
    this.handleButton2Press = this.handleButton2Press.bind(this);
    Mojo.Event.listen(this.controller.get('myPhotoDiv'),Mojo.Event.imageViewChanged,this.imageViewChanged);
    Mojo.Event.listen(this.controller.get('push_button'),Mojo.Event.tap, this.handleButtonPress);
    Mojo.Event.listen(this.controller.get('push_button2'),Mojo.Event.tap, this.handleButton2Press);
}

ImageViewAssistant.prototype.getImageUrls = function () {
    // currently using Imgur API version 1 - TODO this should use version 2 instead
    Mojo.Log.info("starting getImageUrls");
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
/*
        images = [
            "http:\/\/imgur.com\/A5Zuis.gif",
            "http:\/\/imgur.com\/11r7js.jpg",
            "http:\/\/imgur.com\/65APrs.jpg"
        ];
*/
}

ImageViewAssistant.prototype.parseResult = function (transport) {
    Mojo.Log.info("starting parseResult");
    var image_list = [],
        json,
        data = transport.responseText;

    try {
        json = data.evalJSON();
    } catch (e) {
        Mojo.Log.error(e);
    }
    if (json.images) {
        for (var attr in this.myPhotoDivElement) {
            //Mojo.Log.info(attr);
        }
        for (var img in json.images) {
            image_list.push(img);
            //Mojo.Log.info(this.myPhotoDivElement.mojo); //.model.images.push(img);
        }
    } else {
        Mojo.Log.info("json object has no images");
    }
    this.image_model.images = image_list;
    this.controller.modelChanged(this.image_model, this);
}

ImageViewAssistant.prototype.handleButtonPress = function (event) {
    this.myPhotoDivElement.mojo.leftUrlProvided('http:\/\/imgur.com\/A5Zui.gif','http:\/\/imgur.com\/A5Zuis.gif');
    this.myPhotoDivElement.mojo.centerUrlProvided('http:\/\/imgur.com\/11r7j.jpg','http:\/\/imgur.com\/11r7js.jpg');
    this.myPhotoDivElement.mojo.rightUrlProvided('http:\/\/imgur.com\/65APr.jpg','http:\/\/imgur.com\/65APrs.jpg');
    /* 
     * You can manually set the width and height of the image
     * space as below or you can let the widget pick the size
     * itself.
     * Uncomment the below to see what it does.
     */
    //this.myPhotoDivElement.mojo.manualSize('300','100');
}

ImageViewAssistant.prototype.handleButton2Press = function (event) {
    result = this.myPhotoDivElement.mojo.getCurrentParams();
    this.showDialogBox("Current Params", "SourceImage="+result.sourceImage+
    "  (See code for this button for other available parameters.)");
    /*
     * Besides sourceImage, other result attributes are:
     * focusX
     * focusY
     * scale
     * sourceWidth
     * sourceHeight
     */
}

ImageViewAssistant.prototype.imageViewChanged = function (event) {
    /* Do something when the image view changes */
    //this.showDialogBox("Image View Changed", "Flick image left and/or right to see other images.");
}

ImageViewAssistant.prototype.wentLeft = function (event) {
    /* Do something when the user flicks to the right 
     * like picking a different image for the left image.
     */
    //this.showDialogBox("Image View Changed", "Flicked right to see left picture.");
}

ImageViewAssistant.prototype.wentRight = function (event) {
    /* Do something when the user flicks to the left 
     * like picking a different image for the right image.
     */
    //this.showDialogBox("Image View Changed", "Flicked left to see right picture.");
}

ImageViewAssistant.prototype.activate = function () {
    /* You can show an image on startup from here if you want */
    //this.myPhotoDivElement.mojo.centerUrlProvided('images/pre_01.png','images/edit.png');
}

/*
* Cleanup anything we did in the activate function
*/
ImageViewAssistant.prototype.deactivate = function () { }

/*
 * Cleanup anything we did in setup function
 */
ImageViewAssistant.prototype.cleanup = function (){
    Mojo.Event.stopListening(this.controller.get('myPhotoDiv'),Mojo.Event.imageViewChanged,this.imageViewChanged);
    Mojo.Event.stopListening(this.controller.get('push_button'),Mojo.Event.tap, this.handleButtonPress);
    Mojo.Event.stopListening(this.controller.get('push_button2'),Mojo.Event.tap, this.handleButton2Press);
}

// This function will popup a dialog, displaying the message passed in.
ImageViewAssistant.prototype.showDialogBox = function (title,message) {
    this.controller.showAlertDialog({
        onChoose: function (value) {},
        title:title,
        message:message,
        choices:[ {label:'OK', value:'OK', type:'color'} ]
    });
}
