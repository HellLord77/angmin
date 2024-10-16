import {Routes} from '@angular/router';

import {DatumComponent} from './components/datum.component';
import {HomeComponent} from './components/home.component';
import {ItemComponent} from './components/item.component';
import {ServerComponent} from './components/server.component';

export const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: ':server', component: ServerComponent},
  {path: ':server/:item', component: ItemComponent},
  {path: ':server/:item/:datum', component: DatumComponent},
];
