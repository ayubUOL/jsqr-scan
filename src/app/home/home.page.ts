import { Component, ElementRef, ViewChild } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';

import { BeepService } from '../beep.service';
import jsQR from 'jsqr';
import { MultiFormatReader, BarcodeFormat, DecodeHintType, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } from '@zxing/library';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  scanActive = true;
  scanResult = null;
  @ViewChild('video', { static: false }) video: ElementRef;
  @ViewChild('canvas', { static: false }) canvas: ElementRef;
  @ViewChild('dummyCanvas', { static: false }) dummyCanvas: ElementRef;
  videoElement: any;

  canvasElement: any;
  canvasContext: any;

  hints: any;
  formats: any;

  data = [];

  constructor(private platform: Platform, private androidPermissions: AndroidPermissions, public beepService: BeepService) { 
    this.hints = new Map();
    this.formats = [
      // BarcodeFormat.QR_CODE, 
      // BarcodeFormat.DATA_MATRIX,
      // BarcodeFormat.AZTEC, 
      // BarcodeFormat.CODABAR, 
      BarcodeFormat.CODE_128, 
      // BarcodeFormat.CODE_39, 
      // BarcodeFormat.CODE_93, 
      // BarcodeFormat.EAN_13, 
      // BarcodeFormat.EAN_8, 
      // BarcodeFormat.ITF, 
      // BarcodeFormat.MAXICODE, 
      // BarcodeFormat.PDF_417, 
      // BarcodeFormat.RSS_14,
      // BarcodeFormat.UPC_A, 
      // BarcodeFormat.UPC_E, 
      // BarcodeFormat.UPC_EAN_EXTENSION
    ];
    this.hints.set(DecodeHintType.POSSIBLE_FORMATS, this.formats);
    // this.hints.set(DecodeHintType.TRY_HARDER, true);
  }

  ngAfterViewInit() {
    this.platform.ready().then(() => {
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then((result => {
        console.log('Has permission?', result.hasPermission)
        if (result.hasPermission) {
          this.canvasElement = this.canvas.nativeElement;
          this.canvasContext = this.canvasElement.getContext('2d');
          this.videoElement = this.video.nativeElement;

          this.startScan();
        } else {
          this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA).then((result => {
            if (result.hasPermission) {
              this.canvasElement = this.canvas.nativeElement;
              this.canvasContext = this.canvasElement.getContext('2d');
              this.videoElement = this.video.nativeElement;

              this.startScan();
            }
          }), (err => {

          }));
        }
      }), (err => {
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA)
      }));
    });

    this.canvasElement = this.canvas.nativeElement;
    this.canvasContext = this.canvasElement.getContext('2d');
    this.videoElement = this.video.nativeElement;

    this.startScan();
  }

  async startScan() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });

    this.videoElement.srcObject = stream;
    this.videoElement.setAttribute('playsinline', true);
    this.videoElement.play();
    requestAnimationFrame(this.scan.bind(this));
  }

  scan() {
    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      this.canvasElement.height = this.videoElement.videoHeight;
      this.canvasElement.width = this.videoElement.videoWidth;

      this.canvasContext.scale(2.5, 2.5);
      this.canvasContext.drawImage(
        this.videoElement,
        -150,
        -184,
        this.canvasElement.width,
        this.canvasElement.height
      );
      const imageData = this.canvasContext.getImageData(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      // const code = jsQR(imageData.data, imageData.width, imageData.height, {
      //   inversionAttempts: 'dontInvert'
      // });

      // if (code) {
      //   // this.scanActive = false;
      //   this.beepService.beep();
      //   this.scanResult = code.data;
      //   this.data.push(code.data);
      //   console.log("Scan Result -> ", this.scanResult)
      //   requestAnimationFrame(this.scan.bind(this));
      // } else {
      //   if (this.scanActive) {
      //     requestAnimationFrame(this.scan.bind(this));
      //   }
      // }

      const reader = new MultiFormatReader();
      reader.setHints(this.hints);

      const len = imageData.width * imageData.height;

      const luminancesUint8Array = new Uint8ClampedArray(len);

      for(let i = 0; i < len; i++){
        luminancesUint8Array[i] = ((imageData.data[i*4]+imageData.data[i*4+1]*2+imageData.data[i*4+2]) / 4) & 0xFF;
      }

      const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, imageData.width, imageData.height);

      // console.log("Luminance -> ", luminanceSource)
      
      // const luminanceSource = new RGBLuminanceSource(imageData.data, imageData.width, imageData.height);
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      
      try {
        if(reader.decode(binaryBitmap).getText()){
          this.beepService.beep();
          this.data.push(reader.decode(binaryBitmap).getText());
          console.log("Zxing Barcode -> ", reader.decode(binaryBitmap).getText());
        }
        requestAnimationFrame(this.scan.bind(this));
      } catch (e) {
        requestAnimationFrame(this.scan.bind(this));
        // console.log("Zxing Error -> ", e);
      }
    } else {
      requestAnimationFrame(this.scan.bind(this));
    }
  }

  stopScan() {
    this.scanActive = false;
  }

  reset() {
    this.scanResult = null;
  }
}
