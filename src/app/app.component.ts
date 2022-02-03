import { Component } from '@angular/core';
import { Platform, NavController, MenuController, IonRouterOutlet } from '@ionic/angular';

import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private platform: Platform,
    private androidPermissions: AndroidPermissions) {

    this.platform.ready().then(() => {
      this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA).then((result => {
        if(result.hasPermission){
          
        }
      }),(err => { 

      }));
    });
  }
}
