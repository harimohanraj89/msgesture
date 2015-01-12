(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    WinJS.strictProcessing();

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                initialize();
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    var _width = 640;
    var _height = 640;

    var _pointerInfo;
    var _targetLog;

    var _selectedColor;
    var _colorRed, _colorGreen, _colorBlue;

    // Color-specific data object.
    //   value: The color value (r, g, or b)
    //   rotation: The rotation value used to calculate color value.
    //   matrix: The transform matrix of the target.
    function colorInfo(value, rotation, matrix) {
        this.value = value;
        this.rotation = rotation;
        this.matrix = matrix;
    }

    function initialize() {
        // Configure the target.
        setTarget();

        // Initialize color tracking.
        setColors();
    }

    // Configure the interaction target.
    function setTarget() {
        //  Set up the target position, size, and transform.
        colorMixer.style.width = _width + "px";
        colorMixer.style.height = _height + "px";
        colorMixer.style.msTransform = (new MSCSSMatrix()).
            translate((window.innerWidth - parseInt(colorMixer.style.width)) / 2.0,
            (window.innerHeight - parseInt(colorMixer.style.height)) / 2.0);

        // Create gesture recognizer.
        var msGesture = new MSGesture();
        msGesture.target = colorMixer;
        colorMixer.gesture = msGesture;
        // Expando property for handling multiple pointer devices.
        colorMixer.gesture.pointerType = null;

        // Expando property to track pointers.
        colorMixer.pointers = [];

        // Declare event handlers.
        colorMixer.addEventListener("pointerdown", onPointerDown, false);
        colorMixer.addEventListener("pointerup", onPointerUp, false);
        colorMixer.addEventListener("pointercancel", onPointerCancel, false);
        colorMixer.addEventListener("lostpointercapture", onLostPointerCapture, false);
        colorMixer.addEventListener("MSGestureChange", onMSGestureChange, false);
        colorMixer.addEventListener("MSGestureTap", onMSGestureTap, false);
        colorMixer.addEventListener("MSGestureEnd", onMSGestureEnd, false);
        colorMixer.addEventListener("MSGestureHold", onMSGestureHold, false);
    }

    // Initialize values and event listeners for color tracking.
    function setColors() {
        var m = new MSCSSMatrix(colorMixer.style.msTransform);
        _colorRed = new colorInfo(0, 0, m);
        _colorGreen = new colorInfo(0, 0, m);
        _colorBlue = new colorInfo(0, 0, m);

        document.getElementById("red").addEventListener("click", onColorChange, false);
        document.getElementById("green").addEventListener("click", onColorChange, false);
        document.getElementById("blue").addEventListener("click", onColorChange, false);
    }

    // Re-draw target based on transform matrix associated with color selection.
    function onColorChange(e) {
        switch (e.target.id) {
            case "red":
                colorMixer.style.msTransform = _colorRed.matrix;
                break;
            case "green":
                colorMixer.style.msTransform = _colorGreen.matrix;
                break;
            case "blue":
                colorMixer.style.msTransform = _colorBlue.matrix;
                break;
        }
        _selectedColor = e.target.id;

        eventLog.innerText = "Color change";
        targetLog.innerText = colorMixer.style.msTransform;
    }
    // Pointer down handler: Attach the pointer to a gesture object.
    function onPointerDown(e) {
        // Do not attach pointer if no color selected.
        if (_selectedColor === undefined)
            return;
        _selectedColor = getSelectedColor();

        // Process pointer.
        if (e.target === this) {
            this.style.borderStyle = "double";
            //  Attach first contact and track device.
            if (this.gesture.pointerType === null) {
                this.gesture.addPointer(e.pointerId);
                this.gesture.pointerType = e.pointerType;
            }
                // Attach subsequent contacts from same device.
            else if (e.pointerType === this.gesture.pointerType) {
                this.gesture.addPointer(e.pointerId);
            }
                // New gesture recognizer for new pointer type.
            else {
                var msGesture = new MSGesture();
                msGesture.target = e.target;
                e.target.gesture = msGesture;
                e.target.gesture.pointerType = e.pointerType;
                e.target.gesture.addPointer(e.pointerId);
            }
        }
        eventLog.innerText = "Pointer down";
    }

    // Get the current color.
    function getSelectedColor() {
        var colorSelection = document.getElementsByName("color");
        for (var i = 0; i < colorSelection.length; i++) {
            if (colorSelection[i].checked)
                return colorSelection[i].id;
        }
    }

    // Gesture change handler: Process gestures for translation, rotation, and scaling.
    // For this example, we don't track pointer movements.
    function onMSGestureChange(e) {
        // Get the target associated with the gesture event.
        var elt = e.gestureObject.target;
        // Get the matrix transform for the target.
        var matrix = new MSCSSMatrix(elt.style.msTransform);

        // Process gestures for translation, rotation, and scaling.
        e.target.style.msTransform = matrix.
            translate(e.offsetX, e.offsetY).
            translate(e.translationX, e.translationY).
            rotate(e.rotation * 180 / Math.PI).
            scale(e.scale).
            translate(-e.offsetX, -e.offsetY);

        // Mix the colors based on rotation value.
        switch (_selectedColor) {
            case "red":
                _colorRed.rotation += ((e.rotation * 180 / Math.PI));
                _colorRed.rotation = _colorRed.rotation % 360;
                targetLog.innerText = _colorRed.rotation.toString();
                if (_colorRed.rotation >= 0)
                    _colorRed.value = parseInt(Math.abs(_colorRed.rotation) * (256 / 360));
                else
                    _colorRed.value = parseInt((360 - Math.abs(_colorRed.rotation)) * (256 / 360));
                document.getElementById("labelRed").innerText = _colorRed.value.toString();
                _colorRed.matrix = matrix;
                break;
            case "green":
                _colorGreen.rotation += ((e.rotation * 180 / Math.PI));
                _colorGreen.rotation = _colorGreen.rotation % 360;
                targetLog.innerText = _colorGreen.rotation.toString();
                if (_colorGreen.rotation >= 0)
                    _colorGreen.value = parseInt(Math.abs(_colorGreen.rotation) * (256 / 360));
                else
                    _colorGreen.value = parseInt((360 - Math.abs(_colorGreen.rotation)) * (256 / 360));
                document.getElementById("labelGreen").innerText = _colorGreen.value.toString();
                _colorGreen.matrix = matrix;
                break;
            case "blue":
                _colorBlue.rotation += ((e.rotation * 180 / Math.PI));
                _colorBlue.rotation = _colorBlue.rotation % 360;
                if (_colorBlue.rotation >= 0)
                    _colorBlue.value = parseInt(Math.abs(_colorBlue.rotation) * (256 / 360));
                else
                    _colorBlue.value = parseInt((360 - Math.abs(_colorBlue.rotation)) * (256 / 360));
                document.getElementById("labelBlue").innerText = _colorBlue.value.toString();
                _colorBlue.matrix = matrix;
                break;
        }
        e.target.style.backgroundColor = "rgb(" + _colorRed.value + ", " + _colorGreen.value + ", " + _colorBlue.value + ")";
        targetLog.innerText = e.target.style.msTransform;
        eventLog.innerText = "Gesture change";
    }

    // Tap gesture handler: Display event.
    // The touch language described in Touch interaction design (http://go.microsoft.com/fwlink/?LinkID=268162),
    // specifies that the tap gesture should invoke an elements primary action (such as launching an application
    // or executing a command).
    // The primary action in this sample (color mixing) is performed through the rotation gesture.
    function onMSGestureTap(e) {
        eventLog.innerText = "Gesture tap";
    }

    // Gesture end handler: Display event.
    function onMSGestureEnd(e) {
        if (e.target === this) {
            this.style.borderStyle = "solid";
        }
        eventLog.innerText = "Gesture end";
    }

    // Hold gesture handler: Display event.
    function onMSGestureHold(e) {
        eventLog.innerText = "Gesture hold";
    }

    // Pointer up handler: Display event.
    function onPointerUp(e) {
        eventLog.innerText = "Pointer up";
    }

    // Pointer cancel handler: Display event.
    function onPointerCancel(e) {
        eventLog.innerText = "Pointer canceled";
    }

    // Pointer capture lost handler: Display event.
    function onLostPointerCapture(e) {
        eventLog.innerText = "Pointer capture lost";
    }
    app.start();
})();
