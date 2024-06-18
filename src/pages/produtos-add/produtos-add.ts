import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, ActionSheetController, Platform, NavParams, MenuController, Events } from 'ionic-angular';
import { CameraProvider } from '../../providers/camera/camera'
import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils'
import { DataInfoProvider } from '../../providers/data-info/data-info'
import { StorageProvider } from '../../providers/storage/storage';
import 'rxjs/add/operator/debounceTime';
import { FormControl } from '@angular/forms';
import { DatabaseProvider } from '../../providers/database/database';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import * as moment from 'moment';
import { AuthProvider } from '../../providers/auth/auth';
import { Observable } from 'rxjs/Observable';
import { HttpdProvider } from '../../providers/httpd/httpd';
import { DataTextProvider } from '../../providers/data-text/data-text'


@IonicPage()
@Component({
  selector: 'page-produtos-add',
  templateUrl: 'produtos-add.html',
})
export class ProdutosAddPage {
  
  public formGroup: FormGroup;  

  
  base64Image: string = '';
  selectedPhoto: any;  

  clientInfo: any = []
  primeiroUso: Boolean = false;
  photoChanged: Boolean = false
  
  searchControl: FormControl;
  searching: any = false;

  services: any = [];  
  state_: string = 'RJ'  
  payload: any 
   

  constructor(
    public navCtrl: NavController, 
    public platform: Platform,
    public actionsheetCtrl: ActionSheetController,
    public uiUtils: UiUtilsProvider,    
    public storage: StorageProvider, 
    public camera: CameraProvider,    
    public navParams: NavParams,
    public events: Events,
    public menu: MenuController,
    public db: DatabaseProvider,    
    private formBuilder: FormBuilder,
    public auth: AuthProvider,
    public httpd: HttpdProvider,
    public dataText: DataTextProvider,
    public dataInfo: DataInfoProvider) {              
  }

  ngOnInit() {
    this.initForm()    
  }

  ionViewDidLoad() {

    if(this.dataInfo.isHome)
      this.startInterface()    
    else
      this.navCtrl.setRoot('LoginPage')              
  }

  startInterface(){
    
    this.payload = this.navParams.get('payload')    
    this.clear()

    console.log(this.payload)

    if(this.payload){      
      this.loadInfo()
    }
  }
 
  initForm() {    
    this.formGroup = this.formBuilder.group({   
      datetime: [{value: moment().format()}, [Validators.required]],
      description: ['',[Validators.required]],
      image: ['',[Validators.required]],
      numberMax: ['',[Validators.required]],
      numberMin: ['',[Validators.required]],
      qtdNCota: ['',[Validators.required]],
      rules: ['',[Validators.required]],
      title: ['',[Validators.required]],
      
      valuePrices: [0.35,[Validators.required]],

      promocoes: this.formBuilder.array([
        { qtd: 25, value: 8.66 },
        { qtd: 50, value: 17.32 },
        { qtd: 100, value: 34.3 },
        { qtd: 250, value: 85.7 }
      ])
    });
  }
 
  loadInfo(){   
    this.menu.enable(true);
    this.clear()
    this.loginInfoUser()   
  }   

  loginInfoUser(){
    
    
    let payload = this.payload


    console.log('Carregando dados de um produto já existente', payload)


    this.formGroup.patchValue({
      datetime: payload.datetime,
      description: payload.description,
      image: payload.image,
      link: 'sorteio/index.html',
      numberMax: payload.numberMax,
      numberMin: payload.numberMin,
      qtdNCota: payload.qtdNCota,
      rules: payload.rules,
      title: payload.title,
      valuePrices: payload.valuePrices      
    })    

    this.base64Image = payload.image      

    console.log('Formulário carregado', this.formGroup.value)
    console.log(this.base64Image)

       
  }
  
 
  save(){

    if(this.formGroup.valid){

      this.saveCheck()
        .then(() => {
          let alert = this.uiUtils.showConfirm(this.dataText.warning, "Tem certeza?")  
          alert.then((result) => {      
            if(result){              
              this.update()    
            }                            
          })   
          .catch((error) => {
            console.log('error', error)
            this.uiUtils.showAlertError(error)
          })
        })
    }                  
    else {    
      console.log('Invalid field:', this.formGroup.invalid ? Object.keys(this.formGroup.controls).find(key => this.formGroup.controls[key].invalid) : 'base64Image');
      
      this.uiUtils.showAlertError(this.dataText.checkAllFields)   
    }      
  }

  saveCheck(){

    return new Promise<void>((resolve, reject) => {

      if(!this.formGroup.value.title) {
        reject("Favor informar o título");
      } else if(!this.formGroup.value.description) {
        reject("Favor informar a descrição");
      } else if(!this.formGroup.value.numberMax) {
        reject("Favor informar o número máximo");
      } else if(!this.formGroup.value.numberMin) {
        reject("Favor informar o número mínimo");
      } else if(!this.formGroup.value.qtdNCota) {
        reject("Favor informar a quantidade de cotas");
      } else if(!this.formGroup.value.rules) {
        reject("Favor informar as regras");
      }

      if (!this.base64Image) { reject("Favor adicionar uma imagem"); }

    resolve()

    })    
  }

  clear(){   
    this.photoChanged = false
  }


  addnew(){

    this.saveCheck()
    .then(() => {
      let alert = this.uiUtils.showConfirm(this.dataText.warning, "Deseja adicionar um novo produto?")  
      alert.then((result) => {      
        if(result){              
          this.update()    
        }                            
      })   
      .catch((error) => {
        this.uiUtils.showAlertError(error)
      })
    })
  }

  update(){

    if(this.base64Image){

      if(this.photoChanged)
        this.uploadWithPic()
      else 
        this.uploadFinish(this.base64Image) 
    }
      
    else 
      this.uploadFinish("")   
  }


  getPictureFile() {
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', (event) => {
      const file = (event.target as HTMLInputElement).files[0]; // Cast event.target to HTMLInputElement
      const reader = new FileReader();
      reader.onloadend = () => {
        this.base64Image = reader.result as string;
        this.photoChanged = true

      };
      reader.readAsDataURL(file);
    });
    fileInput.click();
  }

  uploadWithPic(){    
    let loading = this.uiUtils.showLoading("Carregando")
    loading.present()

    let datanow = moment().format("YYYYDDMMhhmmss")
    let path = "/pictures/" + datanow + '/'    

    this.storage.uploadPicture(this.base64Image)

      .then(snapshot => {

        snapshot.ref.getDownloadURL().then(url => {
          loading.dismiss()

          this.events.publish('userInfo:updatePhoto', url)
          this.uploadFinish(url)           

        }).catch(err => {
          loading.dismiss()
          this.uiUtils.showAlert(this.dataText.warning, err).present()
          
        })
      })
      .catch( error => {
        loading.dismiss()
        this.uiUtils.showAlert(this.dataText.warning, error).present()
      })        
  }

  uploadFinish(url: string){

    if(this.payload)  
        this.updateFinish(url)
      else
        this.addContinue(url)
    
    
  }

  updateFinish(url){

    console.log(url)

    let loading = this.uiUtils.showLoading(this.dataInfo.pleaseWait)
    loading.present()

    let self = this    

    this.defaultValues()

    const produto = {
      datetimeUpdated: moment().format(),
      datetime: this.formGroup.value.datetime,
      description: this.formGroup.value.description,
      image: url,
      link: "sorteio/index.html",
      numberMax: Number(this.formGroup.value.numberMax),
      numberMin: Number(this.formGroup.value.numberMin),
      qtdNCota: Number(this.formGroup.value.qtdNCota),
      rules: this.formGroup.value.rules,
      title: this.formGroup.value.title,      
      promocoes: this.formGroup.value.promocoes,
      type: this.dataInfo.appType,      
      valuePrices: String(this.formGroup.value.valuePrices),
      key: this.payload.key
      
    }

    this.db.atualizaProduto(produto)
    .then( () => {

      this.uiUtils.showAlert(this.dataText.success, this.dataText.savedSuccess).present()
      loading.dismiss()

      this.navCtrl.popToRoot()
      this.navCtrl.push

    })  
      
  }

  addContinue(url: string){

    const produto = {
      datetime: this.formGroup.value.datetime,      
      description: this.formGroup.value.description,
      image: url,
      link: "sorteio/index.html",
      numberMax: Number(this.formGroup.value.numberMax),
      numberMin: Number(this.formGroup.value.numberMin),
      qtdNCota: Number(this.formGroup.value.qtdNCota),
      rules: this.formGroup.value.rules,
      title: this.formGroup.value.title,
      totalNumbers: Number(this.formGroup.value.numberMax) - Number(this.formGroup.value.numberMin + 1),      
      datetimeUpdated: moment().format(),
      valuePrices: String(this.formGroup.value.valuePrices),
      promocoes: this.formGroup.value.promocoes,
      type: this.dataInfo.appType 
    }

    console.log('Adicionando ', produto)

    const key = this.db.adicionaProduto(produto)

    this.db.atualizaProduto({key: key})
    .then( () => {
      this.uiUtils.showAlert(this.dataText.success, this.dataText.addedSuccess).present()        
      this.navCtrl.popToRoot()
      this.navCtrl.push('ProdutosPage')
    })
    
    


  }

  defaultValues(){
    
  }

  selectPicture(){
    this.openMenu()
  }

  openFilePhoto(event){
      this.base64Image = event.srcElement.files[0];
  }

  picChange(event: any) {

    if(event.target.files && event.target.files[0]){
      let reader = new FileReader();

      reader.onload = (event:any) => {
        this.base64Image = event.target.result;
        this.photoChanged = true
      }
      reader.readAsDataURL(event.target.files[0]);
    }    
  }

  grabPicture() {
 
    let loading = this.uiUtils.showLoading(this.dataInfo.pleaseWait)      
    loading.present();

    this.camera.grabPicture().then((imageData) => {

      this.selectedPhoto  = this.dataInfo.dataURItoBlob('data:image/jpeg;base64,' + imageData);                  
      this.base64Image = 'data:image/jpeg;base64,' + imageData
      this.photoChanged = true
      loading.dismiss()

    }, (err) => {
      loading.dismiss()
    });
   }

    onSuccess = (snapshot) => {        
    this.base64Image = snapshot.downloadURL;
  }
  
  onError = (error) => {
   // console.log('error', error);
  }

  accessGallery(){    
     this.camera.getPicture().then((imageData) => {
      this.base64Image = 'data:image/jpeg;base64,' + imageData
      this.photoChanged = true

    }, (err) => {
     //console.log(err);
    });
   }

  delPicture(){
    this.base64Image = ""
  }      

  handlerCamera(){
    
    if(! this.dataInfo.isWeb)
      this.grabPicture()
    else
      this.uiUtils.showAlert(this.dataText.warning, "Disponível apenas no aplicativo mobile").present()
  }

  handlerGalery(){
    if(! this.dataInfo.isWeb)
      this.accessGallery()
    else
      this.uiUtils.showAlert(this.dataText.warning, "Disponível apenas no aplicativo mobile").present()
    
  }
  
  openMenu() {
    let actionSheet = this.actionsheetCtrl.create({
      title: this.dataInfo.titleChangePic,
      cssClass: 'action-sheets-basic-page',
      buttons: [
        {
          text: 'Camera',
          role: 'destructive',
          icon: !this.platform.is('ios') ? 'camera' : null,
          handler: () => {
            this.handlerCamera()
          }
        },
        {
          text: 'Album',
          icon: !this.platform.is('ios') ? 'albums' : null,
          handler: () => {
            this.handlerGalery()
          }
        },       
        {
          text: this.dataText.cancel,
          role: 'cancel',
          icon: !this.platform.is('ios') ? 'close' : null
        }
      ]
      
    });
    actionSheet.present();
  }    






}
