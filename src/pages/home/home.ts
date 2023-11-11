import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils';
import { DataInfoProvider } from '../../providers/data-info/data-info';
import { DataTextProvider } from '../../providers/data-text/data-text';
import { DatabaseProvider } from '../../providers/database/database';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Geolocation } from '@ionic-native/geolocation';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private serviceSubscription: Subscription;
  paymentTitle = "Aguardando";
  totalRegisterCompleted = "100";

  constructor(
    public navCtrl: NavController,
    public uiUtils: UiUtilsProvider,
    private geolocation: Geolocation,
    public dataInfo: DataInfoProvider,
    public events: Events,
    public dataText: DataTextProvider,
    private iab: InAppBrowser,
    public db: DatabaseProvider,
    public navParams: NavParams
  ) {}

  ionViewDidLoad() {
    if (this.dataInfo.isHome) {
      this.startInterface();
    } else {
      this.navCtrl.setRoot('LoginPage');
    }
    this.subscribeToFcmToken();
  }

  ngOnDestroy() {
    this.events.unsubscribe(this.dataInfo.eventFcmStart);
    if (this.serviceSubscription) {
      this.serviceSubscription.unsubscribe();
    }
  }

  startInterface() {
    this.events.publish(this.dataInfo.eventFcmStart, 1);
    this.getCurrentLocation().subscribe();
    if (this.dataInfo.isDev) {
      this.dev();
    }
  }

  subscribeToFcmToken() {
    this.events.subscribe(this.dataInfo.eventFcmToken, data => {
      this.dataInfo.setToken(data);
      this.db.saveToken(data);
    });
  }

  dev() {
    this.navCtrl.setRoot("SettingsPage");
  }

  goPageClients() {
    this.navCtrl.push('ClientsPage');
  }

  goPagProfessionals() {
    this.navCtrl.push('ProfessionalsPage');
  }

  goPageWorks() {
    this.navCtrl.push('WorkPage');
  }

  goPageSettings() {
    this.navCtrl.push('SettingsPage');
  }

  logout() {
    this.events.publish('logout');
  }


  handleServiceData(data) {
    const services = [];
    const loading = this.uiUtils.showLoading("Carregando serviços disponíveis");
    loading.present();

    const promises = data.map(element => {
      let val = element.payload.val();
      val.toggle = false;
      val.total = val.value;
      services.push(val);
      return Promise.resolve();
    });

    Promise.all(promises).then(() => {
      this.dataInfo.services = services;
      loading.dismiss();
    });
  }

  getCurrentLocation(): Observable<any> {
    return new Observable(observer => {
      const options = { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 };
      this.geolocation.getCurrentPosition(options).then(resp => {
        this.dataInfo.userInfo.latitude = resp.coords.latitude;
        this.dataInfo.userInfo.longitude = resp.coords.longitude;
        this.db.saveLatLong(this.dataInfo.userInfo.latitude, this.dataInfo.userInfo.longitude);
        observer.next(new google.maps.LatLng(this.dataInfo.userInfo.latitude, this.dataInfo.userInfo.longitude));
      }).catch(error => {
        this.uiUtils.showAlertError(error);
      });
    });
  }

  openInAppBrowser(url: string) {
    const options = 'location=no';
    this.iab.create(url, '_blank', options);
  }

  showHelp() {
    this.openInAppBrowser("https://inova.in");
  }

  showRedMine() {
    this.openInAppBrowser("https://inova.in");
  }
 
  suporte() {
    window.open(this.dataInfo.appConfig.appHelp, '_blank');
  }
}
