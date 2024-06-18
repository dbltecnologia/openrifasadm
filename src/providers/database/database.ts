import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AuthProvider } from '../../providers/auth/auth';
import { DataInfoProvider } from '../../providers/data-info/data-info';
import * as moment from 'moment';

@Injectable()
export class DatabaseProvider {
  private db: AngularFireDatabase;
  private dateYear: string = moment().format('YYYY');
  private dateMonth: string = moment().format('MM');

  constructor(
    afDatabase: AngularFireDatabase, 
    private dataInfo: DataInfoProvider,
    private authProvider: AuthProvider
  ) {
    this.db = afDatabase;
  }

  // Saves the current user's token
  saveToken(currentToken: string) {
    if (!currentToken) return;
    const uid = this.authProvider.currentUserUid();
    return this.db.list(`/userProfile/${this.dataInfo.defaultState}`)
      .update(uid, { token: currentToken });
  }

  // Retrieves the configuration settings
  getAppConfig() {
    const path = `/configurations/${this.dataInfo.defaultState}/`;
    return this.db.list(path).snapshotChanges();
  }

  // Retrieves the current user's information
  getUser() {
    const uid = this.authProvider.currentUserUid();
    const path = `/userProfile/${this.dataInfo.defaultState}/`;
    return this.db.list(path, ref => ref.orderByKey().equalTo(uid)).snapshotChanges();
  }

  // Retrieves user information by user ID
  getUserUid(uid: string) {
    const path = `/userProfile/${this.dataInfo.defaultState}/`;
    return this.db.list(path, ref => ref.orderByChild("uid").equalTo(uid)).snapshotChanges();
  }

  // Updates a user's status
  updateUserStatus(uid: string, status: string) {
    return this.db.list(`/userProfile/${this.dataInfo.defaultState}`).update(uid, { status });
  }

  // Retrieves users by userType
  getUsers() {
    const path = `/userProfile/${this.dataInfo.defaultState}/`;
    return this.db.list(path, ref => ref.orderByChild("userType").equalTo(2)).snapshotChanges();
  }

  // Updates ranking for a user
  updateRankingUser(uid: string, ranking: number) {
    const path = `/userProfile/${this.dataInfo.defaultState}/`;
    return this.db.list(path).update(uid, { ranking });
  }

  // Updates profile status for a user
  updateProfileStatusUser(uid: string, status: string) {
    const path = `/userProfile/${this.dataInfo.defaultState}/`;
    return this.db.list(path).update(uid, { status });
  }

  // Retrieves work requests
  getWorksRequests(year: string, month: string) {
    const path = `/notificationsAll/${this.dataInfo.defaultState}/${year}/${month}/`;
    return this.db.list(path, ref => ref.orderByKey()).snapshotChanges();
  }
  
  updateStatusWork(work_, status){    

    const path = `/notificationsAll/${this.dataInfo.defaultState}/${this.dateYear}/${this.dateMonth}/`;

    let data = work_
    if(status == 'Central ciente'){
      data.datatimeCentralIsAware = moment().format()
    } else if(status == 'Ajuda chegou'){
      data.datatimeHelpArrived = moment().format()
    } else if(status == 'Finalizado'){
      data.datatimeFinished = moment().format()
    } else if(status == 'Cancelado'){
      data.datatimeCanceled = moment().format()
    }
    return this.db.list(path).update(work_.key, data)
  }

  // Retrieves all works for a user
  getAllWorks(year: string, month: string) {
    const uid = this.authProvider.currentUserUid();
    const path = `/notificationsAll/${this.dataInfo.defaultState}/${year}/${month}/`;
    return this.db.list(path, ref => ref.orderByChild('uid').equalTo(uid)).snapshotChanges();
  }

  // Retrieves a work request by key
  getWorksRequestKey(key: string) {
    const path = `/notificationsAll/${this.dataInfo.defaultState}/${this.dateYear}/${this.dateMonth}/`;
    return this.db.list(path, ref => ref.orderByKey().equalTo(key)).snapshotChanges();
  }

  // Saves latitude and longitude for a user
  saveLatLong(lat: string, long: string) {
    if (!lat || !long) return;
    const uid = this.authProvider.currentUserUid();
    const path = `/userProfile/${this.dataInfo.defaultState}/`;
    return this.db.list(path).update(uid, { latitude: lat, longitude: long });
  }

  // Retrieves all accepted works
  getAllWorksAccepteds(year: string, month: string) {
    const path = `/notificationsAll/${this.dataInfo.defaultState}/${year}/${month}/`;
    return this.db.list(path, ref => ref.orderByKey()).snapshotChanges();
  }


  // Removes a work request
  removeWorkRequest(key: string) {
    const path = `/notificationsAll/${this.dataInfo.defaultState}/${this.dateYear}/${this.dateMonth}/`;
    return this.db.list(path).remove(key);
  }

  // Removes all accepted works
  removeAllWorksAccepteds() {
    const path = `/notificationsAll/${this.dataInfo.defaultState}/`;
    return this.db.list(path).remove
   }

   getAllSettings(){

    let path = "/configurations/" + this.dataInfo.defaultState 
    
    return this.db.list(path, 
        ref => ref.orderByKey())
        .snapshotChanges()             
  }
  

    getProdutos() {
      const path = `/cards/`;
      return this.db.list(path, 
        ref => ref.orderByKey())
        .snapshotChanges()     
    }

    adicionaProduto(produto){
      const path = `/cards/`;
      return this.db.list(path).push(produto).key
    }


    atualizaProduto(produto){
      const path = `/cards/`;
      return this.db.list(path).update(produto.key, produto)
    }

    removerProduto(produto){
      const path = `/cards/`;
      return this.db.list(path).remove(produto.key)
    }


    getVendas() {

      const path = `/sales/`;
      return this.db.list(path, 
        ref => ref.orderByKey())
        .snapshotChanges()     
    }

    atualizaVenda(venda){
      const path = `/sales/`;
      return this.db.list(path).update(venda.key, venda)
    }


    adicionaSorteio(productKey){
      const path = `/sorteios/`;
      return this.db.list(path).push({productKey: productKey, datetime: moment().format()}).key
    }
    
    getSorteioKey(key){
      const path = `/sorteios/`;

      return this.db.list(path, 
        ref => ref.orderByKey()
        .equalTo(key))


        .snapshotChanges()   
    }

    getSorteios(){
      const path = `/sorteios/`;
      return this.db.list(path, 
        ref => ref.orderByKey())
        .snapshotChanges()     
    }

  }