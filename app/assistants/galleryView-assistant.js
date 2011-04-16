var GalleryViewAssistant;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
GalleryViewAssistant = (function() {
  function GalleryViewAssistant() {
    this.GalleryViewAssistant = __bind(this.GalleryViewAssistant, this);;
    this.GalleryViewAssistant = __bind(this.GalleryViewAssistant, this);;
  }
  GalleryViewAssistant.setup = function() {
    var attributes, spinner_attributes, spinner_model;
    attributes = {
      noExtractFS: true
    };
    this.image_model = {
      onLeftFunction: this.wentLeft,
      onRightFunction: this.wentRight,
      images: [],
      current_index: 0
    };
    this.getImageUrls();
    this.controller.setupWidget('imgurView', attributes, this.image_model);
    this.imgurViewElement = $('imgurView');
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
  GalleryViewAssistant.getImageUrls = function() {
    var count, page, request, sort, url, view;
    sort = "latest";
    view = "all";
    count = 50;
    page = 1;
    url = "http://api.imgur.com/2/gallery.json?sort=" + sort + "&view=" + view + "&page=" + page + "&count=" + count;
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
  GalleryViewAssistant.parseResult = function(transport) {
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
      return this.imgurViewElement.mojo.centerUrlProvided(this.image_model.images[0].large_thumbnail);
    } else {
      return Mojo.Log.info("json object has no images");
    }
  };
  GalleryViewAssistant.imageViewChanged = function(event) {
    var idx;
    Mojo.Log.info("Current image index: " + this.image_model.current_index);
    idx = this.image_model.current_index;
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
    return $("main-hdr").innerHTML = this.image_model.images[idx].message;
  };
  GalleryViewAssistant.orientationChanged = function(event) {
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
        $("imgurView").setStyle("width: 480px; height: 320px;");
        break;
      case "up":
      case "down":
        $("imgurView").setStyle("width: 320px; height: 480px;");
    }
    return Mojo.Log.info("style width after: " + $("imgurView").style.width);
  };
  GalleryViewAssistant.showImageMenu = function(event) {
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
  GalleryViewAssistant.popupHandler = function(command) {};
  GalleryViewAssistant.wentLeft = function(event) {
    if (this.image_model.current_index >= 1) {
      this.image_model.current_index -= 1;
      return this.controller.modelChanged(this.image_model, this);
    }
  };
  GalleryViewAssistant.wentRight = function(event) {
    if (this.image_model.current_index < this.image_model.images.length - 1) {
      this.image_model.current_index += 1;
      return this.controller.modelChanged(this.image_model, this);
    }
  };
  GalleryViewAssistant.activate = function() {
    return this.controller.listen(this.controller.stageController.document, Mojo.Event.orientationChange, this.orientationChangeHandler);
  };
  GalleryViewAssistant.deactivate = function() {
    return this.controller.stopListening(this.controller.stageController.document, Mojo.Event.orientationChange, this.orientationChangeHandler);
  };
  GalleryViewAssistant.cleanup = function() {
    Mojo.Event.stopListening(this.controller.get('imgurView'), Mojo.Event.imageViewChanged, this.imageViewChangedHandler);
    return Mojo.Event.stopListening(this.controller.get('imgurView'), Mojo.Event.tap, this.showImageMenuHandler);
  };
  GalleryViewAssistant.showDialogBox = function(title, message) {
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