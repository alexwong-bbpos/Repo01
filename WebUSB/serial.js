var serial = {};

(function() {
  'use strict';

  serial.getPorts = function() {
    return navigator.usb.getDevices().then(devices => {
      return devices.map(device => new serial.Port(device));
    });
  };

  serial.requestPort = function() {
    var filters = [
      { 'vendorId': 0x2341, 'productId': 0x8036 },
      { 'vendorId': 0x2341, 'productId': 0x8037 },
    ];
    return navigator.usb.requestDevice({ 'filters': filters }).then(
      device => new serial.Port(device)
    );
  }

  serial.Port = function(device) {
    this.device_ = device;
  };

  serial.Port.prototype.connect = function() {
    let readLoop = () => {
      this.device_.transferIn(5, 64).then(result => {

        var textDecoder = new TextDecoder('utf-8');
        var str = textDecoder.decode(result.data);
        console.log("WebUSB - 🔴 Received 1 <<< " + str);
        console.log("WebUSB - 🔴 Received 2 <<< " + asciiToHexString(str));



        this.onReceive(result.data);
        readLoop();
      }, error => {
        this.onReceiveError(error);
      });
    };

    return this.device_.open()
        .then(() => {
          if (this.device_.configuration === null) {
            return this.device_.selectConfiguration(1);
          }
        })
        .then(() => this.device_.claimInterface(2))
        .then(() => this.device_.controlTransferOut({
            'requestType': 'class',
            'recipient': 'interface',
            'request': 0x22,
            'value': 0x01,
            'index': 0x02}))
        .then(() => {
          readLoop();
        });
  };

  serial.Port.prototype.disconnect = function() {
    return this.device_.controlTransferOut({
            'requestType': 'class',
            'recipient': 'interface',
            'request': 0x22,
            'value': 0x00,
            'index': 0x02})
        .then(() => this.device_.close());
  };

  serial.Port.prototype.send = function(data) {
    console.log("WebUSB - 🔵 Send >>> " + intArrayToHexString(data));
    return this.device_.transferOut(4, data);
  };

  function intArrayToHexString(arr) {
    var result = "";
    var z;

    for (var i = 0; i < arr.length; i++) {
      var str = arr[i].toString(16);

      z = 2 - str.length + 1;
      str = Array(z).join("0") + str;

      result += str;
    }
    return result.toUpperCase();
  }

  function asciiToHexString(str) {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n ++){
      var hex = Number(str.charCodeAt(n)).toString(16);
      arr1.push(hex);
    }
    return arr1.join('');
  }




})();
