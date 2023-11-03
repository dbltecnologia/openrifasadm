import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils'
import { DataInfoProvider } from '../../providers/data-info/data-info'
import { DatabaseProvider } from '../../providers/database/database';
import * as moment from 'moment';
import { Subscription } from 'rxjs/Subscription'
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { DataTextProvider } from '../../providers/data-text/data-text'

@IonicPage()
@Component({
  selector: 'page-history',
  templateUrl: 'history.html',
})
export class HistoryPage {

  private worksSubscription: Subscription;  

  works: Observable<any>;
  worksArray: any = []
  reportsArray: any = []
  usersWorkersArray: any = []
  clientsWorkersArray: any = []
  usersWorkers: any = []  
  client: any
  worker: any
  selectedDate: string
  selectedDateEnd: string  
    
  totalJobs: number = 0
  totalMoney: number = 0
  totalMoneyStr: string
  
  totalPrePaid: number = 0  
  totalPrePaidStr: string

  totalCard: number = 0  
  totalCardStr: string

  totalComission: number = 0  
  totalComissionStr: string  

  totalFinal: number = 0
  totalFinalStr: string  
  
  isReportOpen: Boolean = false
  textHeader: string = "Relatórios"
  
  tablePrice: any  
  status: string = "" 

  constructor(public navCtrl: NavController, 
    public uiUtils: UiUtilsProvider,    
    public dataInfo: DataInfoProvider,    
    public db: DatabaseProvider,
    public platform: Platform,
    private iab: InAppBrowser,
    public dataText: DataTextProvider,
    public navParams: NavParams) {
  }

  ionViewDidLoad() {    
    if(this.dataInfo.isHome)
      this.startInterface()
    else
      this.navCtrl.setRoot('LoginPage')
  }

  
  ngOnDestroy() {
   if(this.worksSubscription)
    this.worksSubscription.unsubscribe()
  }  

  startInterface(){

    this.isReportOpen = false
    this.status = "Finalizado"    
    let statustmp = this.navParams.get('status')

    if(statustmp)
      this.status = statustmp    
    
    this.selectedDateEnd = moment().format() 
    this.selectedDate = moment().startOf('month').format() 
    
    this.usersWorkers = []
    this.getWorkers()
  


  }

 
  getWorkers(){

    this.db.getWorkers()
    .subscribe(data => {
        this.getWorkersCallback(data)
    })
  }

  getWorkersCallback(data){

    this.usersWorkersArray = []

    data.forEach(element => {

      let info = element.payload.val()
      info.key = element.payload.key

      if(info.status !== 'Desativado')            
        this.checkRegionWorker(info)      
    });

  }



  

  checkRegionWorker(info){

    if(this.dataInfo.userInfo.isAdmin)
      this.usersWorkersArray.push(info)
    
    if(this.dataInfo.userInfo.managerRegion)
      
      if(info.region === this.dataInfo.userInfo.managerRegion)
        this.usersWorkersArray.push(info)          
  }


  workersChanged(event){    

    console.log('modificado')
    console.log(event)


    //this.get()
  }

  clientChange(event){    

    console.log('modificado: ')
    console.log(event.value.uid)

    // this.get()
  }

  clear(){    
    this.client = ""
    this.worker = ""
    this.status = "Todos"
   
    this.worksArray= []    
    this.reportsArray = []    

    this.clearMoney()
    
  }

  clearMoney(){
    this.totalMoney = 0
    this.totalComission = 0
    this.totalPrePaid = 0
    this.totalCard = 0
    this.totalFinal = 0   
    this.totalCardStr = "0.00"
    this.totalComissionStr = "0.00"
    this.totalFinalStr = "0.00"
    this.totalJobs = 0
    this.totalMoneyStr = "0.00"
    this.totalPrePaidStr = "0.00" 
  }

  showReport(){
    this.isReportOpen = true
    this.textHeader = "Relatórios"
    this.showReports()
  }


  showHistory(){   

    if(moment(this.selectedDate).isAfter(moment(this.selectedDateEnd)), 'days'){


      if(moment(this.selectedDate).diff(moment(this.selectedDateEnd)) > 30 )
        this.uiUtils.showAlertError("Limite de 30 dias excedido!")
      
      else         
          this.backHistory()                

    }

    else {
      this.uiUtils.showAlertError("Data final não pode ser anterior a data inicial")
    }
    
  }


  backHistory(){

    this.isReportOpen = false
    this.textHeader = "Histórico"
    this.getHistory()
  }

  getHistory(){


    let loading = this.uiUtils.showLoading(this.dataText.loading)
    loading.present()    

    this.clearMoney()
    this.totalJobs = 0    
    this.worksArray= []    
    this.reportsArray = []                  
    let totalm = moment(this.selectedDateEnd).diff(this.selectedDate, 'months')
    
    if(totalm > 0){

      loading.dismiss()    

      for (let index = 0; index < totalm; index++) {
      
        let tmp = this.selectedDate.replace("-03:00", "")    
        let dateYear = moment(tmp).add(index, 'month').format('YYYY')  
        let dateMonth = moment(tmp).add(index, 'month').format('MM')  
  
        this.workGet(dateMonth, dateYear)          
      }

    } else {

      loading.dismiss()    

      let tmp = this.selectedDate.replace("-03:00", "")    
      let dateYear = moment(tmp).format('YYYY')  
      let dateMonth = moment(tmp).format('MM')  
    
      this.workGet(dateMonth, dateYear)          



    }

    
  }  

  workGet(month, year){    

    let loading = this.uiUtils.showLoading(this.dataText.loading)
    loading.present()    

    this.works = this.db.getAllWorksAcceptedsDate(year, month)
      
    this.worksSubscription = this.works.subscribe( data => {
      this.worksCallback(data)      
      loading.dismiss()    
    })
  }

    
  worksCallback(data){   
    
    this.worksArray = []
    
    data.forEach(element => {

      let info = element.payload.val()
      info.key = element.payload.key       
      info.showIfood = false

      this.worksArray.push(info)
                      
    });    


    this.organizaFila()

  }



  organizaFila(){    
           
    this.worksArray.sort((a, b) => {

      let date1 = moment(a.datetime, "DD/MM/YYYY hh:mm:ss").format()
      let date2 = moment(b.datetime, "DD/MM/YYYY hh:mm:ss").format()
      
      let isBefore = moment(date1).isBefore(date2)      

      return isBefore ? 1 : -1;
      
    })

  }

  organizaFilaRelatorios(){    

    this.reportsArray.sort((a, b) => {

      let date1 = moment(a.datetime).format()
      let date2 = moment(b.datetime).format()
      
      let isBefore = moment(date1).isBefore(date2)      

      return isBefore ? 1 : -1;
      
    })
  }
  
  downloadExcel(){


    let alert = this.uiUtils.showConfirm(this.dataText.warning, "Deseja realizar o download via excel?")  
    alert.then((result) => {

      if(result){
        this.downloadExcelContinue()      
      }        
    })       
  }
  
  downloadExcelContinue(){

    let loading = this.uiUtils.showLoading(this.dataText.loading)
    loading.present()        

    this.db.addReport(
      this.selectedDate, 
          this.selectedDateEnd,       
          this.totalJobs, 
          this.totalComissionStr, 
          this.totalPrePaidStr, 
          this.totalCardStr, 
          this.totalMoneyStr, 
          this.totalFinalStr,
          this.client,
          this.worker)


    .then(() => {

      loading.dismiss()
      this.uiUtils.showAlertSuccess("Favor aguarde. Estamos processando seu relatório")
      this.showReports()
    })
  }

  showReports(){

    let loading = this.uiUtils.showLoading(this.dataText.loading)
    loading.present()
    
    this.db.getReports()
    .subscribe((data => {

      this.showReportsContinue(data)
      loading.dismiss()

    }))
  }


  showReportsContinue(data){

    this.reportsArray = []
    this.worksArray = []

    data.forEach(element => {

      let info = element.payload.val()

      info.key = element.payload.key
      info.data = moment(info.data).format("MM/YYYY")
      info.dataEnd = moment(info.dataEnd).format("DD/MM/YYYY")            
      info.datetimeStart = moment(info.datetimeStart).format("DD/MM/YYYY")
      info.datetimeEnd = moment(info.datetimeEnd).format("DD/MM/YYYY")
      
      this.reportsArray.push(info)
    });

    this.organizaFilaRelatorios()
    
  }
  
  expand(work){
    work.expand = !work.expand    
  }



  open(data){        
    this.iab.create(data.url);
  }

  removeReport(report){

    console.log('Remover: ')
    console.log(report)


    let alert = this.uiUtils.showConfirm(this.dataText.warning, this.dataInfo.titleAreYouSure)  
    alert.then((result) => {

        if(result){

          this.db.removeReports(report.key)
          .then(() => {
  
            this.uiUtils.showAlertSuccess("Relatório removido com sucesso")
            this.showReports()


          })


        }

    })


    
  }
  
  openDirect(data){  
      
    let options = 'location=no';

    if(data.directLink){

      if(this.dataInfo.isWeb)
        this.iab.create(data.directLink, '_blank', options);    
      else 
        this.iab.create(encodeURI(data.directLink), '_system', options);

    }            
  }  

  get(){
    this.getHistory()
  }



}
