import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController, Platform } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';

import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils';
import { DataInfoProvider } from '../../providers/data-info/data-info';
import { DatabaseProvider } from '../../providers/database/database';
import { AuthProvider } from '../../providers/auth/auth';
import { HttpdProvider } from '../../providers/httpd/httpd';
import { DataTextProvider } from '../../providers/data-text/data-text';
import { Renderer2 } from '@angular/core';

@IonicPage()
@Component({
  selector: 'page-sorteios',
  templateUrl: 'sorteios.html',
})
export class SorteiosPage {

  usersWorkers: Observable<any>;
  usersArray: any[] = [];
  searchTerm: string = '';
  searchControl: FormControl;
  orderType: any;

  constructor(
    public navCtrl: NavController,
    public uiUtils: UiUtilsProvider,
    public dataInfo: DataInfoProvider,
    public db: DatabaseProvider,
    public platform: Platform,
    public auth: AuthProvider,
    public dataText: DataTextProvider,
    public httpd: HttpdProvider,
    public actionsheetCtrl: ActionSheetController,
    public navParams: NavParams,
    private renderer: Renderer2
  ) {}

  ionViewDidLoad() {
    this.orderType = "1";
    if (this.dataInfo.isHome) {
      this.reload();
    } else {
      this.navCtrl.setRoot('LoginPage');
    }
  }

  reload() {
    console.log('reload')
    
    const loading = this.uiUtils.showLoading(this.dataInfo.titleLoadingInformations);
    loading.present();
    this.usersWorkers = this.db.getProdutos();
    const sub = this.usersWorkers.subscribe(data => {
      sub.unsubscribe();
      this.processUserData(data);
      loading.dismiss();
    });
  }

  processUserData(data) {
    this.usersArray = [];
    data.forEach(element => {
      const info = element.payload.val();
      info.key = element.payload.key;
      info.lastDatetimeStr = moment(info.lastDatetime).format("DD/MM/YYYY hh:mm:ss");
      this.usersArray.push(info);
    });
    this.checkOrder();
  }

  
  checkOrder() {
    switch (this.orderType) {
      case "1":
        this.orderByProperty('name');
        break;
      case "2":
        this.orderByProperty('name', true);
        break;
      case "3":
        this.orderByProperty('datetime');
        break;
      case "4":
        this.orderByProperty('lastDatetime');
        break;
      default:
        this.uiUtils.showToast(this.dataText.errorFilter);
        break;
    }
  }

  orderByProperty(property, desc = false) {
    // this.usersArray.sort((a, b) => desc ? b[property].localeCompare(a[property]) : a[property].localeCompare(b[property]));
  }

  orderAlpha(){

    let tmp = this.usersArray.sort(function(a,b) {

      if(a.name < b.name) { return -1; }
      if(a.name > b.name) { return 1; }
      return 0;

    })    


    this.usersArray = tmp
  }

  orderAlphaDesc(){

    let tmp = this.usersArray.sort(function(a,b) {

      if(a.name > b.name) { return -1; }
      if(a.name < b.name) { return 1; }
      return 0;

    })    


    this.usersArray = tmp
  }

  orderDatetime(){

    let tmp = this.usersArray.sort(function(a,b) {

      if(a.datetime < b.datetime) { return -1; }
      if(a.datetime > b.datetime) { return 1; }
      return 0;

    })    


    this.usersArray = tmp
  }


  orderAccess(){

    let tmp = this.usersArray.sort(function(a,b) {

      
      if(a.lastDatetime && b.lastDatetime){
        if(a.lastDatetime > b.lastDatetime) { return -1; }
        if(a.lastDatetime < b.lastDatetime) { return 1; }
      }
      
      return 0;

    })    


    this.usersArray = tmp
  }

  
  realizarSorteio(payload_){

    
      
      let alert = this.uiUtils.showConfirm(this.dataText.warning, 'Deseja realizar o sorteio para esse produto?')  
      alert.then((result) => {
  
        if(result){
          this.realizarSorteioContinue(payload_)
        }    
      })       

  }

  async realizarSorteioContinue(payload_) {

    console.log('Realizando sorteio para o produto:', payload_);

    const key = this.db.adicionaSorteio(payload_.key);
    console.log('Sorteio adicionado com sucesso. Key:', key);

    let loading = this.uiUtils.showLoading('Sorteando números....');
    await loading.present();
        

    console.log('Sorteio adicionado com sucesso. Key:', key);


    const checkSorteio = () => {

      this.db.getSorteioKey(key).subscribe((sorteio) => {


        console.log('Sorteio:', sorteio);
        console.log('Sorteio 1 ', sorteio[0].payload.val())

        if (sorteio.length > 0){
          loading.dismiss();
         
          let info = sorteio[0].payload.val()
          console.log('info', info)

          this.animateNumbers(info);
        } else {
          
          this.uiUtils.showToast('Sorteio ainda não finalizado. Tentando novamente em 10 segundos...');

          console.log('Sorteio ainda não finalizado. Tentando novamente em 10 segundos...');

          setTimeout(checkSorteio, 10000);
        }
      });
    };

    setTimeout(checkSorteio, 10000);
  }

  

  animateNumbers(data: any) {
    console.log(data);

    if(data.status == 'finalizado'){
      console.log('Sorteio finalizado com sucesso.');
      this.uiUtils.showAlertSuccess('Sorteio já realizado.');
      return
    }

    if(data.winner == null){
      console.log('Sorteio ainda não finalizado.');
      this.uiUtils.showAlertSuccess('Sorteio ainda não finalizado.');
      return
    }

    const winnerNumber = data.winner.winner_number;
    console.log('winnerNumber:', winnerNumber);

    this.uiUtils.showAlertSuccess('O número sorteado foi: ' + winnerNumber);
    this.reload()

    /*const numbers = Array.from(String(winnerNumber), Number);
    for (let i = 1; i <= 100; i++) {
      numbers.push(winnerNumber + i);
    }

    const delay = 1000; // Delay in milliseconds

    // Create and style the modal
    const modalElement = this.renderer.createElement('div');
    this.renderer.addClass(modalElement, 'number-modal');
    this.renderer.appendChild(document.body, modalElement);

    const numberModalElement = this.renderer.createElement('div');
    this.renderer.addClass(numberModalElement, 'number-modal-content');
    this.renderer.appendChild(modalElement, numberModalElement);

    const animate = (index: number) => {
      setTimeout(() => {
        const numberTextElement = this.renderer.createElement('div');
        this.renderer.addClass(numberTextElement, 'number-text');
        numberTextElement.innerText = numbers[index].toString();
        this.renderer.appendChild(numberModalElement, numberTextElement);

        // Show the current number
        this.renderer.setStyle(numberTextElement, 'display', 'block');

        if (index < numbers.length - 1) {
          animate(index + 1);
        } else {
          const winnerElement = this.renderer.createElement('div');
          this.renderer.addClass(winnerElement, 'winner-text');
          winnerElement.innerText = winnerNumber.toString();
          this.renderer.appendChild(numberModalElement, winnerElement);

          // Show the winner number
          this.renderer.setStyle(winnerElement, 'display', 'block');
        }
      }, delay);
    };
    animate(0);*/
  }
  

}
