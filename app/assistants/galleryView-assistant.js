var GalleryViewAssistant;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
GalleryViewAssistant = (function() {
  function GalleryViewAssistant() {
    this.wentRight = __bind(this.wentRight, this);;
    this.wentLeft = __bind(this.wentLeft, this);;
  }
  GalleryViewAssistant.prototype.setup = function() {
    var attributes, height, spinner_attributes, spinner_model, width;
    Mojo.Log.info("starting setup");
    attributes = {
      noExtractFS: true
    };
    this.image_model = {
      onLeftFunction: this.wentLeft,
      onRightFunction: this.wentRight,
      images: [],
      current_index: 0
    };
    Mojo.Log.info("calling getImageUrls");
    this.getImageUrls();
    Mojo.Log.info("setting up imgurView widget");
    this.controller.setupWidget('imgurView', attributes, this.image_model);
    Mojo.Log.info("set up imgurView widget");
    this.imgurViewElement = $('imgurView');
    width = Mojo.Environment.DeviceInfo.screenWidth;
    height = Mojo.Environment.DeviceInfo.screenHeight;
    $("imgurView").setStyle("width: " + width + "px; height: " + height + "px;");
    this.controller.stageController.setWindowOrientation('free');
    spinner_attributes = {
      spinnerSize: "large"
    };
    spinner_model = {
      spinning: false
    };
    this.controller.setupWidget("spinnerId", spinner_attributes, spinner_model);
    this.imageViewChangedHandler = this.imageViewChanged.bindAsEventListener(this);
    this.orientationChangeHandler = this.orientationChanged.bindAsEventListener(this);
    Mojo.Event.listen(this.controller.get('imgurView'), Mojo.Event.imageViewChanged, this.imageViewChangedHandler);
    this.showImageMenuHandler = this.showImageMenu.bindAsEventListener(this);
    return Mojo.Event.listen(this.controller.get('imgurView'), Mojo.Event.tap, this.showImageMenuHandler);
  };
  GalleryViewAssistant.prototype.getImageUrls = function() {
    var count, page, request, sort, url, view;
    sort = "latest";
    view = "all";
    count = 50;
    page = 1;
    url = "http://api.imgur.com/2/gallery.json?sort=" + sort + "&view=" + view + "&page=" + page + "&count=" + count;
    Mojo.Log.info("calling get image gallery request");
    return request = new Ajax.Request(url, {
      method: 'get',
      asynchronous: true,
      evalJSON: "false",
      onSuccess: this.parseResult.bind(this),
      on0: function(ajaxResponse) {
        return Mojo.Log.error("Connection failed");
      },
      onFailure: function(response) {
        return Mojo.Log.error("Request failed");
      },
      onException: function(request, ex) {
        return Mojo.Log.error("Exception");
      }
    });
  };
  GalleryViewAssistant.prototype.parseResult = function(transport) {
    var data, image_list, img, json, _i, _len, _ref;
    image_list = [];
    data = transport.responseText;
    try {
      json = data.evalJSON();
    } catch (error) {
      Mojo.Log.error(error);
    }
    if (json.images) {
      _ref = json.images;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        img = _ref[_i];
        image_list.push(img);
      }
      this.image_model.images = image_list;
      this.controller.modelChanged(this.image_model, this);
      return this.imgurViewElement.mojo.centerUrlProvided(this.image_model.images[0].original_image);
    } else {
      return Mojo.Log.info("json object has no images");
    }
  };
  GalleryViewAssistant.prototype.imageViewChanged = function(event) {
    var idx;
    Mojo.Log.info("Current image index: " + this.image_model.current_index);
    idx = this.image_model.current_index;
    if (idx === 0) {
      this.imgurViewElement.mojo.leftUrlProvided("");
      this.imgurViewElement.mojo.centerUrlProvided(this.image_model.images[idx].original_image);
      this.imgurViewElement.mojo.rightUrlProvided(this.image_model.images[idx + 1].original_image);
    } else if (idx > 0 && idx < this.image_model.images.length) {
      this.imgurViewElement.mojo.leftUrlProvided(this.image_model.images[idx - 1].original_image);
      this.imgurViewElement.mojo.centerUrlProvided(this.image_model.images[idx].original_image);
      this.imgurViewElement.mojo.rightUrlProvided(this.image_model.images[idx + 1].original_image);
    } else if (idx === this.image_model.images.length - 1) {
      this.imgurViewElement.mojo.leftUrlProvided(this.image_model.images[idx - 1].original_image);
      this.imgurViewElement.mojo.centerUrlProvided(this.image_model.images[idx].original_image);
      this.imgurViewElement.mojo.rightUrlProvided("");
    }
    return $("main-hdr").innerHTML = this.image_model.images[idx].message;
  };
  GalleryViewAssistant.prototype.orientationChanged = function(event) {
    var height, orientation, width;
    width = Mojo.Environment.DeviceInfo.screenWidth;
    height = Mojo.Environment.DeviceInfo.screenHeight;
    orientation = this.controller.stageController.getWindowOrientation();
    Mojo.Log.info("screen dims: " + width + ", " + height);
    Mojo.Log.info("orientation: " + orientation);
    Mojo.Log.info("style width before: " + ($('imgurView').style.width));
    switch (orientation) {
      case "left":
      case "right":
        $("imgurView").setStyle("width: " + width + "px; height: " + height + "px;");
        break;
      case "up":
      case "down":
        $("imgurView").setStyle("width: " + height + "px; height: " + width + "px;");
    }
    return Mojo.Log.info("style width after: " + $("imgurView").style.width);
  };
  GalleryViewAssistant.prototype.showImageMenu = function(event) {
    this.popupIndex = event.index;
    return this.controller.popupSubmenu({
      onChoose: this.popupHandler,
      items: [
        {
          label: 'View on Imgur',
          command: 'view-site'
        }, {
          label: 'View comments',
          command: 'view-comments'
        }, {
          label: 'Share',
          command: 'share-image'
        }
      ]
    });
  };
  GalleryViewAssistant.prototype.popupHandler = function(command) {};
  GalleryViewAssistant.prototype.wentLeft = function(event) {
    if (this.image_model.current_index >= 1) {
      this.image_model.current_index -= 1;
      return this.controller.modelChanged(this.image_model, this);
    }
  };
  GalleryViewAssistant.prototype.wentRight = function(event) {
    if (this.image_model.current_index < this.image_model.images.length - 1) {
      this.image_model.current_index += 1;
      return this.controller.modelChanged(this.image_model, this);
    }
  };
  GalleryViewAssistant.prototype.activate = function() {
    return this.controller.listen(this.controller.stageController.document, Mojo.Event.orientationChange, this.orientationChangeHandler);
  };
  GalleryViewAssistant.prototype.deactivate = function() {
    return this.controller.stopListening(this.controller.stageController.document, Mojo.Event.orientationChange, this.orientationChangeHandler);
  };
  GalleryViewAssistant.prototype.cleanup = function() {
    Mojo.Event.stopListening(this.controller.get('imgurView'), Mojo.Event.imageViewChanged, this.imageViewChangedHandler);
    return Mojo.Event.stopListening(this.controller.get('imgurView'), Mojo.Event.tap, this.showImageMenuHandler);
  };
  GalleryViewAssistant.prototype.showDialogBox = function(title, message) {
    return this.controller.showAlertDialog({
      onChoose: function(value) {},
      title: title,
      message: message,
      choices: [
        {
          label: 'OK',
          value: 'OK',
          type: 'color'
        }
      ]
    });
  };
  return GalleryViewAssistant;
})();