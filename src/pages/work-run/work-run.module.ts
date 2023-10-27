import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { WorkRunPage } from './work-run';
import { WorkRunOneComponent } from '../../components/work-run-one/work-run-one';
import { WorkRunTwoComponent } from '../../components/work-run-two/work-run-two';
import { WorkRunThreeComponent } from '../../components/work-run-three/work-run-three';
import { WorkRunFourComponent } from '../../components/work-run-four/work-run-four';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [
    WorkRunPage,    
    WorkRunOneComponent,
    WorkRunTwoComponent,
    WorkRunThreeComponent,
    WorkRunFourComponent
  ],
  imports: [
    IonicPageModule.forChild(WorkRunPage),
    
    TranslateModule.forChild()
  ],
})
export class WorkRunPageModule {}
