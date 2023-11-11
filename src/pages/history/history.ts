import { Component, OnDestroy } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils';
import { DataInfoProvider } from '../../providers/data-info/data-info';
import { DatabaseProvider } from '../../providers/database/database';
import * as moment from 'moment';
import { DataTextProvider } from '../../providers/data-text/data-text';

@IonicPage()
@Component({
  selector: 'page-history',
  templateUrl: 'history.html',
})
export class HistoryPage implements OnDestroy {
  private worksSubscription: Subscription;
  works: Observable<any>;
  worksArray: any = [];
  usersWorkersArray: any = [];
  usersWorkers: any = [];
  client: any;
  selectedDate: string;
  selectedDateEnd: string;
  totalJobs: number = 0;
  status: string = "";

  constructor(
    public navCtrl: NavController,
    public uiUtils: UiUtilsProvider,
    public dataInfo: DataInfoProvider,
    public db: DatabaseProvider,
    public navParams: NavParams,
    public dataText: DataTextProvider
  ) {}

  ionViewDidLoad() {
    if (this.dataInfo.isHome) {
      this.startInterface();
    } else {
      this.navCtrl.setRoot('LoginPage');
    }
  }

  ngOnDestroy() {
    if (this.worksSubscription) {
      this.worksSubscription.unsubscribe();
    }
  }

  startInterface() {
    this.status = "Finalizado";
    let statustmp = this.navParams.get('status');
    if (statustmp) {
      this.status = statustmp;
    }
    this.selectedDateEnd = moment().format();
    this.selectedDate = moment().startOf('month').format();
    this.usersWorkers = [];


    if(! this.navParams.get('work')) {
      this.getUser();
    }
    
    this.showHistory()    

    
  }

  getUser() {
    this.db.getUser().subscribe(data => {
      this.getUserCallback(data);
    });
  }

  getUserCallback(data) {
    this.usersWorkersArray = data.map(element => {
      let info = element.payload.val();
      info.key = element.payload.key;
      return info;
    });
  }

  clientChange(event) {
    console.log('Client modified:', event.value.uid);
  }

  clear() {
    this.client = "";
    this.status = "Todos";
    this.worksArray = [];
  }

  showHistory() {

    if (moment(this.selectedDate, "DD/MM/YYYY").isAfter(this.selectedDateEnd, 'days')) {
      this.uiUtils.showAlertError("Data final não pode ser anterior a data inicial");      
    } else {
      if (moment(this.selectedDate).diff(this.selectedDateEnd) > 30) {
        this.uiUtils.showAlertError("Limite de 30 dias excedido!");
      } else {
        this.getHistory();
      }
    }
  }


  getHistory() {
    let loading = this.uiUtils.showLoading(this.dataText.loading);
    loading.present();

    this.totalJobs = 0;
    this.worksArray = [];
    let totalm = moment(this.selectedDateEnd).diff(this.selectedDate, 'months');

    loading.dismiss();

    if (totalm > 0) {
      for (let index = 0; index < totalm; index++) {
        let tmp = this.selectedDate.replace("-03:00", "");
        let dateYear = moment(tmp).add(index, 'month').format('YYYY');
        let dateMonth = moment(tmp).add(index, 'month').format('MM');

        this.workGet(dateMonth, dateYear);
      }
    } else {
      let tmp = this.selectedDate.replace("-03:00", "");
      let dateYear = moment(tmp).format('YYYY');
      let dateMonth = moment(tmp).format('MM');

      this.workGet(dateMonth, dateYear);
    }
  }

  workGet(month, year) {
    let loading = this.uiUtils.showLoading(this.dataText.loading);
    loading.present();


    this.works = this.db.getAllWorks(year, month);

    this.worksSubscription = this.works.subscribe(data => {
      this.worksCallback(data);
      loading.dismiss();
    });
  }

  
  worksCallback(data) {
    this.worksArray = data.map(element => {
      let info = element.payload.val();
      info.key = element.payload.key;
      info.lastDatetimeStr = moment().format("DD/MM/YYYY hh:mm:ss");
      
      return info;
    });

    this.organizaFila();
  }

  organizaFila() {
    this.worksArray.sort((a, b) => {
      let date1 = moment(a.datetime, "DD/MM/YYYY hh:mm:ss");
      let date2 = moment(b.datetime, "DD/MM/YYYY hh:mm:ss");
      return date1.isBefore(date2) ? 1 : -1;
    });
  }

  get() {
    this.getHistory();
  }

  changeStatus(work, status){

    this.db.updateStatusWork(work, status)
    .then(data => {
      console.log('data', data)
    })

  }

}
